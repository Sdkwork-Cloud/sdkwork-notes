> Migrated from `docs/架构/10-实施进度-保存失败反馈与重试状态机增量-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度-保存失败反馈与重试状态机增量

- 日期：`2026-04-07`
- 波次：`Wave-B / 第二十七轮推进`
- 所属 Step：`Step 05`
- 增量能力：`CP05-3 / 失败反馈与重试策略`

## 1. 本轮结论

本轮在上一轮“统一刷盘入口”基础上，继续完成了保存链的第三个关键增量：将保存失败后的重试生命周期与用户可见反馈正式收敛为统一状态机，并让编辑器、错误横幅与国际化资源共同消费同一份反馈模型。

当前真实状态：

1. `CP05-3 / 失败反馈与重试策略`：`L4`
2. `Step 05` 总体：`L2`
3. `Step 04`：保持 `L4`

## 2. 代码落地

### 2.1 状态机层

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSaveFeedback.ts`
  - 新增 `buildNotesWorkspaceSaveFeedbackModel()`
  - 新增 `resolveNotesWorkspaceSaveRequestState()`
  - 新增 `resolveNotesWorkspaceSaveSuccessState()`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/types/notesWorkspace.ts`
  - `NoteSaveState` 新增 `retrying / recovered`

### 2.2 Store 与页面层

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - 保存请求态改为 `dirty -> saving`、`error -> retrying`
  - 保存成功态改为 `saving -> saved`、`retrying/error -> recovered`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NoteEditorPane.tsx`
  - 改为消费统一 `saveFeedback` 模型
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx`
  - 错误横幅改为消费 `saveFeedback.bannerMessage`
  - 仅在 `saveFeedback.retryAvailable` 为真时暴露 `flushDraft`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceErrorBanner.tsx`
  - 支持 retry CTA

### 2.3 契约层与文案层

- `sdkwork-notes-pc-react/scripts/workspace-save-feedback.contract.test.mjs`
  - 新增保存失败反馈与重试状态机 contract
- `sdkwork-notes-pc-react/scripts/workspace-page-error-banner-boundary.contract.test.mjs`
  - 升级为验证 retry CTA
- `sdkwork-notes-pc-react/package.json`
  - 将新 contract 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 同步冻结新的脚本聚合链
- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/en-US.ts`
  - 新增 retrying / recovered / retrySave 英文文案
- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/zh-CN.ts`
  - 补齐对应中文文案

## 3. 验证结果

本轮重新确认通过的命令如下：

```powershell
node --test --experimental-test-isolation=none scripts/workspace-save-feedback.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-page-error-banner-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

补充说明：

1. `pnpm.cmd typecheck` 已重新执行 `test:workspace:contracts`，说明新增 contract 已进入总门禁。
2. PowerShell 中仍存在 conda/profile 噪音，但本轮所有命令退出码均为 `0`。
3. 包内 Vitest 仍受 `spawn EPERM` 限制，不作为本轮结论依据。

## 4. 能力闭环判定

### 4.1 已闭环项

1. 设计：已明确建立 `error -> retrying -> recovered` 显式状态机
2. 实现：编辑器、页面横幅与 store 已共享反馈模型
3. 测试：新增 contract 已先失败后通过
4. 验证：Node contract 与 typecheck 全部通过
5. 文档：review / 架构 / release 已同步
6. 集成：新 contract 已进入主门禁

### 4.2 未闭环项

1. save queue 串行编排
2. 自动退避与恢复观测
3. 切换笔记、危险操作、页面关闭前的 flush 证据矩阵

## 5. 下一轮建议

1. 为切换笔记、危险操作和页面关闭前三类高风险场景补齐统一 flush 证据。
2. 基于当前显式状态机建立 save queue，避免并发保存交叠。
3. 在 `retrying / recovered` 之上继续补齐退避策略、观测事件和恢复文案收口。

