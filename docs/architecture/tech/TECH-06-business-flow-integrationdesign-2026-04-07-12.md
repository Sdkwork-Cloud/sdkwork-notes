> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-统一刷盘入口补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06-业务流程-应用接口与集成设计-统一刷盘入口补充

- 日期：`2026-04-07`
- 关联 Step：`Step 05`
- 关联波次：`Wave-B / 第二十六轮推进`
- 关联能力：`CP05-2 / 统一刷盘入口`

## 1. 背景

在完成“可见性刷盘边界”后，当前产品又暴露出第二个保存链结构问题：手动保存、快捷键保存、页面隐藏刷盘都能触发保存，但它们没有共享同一个 flush 决策入口，导致保存语义分裂，失败重试也无法稳定复用同一链路。

该问题会直接影响后续三项核心能力的可实现性：

1. save queue 串行编排
2. 保存失败重试与恢复
3. 切换笔记与危险操作前的高风险刷盘控制

## 2. 当前真实实现

### 2.1 Autosave 计划模型

`noteWorkspaceAutosave.ts` 当前输出统一的 `NotesWorkspaceAutosavePlan`：

| 场景 | shouldSchedule | shouldFlush | shouldFlushOnPageHide | delayMs |
| --- | --- | --- | --- | --- |
| 活跃且未删除，`saveState = dirty` | `true` | `true` | `true` | `700` |
| 活跃且未删除，`saveState = error` | `false` | `true` | `true` | `null` |
| 活跃但已删除 | `false` | `false` | `false` | `null` |
| 无活跃笔记 | `false` | `false` | `false` | `null` |
| `idle / saved / saving` | `false` | `false` | `false` | `null` |

设计含义如下：

1. `shouldSchedule` 只表示“是否允许启动延迟 autosave 计时器”。
2. `shouldFlush` 表示“当前是否允许立即进入 flush 执行入口”。
3. `shouldFlushOnPageHide` 当前继续复用 `shouldFlush`，专门提供给页面隐藏类运行时边界。

### 2.2 统一执行入口

`NotesWorkspacePage.tsx` 当前将以下入口全部收敛到单一 `flushDraft`：

1. 编辑器手动保存：`onSave={flushDraft}`
2. 页面命令运行时：`persistActiveNote: flushDraft`
3. `pagehide` 触发器：通过 autosave runtime 调用 `flushDraft`
4. `visibilitychange(hidden)` 触发器：通过 autosave runtime 调用 `flushDraft`

### 2.3 当前集成边界

1. 页面负责 React effect 容器与 DOM 事件适配。
2. autosave runtime 负责时机装配。
3. autosave 计划模型负责判断可否调度与可否 flush。
4. store 仍负责真正的 `persistActiveNote()` 持久化执行。

## 3. 本轮设计收益

### 3.1 语义解耦

手动保存和失败重试不再依赖“页面隐藏”专属判断条件，`flush` 语义首次被提升为独立能力判断。

### 3.2 可恢复性增强

`saveState === 'error'` 现在被明确建模为“允许立即 flush，但不再自动重新调度延迟 autosave”，为后续重试按钮、自动退避、恢复提示打下正确语义基础。

### 3.3 后续扩展成本下降

后续引入 `save queue` 时，只需要围绕 `flushDraft` 做串行化与去重，不必再逐个回收编辑器保存、快捷键保存和页面隐藏保存。

## 4. 评估标准

### 4.1 设计评估标准

1. 保存链是否只有一个共享 flush 执行入口。
2. `schedule` 与 `flush` 语义是否已彻底拆分。
3. `error` 状态是否具备明确、可验证的重试语义。

### 4.2 实现评估标准

1. 页面不得再出现多套保存包装函数。
2. `persist-active-note` 页面命令、编辑器保存和隐藏态刷盘必须直接或间接复用同一 `flushDraft`。
3. autosave 计划输出必须可直接表达 dirty/error 两类不同处理策略。

### 4.3 测试评估标准

1. `workspace-autosave.contract.test.mjs` 必须冻结 `shouldFlush` 计划输出。
2. `workspace-save-flush-boundary.contract.test.mjs` 必须冻结统一入口事实。
3. 旧有 `workspace-autosave-runtime.contract.test.mjs` 与 `workspace-autosave-visibility-boundary.contract.test.mjs` 必须继续通过。

### 4.4 集成评估标准

1. 新 contract 必须进入 `test:workspace:contracts`。
2. `package-scripts-contract.test.mjs` 必须同步冻结新的脚本聚合链。
3. `pnpm.cmd typecheck` 必须重新跑通整条门禁链。

## 5. 当前结论

“统一刷盘入口”已经达到增量能力的 `L4`，但 Step 05 整体仍然停留在 `L2`，原因不是本轮能力不足，而是 Step 05 的后续主链仍未完成：

1. save queue 尚未建立
2. 失败重试状态机尚未建立
3. 高风险场景 flush 证据矩阵尚未建立

## 6. 下一轮设计约束

下一轮若继续推进 Step 05，必须遵守以下约束：

1. 不得绕过 `flushDraft` 新增第二套保存执行入口。
2. save queue 必须建立在 `shouldFlush + flushDraft` 这一层，而不是重新侵入编辑器或页面命令层。
3. 重试、退避、恢复提示的状态机设计必须与 `saveState === 'error'` 的当前语义保持一致。

