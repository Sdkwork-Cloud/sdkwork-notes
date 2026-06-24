> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-保存失败反馈与重试状态机补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06-业务流程-应用接口与集成设计-保存失败反馈与重试状态机补充

- 日期：`2026-04-07`
- 关联 Step：`Step 05`
- 关联波次：`Wave-B / 第二十七轮推进`
- 关联能力：`CP05-3 / 失败反馈与重试策略`

## 1. 背景

在完成“统一刷盘入口”后，当前产品仍然暴露出第三个保存链结构问题：虽然所有保存入口已经统一收敛到 `flushDraft`，但失败之后的反馈与恢复语义仍然停留在单一 `error` 状态，导致 store、编辑器、横幅和国际化层无法共享同一份状态解释。

该问题会直接影响后续三项核心能力的可实现性：

1. save queue 串行编排
2. 自动退避与恢复观测
3. 高风险场景下的统一保存确认

## 2. 当前真实实现

### 2.1 保存状态机

`notesWorkspace.ts` 当前将 `NoteSaveState` 明确定义为：

1. `idle`
2. `dirty`
3. `saving`
4. `saved`
5. `error`
6. `retrying`
7. `recovered`

`noteWorkspaceSaveFeedback.ts` 同时提供两条显式迁移规则：

1. `resolveNotesWorkspaceSaveRequestState(saveState)`
   - `dirty -> saving`
   - `error -> retrying`
2. `resolveNotesWorkspaceSaveSuccessState(saveState)`
   - `saving -> saved`
   - `retrying / error -> recovered`

### 2.2 统一反馈模型

`buildNotesWorkspaceSaveFeedbackModel()` 当前输出统一的 `NotesWorkspaceSaveFeedbackModel`：

| 字段 | 含义 | 当前规则 |
| --- | --- | --- |
| `statusKey` | 状态文案 key | `notes.editor.status.${saveState}` |
| `canManualSave` | 是否允许手动保存 | `dirty` 或 `error` |
| `isBusy` | 是否显示忙态 | `saving` 或 `retrying` |
| `bannerMessage` | 错误横幅消息 | `errorMessage` |
| `retryAvailable` | 是否允许显示重试 | `saveState === 'error'` |

### 2.3 UI 集成边界

1. `NoteEditorPane.tsx`
   - 只消费 `saveFeedback.statusKey`
   - 只消费 `saveFeedback.canManualSave`
   - 只消费 `saveFeedback.isBusy`
2. `NotesWorkspacePage.tsx`
   - 只消费 `saveFeedback.bannerMessage`
   - 只在 `saveFeedback.retryAvailable` 为真时暴露 `onRetry={flushDraft}`
3. `NotesWorkspaceErrorBanner.tsx`
   - 支持可选 `retryLabel / onRetry`
   - 保持错误提示边界组件化，不把 retry CTA 重新回灌到页面内联 JSX

### 2.4 当前集成约束

1. 页面负责 React effect 容器、命令入口绑定与错误横幅装配。
2. save feedback service 负责保存反馈模型与状态迁移规则。
3. store 负责真实持久化调用与 `errorMessage` 更新。
4. autosave 计划层仍只允许 `dirty` 进入延迟调度，`retrying / recovered` 不会自动重建新的 autosave 计时器。

## 3. 本轮设计收益

### 3.1 状态语义显式化

保存失败不再只是一个不可细分的 `error` 终态，而是被提升为可验证的 `error -> retrying -> recovered` 生命周期。

### 3.2 UI 反馈统一化

编辑器状态徽标、保存按钮和错误横幅不再分别维护独立条件判断，而是全部复用同一反馈模型。

### 3.3 扩展成本下降

后续引入退避、重试计数、恢复提示自动消退或遥测埋点时，只需要围绕 save feedback service 和 store 演进，不需要再次回收页面与编辑器层的散落逻辑。

## 4. 评估标准

### 4.1 设计评估标准

1. 保存失败后的状态是否具备显式 lifecycle，而不是只有单一 `error`。
2. UI 反馈是否由统一服务建模，而不是页面与组件各自判断。
3. 重试入口是否与统一 `flushDraft` 语义保持一致。

### 4.2 实现评估标准

1. `NoteSaveState` 必须包含 `retrying / recovered`。
2. store 请求态与成功态必须通过显式 helper 决策。
3. 编辑器与页面不得继续复制保存状态判断逻辑。
4. 错误横幅必须支持与 store 状态机对齐的 retry CTA。

### 4.3 测试评估标准

1. `workspace-save-feedback.contract.test.mjs` 必须冻结显式状态机与反馈模型。
2. `workspace-page-error-banner-boundary.contract.test.mjs` 必须冻结 retry CTA 边界。
3. 旧有 `workspace-autosave.contract.test.mjs` 与 `workspace-save-flush-boundary.contract.test.mjs` 必须继续成立。

### 4.4 集成评估标准

1. 新 contract 必须进入 `test:workspace:contracts`。
2. `package-scripts-contract.test.mjs` 必须同步冻结新的脚本聚合链。
3. `pnpm.cmd typecheck` 必须重新跑通整条门禁链。
4. `zh-CN / en-US` 必须同步补齐新增 key，禁止商业化交付环境出现翻译回退。

## 5. 当前结论

“失败反馈与重试状态机”已经达到增量能力的 `L4`，但 Step 05 整体仍然停留在 `L2`，原因不是本轮能力不足，而是 Step 05 的后续主链仍未完成：

1. save queue 尚未建立
2. 自动退避与恢复观测尚未建立
3. 高风险场景 flush 证据矩阵尚未建立

## 6. 下一轮设计约束

下一轮若继续推进 Step 05，必须遵守以下约束：

1. 不得绕过 `flushDraft` 新增第二套重试入口。
2. save queue 必须直接建立在当前显式 save lifecycle 之上，而不是再新增隐式标志位。
3. 自动退避若引入，必须同时补齐可见反馈、取消条件与观测事件。
4. 高风险场景 contract 必须验证“先 flush 再切换/删除/退出”，不能只验证页面文案提示。

