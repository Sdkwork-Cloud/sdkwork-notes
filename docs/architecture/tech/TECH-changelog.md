> Migrated from `docs/release/CHANGELOG.md` on 2026-06-24.
> Owner: SDKWork maintainers

# CHANGELOG
## [Unreleased] - 2026-04-14 / Step 08 工作区同步阻塞问题恢复动作语义与受影响笔记定位
### Added

- `docs/step/08-工作区同步阻塞问题恢复动作语义与受影响笔记定位-2026-04-14.md` 记录本轮恢复动作语义、受影响笔记定位、风险控制与下一轮入口。
- `docs/review/step-08-工作区同步阻塞问题恢复动作语义审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08工作区同步阻塞问题恢复动作语义与受影响笔记定位-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-工作区同步阻塞问题恢复动作语义与受影响笔记定位-2026-04-14.md`
- `docs/release/最新版本说明-第六十四轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSelectors.ts`
  - `syncSummary` 已新增 `primaryEntityId` 与 `primaryMessage`，把主阻塞任务对应的受影响笔记身份与可读问题消息显式导出。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspacePagePresentationModel.ts`
  - `syncCard` 已新增 `actionKind` 与 `actionTargetNoteId`。
  - 当前动作语义已冻结为：
    - `failed / conflict + primaryEntityId -> review-note`
    - 否则 `pendingCount > 0 -> retry-sync`
  - “最新问题”明细已优先展示 `primaryMessage`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx`
  - 页面层已按 `actionKind` 正确分流到 `requestSyncDrain()` 或 `selectNote(noteId)`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/en-US.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/zh-CN.ts`
  - 已补齐 `notes.actions.reviewSyncIssue`。
- `sdkwork-notes-pc-react/scripts/workspace-view-model.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-page-presentation-model.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-page-container-boundary.contract.test.mjs`
  - 已补齐新的动作语义与页面接线合同。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加工作区同步阻塞问题恢复动作语义与受影响笔记定位事实，并保持 `Step 08 = L2`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-view-model.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-presentation-model.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 工作区同步阻塞问题恢复动作语义与受影响笔记定位 = L3`

## [Unreleased] - 2026-04-14 / Step 08 工作区同步队列状态可视化与手动drain入口
### Added

- `docs/step/08-工作区同步队列状态可视化与手动drain入口-2026-04-14.md` 记录本轮工作区同步卡片、手动 drain 入口、风险控制与下一轮入口。
- `docs/review/step-08-工作区同步队列状态可视化与手动drain入口审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08工作区同步队列状态可视化与手动drain入口-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-工作区同步队列状态可视化与手动drain入口-2026-04-14.md`
- `docs/release/最新版本说明-第六十三轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`
  - `NotesSyncQueueStore` 已支持 `subscribe(listener)`，browser queue store 会在 `saveQueue()` / `clearQueue()` 后发布最新 snapshot。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - 已新增 `syncQueueSnapshot` 与 `requestSyncDrain()`，并在 initialize / enqueue / drain / subscribe 路径同步队列快照。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSelectors.ts`
  - 已新增 `syncSummary` 作为工作区同步概览出口。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspacePagePresentationModel.ts`
  - 已新增 `syncCard`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceInsightsPanel.tsx`
  - 已新增 `workspace-sync-card` 与可选手动 drain action。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx`
  - 已接入 `syncQueueSnapshot`、`syncSummary` 与 `requestSyncDrain()`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/en-US.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/zh-CN.ts`
  - 已补齐 `notes.sync.*` 与 `notes.actions.retrySync`。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加工作区同步队列状态可视化与手动 drain 入口事实，并保持 `Step 08 = L2`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-view-model.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-presentation-model.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 工作区同步队列状态可视化与手动drain入口 = L3`

## [Unreleased] - 2026-04-14 / Step 08 app-sdk远程apply生成产物合同冻结
### Added

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-generated-output.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs`
- `docs/step/08-app-sdk远程apply生成产物合同冻结-2026-04-14.md` 记录本轮 generated output contract、风险控制与下一轮入口。
- `docs/review/step-08-app-sdk远程apply生成产物合同冻结审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08app-sdk远程apply生成产物合同冻结-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-app-sdk远程apply生成产物合同冻结-2026-04-14.md`
- `docs/release/最新版本说明-第六十二轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已把 `workspace-sync-app-sdk-generated-output-contract.test.mjs` 纳入 `test:workspace:contracts` 与脚本门禁。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加 app-sdk 远程 apply 生成产物合同冻结事实，并保持 `Step 08 = L2`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply生成产物合同冻结 = L3`

## [Unreleased] - 2026-04-14 / Step 08 app-sdk远程apply上游闭环输入合同冻结
### Added

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-upstream-closure.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs`
- `docs/step/08-app-sdk远程apply上游闭环输入合同冻结-2026-04-14.md` 记录本轮 app-api / OpenAPI / generator handoff contract、风险控制与下一轮入口。
- `docs/review/step-08-app-sdk远程apply上游闭环输入合同冻结审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08app-sdk远程apply上游闭环输入合同冻结-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-app-sdk远程apply上游闭环输入合同冻结-2026-04-14.md`
- `docs/release/最新版本说明-第六十一轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已把 `workspace-sync-app-sdk-upstream-closure-contract.test.mjs` 纳入 `test:workspace:contracts` 与脚本门禁。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加 app-sdk 远程 apply 上游闭环输入合同冻结事实，并保持 `Step 08 = L2`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply上游闭环输入合同冻结 = L3`

## [Unreleased] - 2026-04-14 / Step 08 app-sdk远程apply共享包装服务合同冻结
### Added

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-service.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-service-contract.test.mjs`
- `docs/step/08-app-sdk远程apply共享包装服务合同冻结-2026-04-14.md` 记录本轮 shared-wrapper public service contract、风险控制与下一轮入口。
- `docs/review/step-08-app-sdk远程apply共享包装服务合同冻结审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08app-sdk远程apply共享包装服务合同冻结-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-app-sdk远程apply共享包装服务合同冻结-2026-04-14.md`
- `docs/release/最新版本说明-第六十轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已把 `workspace-sync-app-sdk-service-contract.test.mjs` 纳入 `test:workspace:contracts` 与脚本门禁。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加 app-sdk 远程 apply 共享包装服务合同冻结事实，并保持 `Step 08 = L2`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-service-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply共享包装服务合同冻结 = L3`

## [Unreleased] - 2026-04-14 / Step 08 app-sdk远程apply结果适配合同冻结
### Added

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-result-adapter.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs`
- `docs/step/08-app-sdk远程apply结果适配合同冻结-2026-04-14.md` 记录本轮 result adapter contract、风险控制与下一轮入口。
- `docs/review/step-08-app-sdk远程apply结果适配合同冻结审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08app-sdk远程apply结果适配合同冻结-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-app-sdk远程apply结果适配合同冻结-2026-04-14.md`
- `docs/release/最新版本说明-第五十九轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已把 `workspace-sync-app-sdk-result-adapter-contract.test.mjs` 纳入 `test:workspace:contracts` 与脚本门禁。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加 app-sdk 远程 apply 结果适配合同冻结事实，并保持 `Step 08 = L2`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply结果适配合同冻结 = L3`

## [Unreleased] - 2026-04-14 / Step 08 app-sdk远程apply目标合同冻结
### Added

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-target.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-target-contract.test.mjs`
- `docs/step/08-app-sdk远程apply目标合同冻结-2026-04-14.md` 记录本轮 target contract、风险控制与下一轮入口。
- `docs/review/step-08-app-sdk远程apply目标合同冻结审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08app-sdk远程apply目标合同冻结-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-app-sdk远程apply目标合同冻结-2026-04-14.md`
- `docs/release/最新版本说明-第五十八轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已把 `workspace-sync-app-sdk-target-contract.test.mjs` 纳入 `test:workspace:contracts` 与脚本门禁。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加 app-sdk 远程 apply 目标合同冻结事实，并保持 `Step 08 = L2`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply目标合同冻结 = L3`

## [Unreleased] - 2026-04-14 / Step 08 app-sdk远程apply合同缺口审计
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-contract.test.mjs`
- `docs/step/08-app-sdk远程apply合同缺口审计-2026-04-14.md` 记录本轮 app-sdk 合同缺口、风险控制与下一轮入口。
- `docs/review/step-08-app-sdk远程apply合同缺口审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08app-sdk远程apply合同缺口审计-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-app-sdk远程apply合同缺口审计-2026-04-14.md`
- `docs/release/最新版本说明-第五十七轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已把 `workspace-sync-app-sdk-contract.test.mjs` 纳入 `test:workspace:contracts` 与脚本门禁。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加 app-sdk 远程 apply 合同缺口审计事实，并保持 `Step 08 = L2`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply合同缺口审计 = L3`

## [Unreleased] - 2026-04-14 / Step 08 应用壳与桌面bootstrap远程apply顶层注入边界
### Added

- `docs/step/08-应用壳与桌面bootstrap远程apply顶层注入边界-2026-04-14.md` 记录本轮顶层 caller wiring、风险控制与下一轮入口。
- `docs/review/step-08-应用壳与桌面bootstrap远程apply顶层注入边界审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08应用壳与桌面bootstrap远程apply顶层注入边界-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-应用壳与桌面bootstrap远程apply顶层注入边界-2026-04-14.md`
- `docs/release/最新版本说明-第五十六轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-shell/src/application/providers/AppProviders.tsx`
  - `AppProviders` 现在会真实透传 `notesWorkspaceBootstrapOptions` 到 `AppProvidersContent`，不再只是类型层声明。
- `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs`
  - 已修正旧的 `bootstrapNotesWorkspaceStore()` 断言口径，并新增 `AppProviders -> AppProvidersContent` 真实透传 contract。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop/src/desktop/bootstrap/DesktopBootstrapApp.test.tsx`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop/src/desktop/bootstrap/createDesktopApp.test.tsx`
  - 已把 mock 签名收敛为显式接收 props，保证顶层注入断言不会在 `pnpm.cmd typecheck` 中制造测试类型回退。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加应用壳与桌面bootstrap顶层注入边界的最新事实与阶段判断。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 应用壳与桌面bootstrap远程apply顶层注入边界 = L3`

## [Unreleased] - 2026-04-14 / Step 08 工作区remote-apply装配边界
### Added

- `docs/step/08-工作区remote-apply装配边界-2026-04-14.md` 记录本轮工作区 runtime / bootstrap 对 `apply(request)` 的装配边界。
- `docs/review/step-08-工作区remote-apply装配边界审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08工作区remote-apply装配边界-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-工作区remote-apply装配边界-2026-04-14.md`
- `docs/release/最新版本说明-第五十五轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSyncRuntime.ts`
  - `createNotesWorkspaceSyncRuntime(...)` 现在既支持 `execute(task)`，也支持 `apply(request)`。
  - `apply(request)` 路径复用 `createNotesSyncRemoteApplyExecutor({ apply })`，不在 workspace 层复制第二套 request 映射逻辑。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/bootstrap/notesWorkspaceStoreBootstrap.ts`
  - `bootstrapNotesWorkspaceStore(...)` 现在支持显式 `apply(request)` 注入。
- `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs`
  - 已新增相应 contract，冻结 runtime / bootstrap 的 `apply(request)` 装配语义。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加工作区层消费 `apply(request)` 的最新事实与当前状态判断。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 工作区remote-apply装配边界 = L3`

## [Unreleased] - 2026-04-14 / Step 08 同步任务远端apply幂等边界
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-remote-apply.contract.test.mjs`
- `docs/step/08-同步任务远端apply幂等边界-2026-04-14.md` 记录本轮 remote apply / 幂等请求边界、风险控制与下一轮入口。
- `docs/review/step-08-同步任务远端apply幂等边界审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08同步任务远端apply幂等边界-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-同步任务远端apply幂等边界-2026-04-14.md`
- `docs/release/最新版本说明-第五十四轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`
  - 新增 `NotesSyncRemoteApplyRequest`。
  - 新增 `createNotesSyncRemoteApplyRequest(task)` 与 `createNotesSyncRemoteApplyExecutor({ apply })`。
  - remote apply request 显式冻结 `idempotencyKey / taskId / entityType / entityId / operation / localRevision / baseRemoteCursor / mutation`。
  - 请求转换时会复制 `mutation` payload，避免 transport 层原地改写队列对象。
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已把 `workspace-sync-remote-apply.contract.test.mjs` 纳入 `test:workspace:contracts` 与脚本门禁。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加 remote apply / 幂等请求边界的最新事实与当前状态判断。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 同步任务远端apply幂等边界 = L3`

## [Unreleased] - 2026-04-14 / Step 08 同步任务回放安全边界
### Added

- `docs/step/08-同步任务回放安全边界-2026-04-14.md` 记录本轮 replay 安全边界、风险控制与下一轮入口。
- `docs/review/step-08-同步任务回放安全边界审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08同步任务回放安全边界-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-同步任务回放安全边界-2026-04-14.md`
- `docs/release/最新版本说明-第五十三轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`
  - 为 `NotesSyncTask` 新增 `replayable` 合同。
  - 为 `CreateNotesSyncTaskInput` 新增可选 `replayable` 输入，并统一缺省为 `false`。
  - 新增终态失败码 `replay-disabled`。
  - legacy 队列读取时会将缺失 `replayable` 的任务回填为 `false`。
  - `executeNextNotesSyncTask()` 现在会拒绝执行 `replayable: false` 的 queued task，并终态回写 `failed(replay-disabled)`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - `createNote / persistActiveNote / toggleFavorite / moveNoteToTrash / restoreNoteFromTrash / moveNote / deleteNotePermanently / clearTrash` 现已统一显式写入 `replayable: false`。
- `sdkwork-notes-pc-react/scripts/workspace-sync-state-machine.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-queue.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-worker.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-worker-runtime.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.test.ts`
  - 以上测试已对齐 `replayable` 合同与 `replay-disabled` 失败语义。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加入队任务回放安全边界的最新事实与当前状态判断。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-state-machine.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-queue.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-worker.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-worker-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 同步任务回放安全边界 = L3`

## [Unreleased] - 2026-04-14 / Step 08 同步任务 payload 冻结与 schema 升级
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts` 为 `NotesSyncTask` 新增 `mutation` 合同，冻结 `upsert / move / delete / restore / permanent-delete` 的最小执行意图。
- `docs/step/08-同步任务payload冻结-2026-04-14.md` 记录本轮切片、风险边界与下一轮入口。
- `docs/review/step-08-同步任务payload冻结审计-2026-04-14.md` 记录审计结论、残余风险与验证证据。
- `docs/架构/10-实施进度-Step08同步任务payload冻结-2026-04-14.md` 记录本轮实施进度。
- `docs/release/Step08-同步任务payload冻结-2026-04-14.md`
- `docs/release/最新版本说明-第五十二轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`
  - 同步队列 schema 从 `1` 升级到 `2`。
  - schema 1 legacy envelope 现在会显式降级为空队列。
  - worker / worker runtime / runtime boundary 继续沿用原执行语义，但改为消费显式 `mutation` 任务。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - `createNote / persistActiveNote / toggleFavorite / moveNoteToTrash / restoreNoteFromTrash / moveNote / deleteNotePermanently / clearTrash` 现在都会把显式 `mutation` 写入 queue snapshot。
- `sdkwork-notes-pc-react/scripts/workspace-sync-state-machine.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-queue.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-worker.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-worker-runtime.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`
  - 以上 Node contract 已对齐新任务结构并全部通过。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 已追加本轮 payload 冻结与 schema 升级事实。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-state-machine.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-queue.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-worker.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-worker-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 同步任务 payload 冻结 = L3`

## [Unreleased] - 2026-04-14 / Step 08 工作区 store bootstrap 装配边界
### Added

- `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs` 新增 3 个 Node contract，锁定工作区 store 的 bootstrap 替换、selector 读取与 reset 语义。
- `docs/step/08-工作区store-bootstrap装配边界-2026-04-14.md` 记录本轮切片、状态与剩余缺口。
- `docs/review/step-08-工作区store-bootstrap装配边界审计-2026-04-14.md` 记录本轮审计结论与残余风险。
- `docs/架构/10-实施进度-Step08工作区store-bootstrap装配边界-2026-04-14.md` 记录 Step 08 本轮实施进度。
- `docs/release/Step08-工作区store-bootstrap装配边界-2026-04-14.md`
- `docs/release/最新版本说明-第五十轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - `notesWorkspaceStore` 改为可重绑定的 live binding。
  - 新增 `getNotesWorkspaceStore()`、`setNotesWorkspaceStore(store)`、`configureNotesWorkspaceStore(overrides?)`、`resetNotesWorkspaceStore()`。
  - `useNotesWorkspaceStore(...)` 改为基于 `zustand/useStore` 的 wrapper hook，始终读取当前导出的 store。
- `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-startup-recovery-smoke.contract.test.mjs`
  - 以上 Node contract stub 补齐 `useStore(...)`，适配新的 store 导出形态。
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 保持 `workspace-store-bootstrap.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `docs/step/08-同步队列与冲突恢复一期.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/release/最新版本说明.md`
  - 追加本轮 store bootstrap 装配边界说明。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-startup-recovery-smoke.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / notes-notes 工作区 store bootstrap 装配边界 = L3`

## [Unreleased] - 2026-04-14 / Step 08 工作区 sync runtime 边界接线
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSyncRuntime.ts` 已新增 workspace-side `NotesWorkspaceSyncRuntime` 接口与 `createNotesWorkspaceSyncRuntime(...)` 工厂，把 `notes-sync` worker runtime 收敛为 `notes-notes` 可消费的包内边界。
- `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs` 已新增 3 条 Node contract，冻结 runtime 工厂委托、`createNote` drain、`initialize` replay 三条工作区边界语义。
- 新增本轮 Step / review / 架构进度 / release 文档：
  - `docs/step/08-工作区sync-runtime边界接线-2026-04-14.md`
  - `docs/review/step-08-工作区sync-runtime边界接线审计-2026-04-14.md`
  - `docs/架构/10-实施进度-Step08工作区sync-runtime边界接线-2026-04-14.md`
  - `docs/release/Step08-工作区sync-runtime边界接线-2026-04-14.md`
  - `docs/release/最新版本说明-第四十九轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - 新增可选 `syncRuntime` 依赖。
  - note 队列写入成功后现在会请求 `requestDrain()`。
  - `initialize()` 成功后现在会主动请求 queued/retrying replay。
  - 同步异常提示已从“failed to enqueue sync task”收敛为更准确的“failed to schedule sync work”。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/index.ts`
  - 已导出新的 workspace sync runtime 边界。
- `sdkwork-notes-pc-react/package.json`
  - `test:workspace:contracts` 已纳入 `workspace-sync-runtime-boundary.contract.test.mjs`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已同步冻结新的根级合同脚本编排。
- `docs/step/08-同步队列与冲突恢复一期.md`
  - 已补记 `notes-notes` 工作区 runtime 边界接线事实，并将该子切片状态更新为 `L3`。
- `docs/架构/07-性能-离线-搜索-同步设计.md`
  - 已从“runtime 尚未接入 `notes-notes`”更新为“已有 workspace-side runtime 边界，但仍缺默认 bootstrap 与真实 handler”。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = L4`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / notes-notes 工作区 sync runtime 边界接线 = L3`
- `Step 08` 当前整体维持 `L2`

## [Unreleased] - 2026-04-14 / Step 08 worker 运行时调度闭环
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-worker-runtime.contract.test.mjs` 已新增 4 条 Node contract，冻结 `notes-sync` worker runtime 的最小调度语义：串行 drain、重叠请求合并、最早 retry 自动回放、`dispose()` 清理 timer。
- 新增本轮 Step / review / 架构进度 / release 文档：
  - `docs/step/08-队列worker运行时调度闭环-2026-04-14.md`
  - `docs/review/step-08-worker运行时调度审计-2026-04-14.md`
  - `docs/架构/10-实施进度-Step08队列worker运行时调度闭环-2026-04-14.md`
  - `docs/release/Step08-同步队列worker运行时调度闭环-2026-04-14.md`
  - `docs/release/最新版本说明-第四十八轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`
  - 新增 `createNotesSyncWorkerRuntime(...)`。
  - 新增 `NotesSyncWorkerScheduler`、`CreateNotesSyncWorkerRuntimeOptions`、`NotesSyncWorkerRuntime`。
  - runtime 现已固定“串行 drain -> 重入合并 -> 最早 retry 调度 -> 自动回放 -> dispose 清理”的最小运行时闭环。
- `sdkwork-notes-pc-react/package.json`
  - `test:workspace:contracts` 已纳入 `workspace-sync-worker-runtime.contract.test.mjs`，后续根级合同门禁会自动覆盖运行时调度边界。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已同步冻结新的合同脚本编排，防止 runtime contract 脱离根级验收。
- `docs/step/08-同步队列与冲突恢复一期.md`
  - 已把 `CP08-4` 的当前覆盖事实扩展到 worker runtime 调度语义，并把运行时子切片状态更新为 `L3`。
- `docs/架构/07-性能-离线-搜索-同步设计.md`
  - 已从“缺少 runtime 调度边界”更新为“已有 package-local worker runtime，但仍缺真实 handler、ack 应用与运行时接线”。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-worker-runtime.contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = L4`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / notes-sync worker 运行时调度闭环 = L3`
- `Step 08` 当前整体维持 `L2`

## [Unreleased] - 2026-04-14 / Step 08 队列 worker 最小执行闭环
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-worker.contract.test.mjs` 已新增 5 条 Node contract，冻结 `notes-sync` worker 的最小执行语义：oldest queued 选择、到期 retry 释放、成功回执、冲突回写、retryable 与 terminal failure 分流。
- 新增本轮 Step / review / 架构进度 / release 文档：
  - `docs/step/08-队列worker最小执行闭环-2026-04-14.md`
  - `docs/review/step-08-失败恢复验证-2026-04-14.md`
  - `docs/架构/10-实施进度-Step08队列worker最小执行闭环-2026-04-14.md`
  - `docs/release/Step08-同步队列worker最小执行闭环-2026-04-14.md`
  - `docs/release/最新版本说明-第四十七轮推进补记-2026-04-14.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`
  - 新增 `executeNextNotesSyncTask(...)`。
  - executor 现已固定执行“释放到期 retrying -> 选择 oldest queued -> 持久化 running -> 执行 handler -> 回写 completed/retrying/failed/conflict”的最小闭环。
- `sdkwork-notes-pc-react/package.json`
  - `test:workspace:contracts` 已纳入 `workspace-sync-worker.contract.test.mjs`，后续根级合同门禁会自动覆盖 worker 语义。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已同步冻结新的合同脚本编排，防止 worker contract 脱离根级验收。
- `docs/step/08-同步队列与冲突恢复一期.md`
  - 已把 `CP08-4` 从“未开始”更新为“已启动”，并补记当前已冻结的 worker 执行语义。
- `docs/架构/07-性能-离线-搜索-同步设计.md`
  - 已从“只有直接远端保存”修正为“已有最小同步骨架 + package-local executor，但仍缺真实 transport / UI / runtime 集成”。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-worker.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-state-machine.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-queue.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd --filter @sdkwork/notes-sync typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = L4`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / notes-sync worker 最小执行闭环 = L3`
- `Step 08` 当前整体维持 `L2`

## [Unreleased] - 2026-04-13 / Step 08 主写入路径接入收口
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-state-machine.contract.test.mjs` 现在显式冻结 `permanent-delete` 为 `@sdkwork/notes-sync` 的独立 operation，避免后续把软删除与永久删除重新压回同一事实类型。
- `sdkwork-notes-pc-react/scripts/workspace-sync-queue.contract.test.mjs` 新增 `permanent-delete` queue snapshot 合同，证明队列持久化层能够稳定接受新的操作类型。
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 新增三条真实主写入合同：
  - `deleteNotePermanently -> note/permanent-delete/queued`
  - `toggleFavorite -> note/upsert/queued`
  - `clearTrash -> 多条 note/permanent-delete/queued`
- 新增本轮审计、进度、Step 与发布文档：
  - `docs/step/08-主写入路径接入-收口-2026-04-13.md`
  - `docs/review/step-08-主写入路径收口审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step08主写入路径接入收口-2026-04-13.md`
  - `docs/release/Step08-主写入路径接入-收口-2026-04-13.md`
  - `docs/release/最新版本说明-第四十六轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts` 的 operation 集从 `upsert / delete / restore / move` 扩展为 `upsert / delete / restore / move / permanent-delete`，为永久删除补齐稳定语义。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - 新增 `enqueueNotesSyncTasks(...)` 批量入队 helper，避免 `clearTrash` 走多次 load/save 的中间态。
  - `deleteNotePermanently()` 现已接入 `note/permanent-delete` 队列任务。
  - `toggleFavorite()` 的 clean-save 成功路径现已接入 `note/upsert` 队列任务。
  - `clearTrash()` 现已在一次 queue snapshot 中追加多条 `note/permanent-delete` 任务。
- `docs/step/08-同步队列与冲突恢复一期.md` 与 `docs/架构/07-性能-离线-搜索-同步设计.md` 已同步回写当前 operation 事实与 `CP08-3` 收口状态。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-state-machine.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-queue.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-sync typecheck`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = L4`
- `CP08-4 / 冲突与失败恢复验证 = 未开始`
- `Step 08` 当前整体维持 `L2`

## [Unreleased] - 2026-04-13 / Step 08 主写入路径接入 moveNote 增量
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 新增 `moveNote` 成功后必须向 `@sdkwork/notes-sync` 追加 `queued` 移动任务的主写入合同，明确冻结任务时间戳优先使用移动后 `updatedAt`，避免后续回退成“移动成功但没有同步任务”。
- 新增本轮审计、进度、Step 与发布文档：
  - `docs/step/08-主写入路径接入-moveNote增量-2026-04-13.md`
  - `docs/review/step-08-主写入路径moveNote接入审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step08主写入路径接入moveNote-2026-04-13.md`
  - `docs/release/Step08-主写入路径接入-moveNote-2026-04-13.md`
  - `docs/release/最新版本说明-第四十五轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 在 `moveNote()` 的 `apply` 成功路径新增 `note/move` 队列任务接线，使当前 `notes-sync` operation 集支持的四类 note 任务都进入真实主写入链。
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 现在同时覆盖 `createNote`、`persistActiveNote`、`moveNoteToTrash`、`restoreNoteFromTrash` 与 `moveNote` 五条真实主写入队列路径，提升 `CP08-3` 的主链证据密度。
- 本轮显式触发策略切换：原计划的 `deleteNotePermanently` 因当前 `notes-sync` operation 模型缺少独立 `permanent-delete` 语义而暂缓接入，避免把“移入废纸篓”和“永久删除”混成同一任务事实。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = 进行中`
- `CP08-3 / createNote 增量 = L3`
- `CP08-3 / persistActiveNote 增量 = L3`
- `CP08-3 / moveNoteToTrash 增量 = L3`
- `CP08-3 / restoreNoteFromTrash 增量 = L3`
- `CP08-3 / moveNote 增量 = L3`
- `CP08-4 / 冲突与失败恢复验证 = 未开始`
- `Step 08` 当前整体维持 `L2`

## [Unreleased] - 2026-04-13 / Step 08 主写入路径接入 restoreNoteFromTrash 增量
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 新增 `restoreNoteFromTrash` 成功后必须向 `@sdkwork/notes-sync` 追加 `queued` 恢复任务的主写入合同，明确冻结任务时间戳使用恢复结果 `updatedAt`，避免后续回退成“恢复成功但没有同步任务”。
- 新增本轮审计、进度、Step 与发布文档：
  - `docs/step/08-主写入路径接入-restoreNoteFromTrash增量-2026-04-13.md`
  - `docs/review/step-08-主写入路径restoreNoteFromTrash接入审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step08主写入路径接入restoreNoteFromTrash-2026-04-13.md`
  - `docs/release/Step08-主写入路径接入-restoreNoteFromTrash-2026-04-13.md`
  - `docs/release/最新版本说明-第四十四轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 继续复用 `enqueueNoteSyncTask(noteId, operation, atValue)`，并在 `restoreNoteFromTrash()` 成功路径新增 `note/restore` 队列任务接线。
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 现在同时覆盖 `createNote`、`persistActiveNote`、`moveNoteToTrash` 与 `restoreNoteFromTrash` 四条真实主写入队列路径，提升 `CP08-3` 的主链证据密度。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = 进行中`
- `CP08-3 / createNote 增量 = L3`
- `CP08-3 / persistActiveNote 增量 = L3`
- `CP08-3 / moveNoteToTrash 增量 = L3`
- `CP08-3 / restoreNoteFromTrash 增量 = L3`
- `CP08-4 / 冲突与失败恢复验证 = 未开始`
- `Step 08` 当前整体维持 `L2`

## [Unreleased] - 2026-04-13 / Step 08 主写入路径接入 moveNoteToTrash 增量
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 新增 `moveNoteToTrash` 成功后必须向 `@sdkwork/notes-sync` 追加 `queued` 删除任务的主写入合同，明确冻结任务时间戳优先使用删除事实 `deletedAt`，避免后续回退成“移入废纸篓成功但没有同步任务”。
- 新增本轮审计、进度、Step 与发布文档：
  - `docs/step/08-主写入路径接入-moveNoteToTrash增量-2026-04-13.md`
  - `docs/review/step-08-主写入路径moveNoteToTrash接入审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step08主写入路径接入moveNoteToTrash-2026-04-13.md`
  - `docs/release/Step08-主写入路径接入-moveNoteToTrash-2026-04-13.md`
  - `docs/release/最新版本说明-第四十三轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 将 note 入队逻辑收敛为 `enqueueNoteSyncTask(noteId, operation, atValue)`，并在 `moveNoteToTrash()` 成功路径新增 `note/delete` 队列任务接线。
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 现在同时覆盖 `createNote`、`persistActiveNote` 与 `moveNoteToTrash` 三条真实主写入队列路径，提升 `CP08-3` 的主链证据密度。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = 进行中`
- `CP08-3 / createNote 增量 = L3`
- `CP08-3 / persistActiveNote 增量 = L3`
- `CP08-3 / moveNoteToTrash 增量 = L3`
- `CP08-4 / 冲突与失败恢复验证 = 未开始`
- `Step 08` 当前整体维持 `L2`

## [Unreleased] - 2026-04-13 / Step 08 主写入路径接入 persistActiveNote 增量
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 新增 `persistActiveNote` 成功后必须向 `@sdkwork/notes-sync` 追加 `queued` 任务的主写入合同，明确冻结任务时间戳使用本地提交草稿 `updatedAt`，避免后续回退成“正文保存成功但没有同步任务”。
- 新增本轮审计、进度、Step 与发布文档：
  - `docs/step/08-主写入路径接入-persistActiveNote增量-2026-04-13.md`
  - `docs/review/step-08-主写入路径persistActiveNote接入审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step08主写入路径接入persistActiveNote-2026-04-13.md`
  - `docs/release/Step08-主写入路径接入-persistActiveNote-2026-04-13.md`
  - `docs/release/最新版本说明-第四十二轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 将既有入队逻辑收敛为 `enqueueNoteUpsertSyncTask(noteId, updatedAt)`，并在 `persistActiveNote()` 成功路径复用该 helper 生成 `note/upsert` 队列任务。
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 现在同时覆盖 `createNote` 与 `persistActiveNote` 两条真实主写入队列路径，提升 `CP08-3` 的主链证据密度。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = 进行中`
- `CP08-3 / createNote 增量 = L3`
- `CP08-3 / persistActiveNote 增量 = L3`
- `CP08-4 / 冲突与失败恢复验证 = 未开始`
- `Step 08` 当前整体维持 `L2`

## [Unreleased] - 2026-04-13 / Step 08 主写入路径接入 createNote 增量
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs` 冻结 `createNote` 成功后必须向 `@sdkwork/notes-sync` 追加 `queued` 任务的主写入合同，避免后续回退成“创建成功但没有同步任务”。
- 新增本轮审计、进度、Step 与发布文档：
  - `docs/step/08-主写入路径接入-createNote增量-2026-04-13.md`
  - `docs/review/step-08-主写入路径createNote接入审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step08主写入路径接入createNote-2026-04-13.md`
  - `docs/release/Step08-主写入路径接入-createNote-2026-04-13.md`
  - `docs/release/最新版本说明-第四十一轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 新增 `syncQueueStore` 边界，并在 `createNote()` 成功路径通过 `createNotesSyncTask()` 生成 `note/upsert` 队列任务。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/package.json` 新增 `@sdkwork/notes-sync` workspace 依赖。
- `sdkwork-notes-pc-react/tsconfig.base.json` 新增 `@sdkwork/notes-sync` path alias，保证 monorepo 类型解析与后续主链扩展稳定。
- `sdkwork-notes-pc-react/scripts/workspace-startup-recovery-smoke.contract.test.mjs` 同步升级 loader，确保 store 新依赖不会破坏既有启动恢复 smoke 合同。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-sync-write-path.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步锁定新的合同脚本门禁编排。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-queue.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-startup-recovery-smoke.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = 进行中`
- `CP08-3 / createNote 增量 = L3`
- `CP08-4 / 冲突与失败恢复验证 = 未开始`
- `Step 08` 当前整体维持 `L2`

## [Unreleased] - 2026-04-13 / Step 08 待同步队列与重试机制落地
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-queue.contract.test.mjs` 冻结 `@sdkwork/notes-sync` 的版本化队列快照、异常 payload 降级、自动重试与回放语义。
- 交付 Step 08 / CP08-2 收口文档：
  - `docs/step/08-待同步队列与重试机制落地-2026-04-13.md`
  - `docs/review/step-08-同步队列重试审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step08待同步队列与重试机制落地-2026-04-13.md`
  - `docs/release/Step08-待同步队列与重试机制落地-2026-04-13.md`
  - `docs/release/最新版本说明-第四十轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts` 新增 `NotesSyncQueueSnapshot`、版本化 queue envelope、浏览器 queue store、retry policy，以及 `scheduleNotesSyncTaskRetry()` / `releaseNotesSyncTaskForReplay()`。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-sync-queue.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步根脚本契约，确保 CP08-2 队列测试进入主验证链。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-state-machine.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-sync-queue.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-sync typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = 待开始`
- `CP08-4 / 冲突与失败恢复验证 = 待开始`
- `Step 08` 处于 `CP08-1 / CP08-2 已闭环、整体进行中`

## [Unreleased] - 2026-04-13 / Step 08 同步任务模型与状态机冻结
### Added

- `sdkwork-notes-pc-react/scripts/workspace-sync-state-machine.contract.test.mjs` 冻结 `@sdkwork/notes-sync` 的同步任务模型、失败/冲突分类、回放语义与状态流转约束。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 新增根脚本收口，确保 `workspace-sync-state-machine.contract.test.mjs` 被 `test:workspace:contracts` 主链覆盖。
- 交付 Step 08 / CP08-1 收口文档：
  - `docs/step/08-同步任务模型与状态机冻结-2026-04-13.md`
  - `docs/review/step-08-同步状态机审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step08同步任务模型与状态机冻结-2026-04-13.md`
  - `docs/release/Step08-同步任务模型与状态机冻结-2026-04-13.md`
  - `docs/release/最新版本说明-第三十九轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts` 从占位导出升级为真实同步契约边界，冻结任务状态、实体类型、操作类型、失败码、冲突码、回放模式，以及 `create*/transition*` 纯函数接口。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-sync-state-machine.contract.test.mjs` 纳入 `test:workspace:contracts`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sync-state-machine.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-sync typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制 = 待开始`
- `Step 08` 处于 `CP08-1 已闭环、整体进行中`
## [Unreleased] - 2026-04-13 / Step 07 性能与验证基线
### Added

- `sdkwork-notes-pc-react/scripts/workspace-search-performance.contract.test.mjs`，冻结 `10k notes + 1k trash + 200 folders` 数据集下的搜索一期性能基线。
- 新增本轮文档补记：
  - `docs/review/step-07-检索性能基线审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step07性能与验证基线-2026-04-13.md`
  - `docs/step/07-性能与验证基线-2026-04-13.md`
  - `docs/release/Step07-性能与验证基线-2026-04-13.md`
  - `docs/release/最新版本说明-第三十八轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/package.json` 将 `workspace-search-performance.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步锁定新的性能基线脚本门禁。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-search-performance.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd typecheck`

### Status

- `CP07-1 / 索引文档模型冻结 = L4`
- `CP07-2 / 统一查询 API = L4`
- `CP07-3 / 顶部搜索与命令面板接入 = L4`
- `CP07-4 / 性能与验证基线 = L4`
- `Step 07 = L4`

## [Unreleased] - 2026-04-13 / Step 07 顶部搜索与命令面板接入
### Added

- `sdkwork-notes-pc-react/scripts/workspace-view-model.contract.test.mjs`，冻结“顶部搜索可通过 folder path 命中 note”的工作区 contract。
- `sdkwork-notes-pc-react/scripts/workspace-command-palette.contract.test.mjs`，冻结“命令面板 note/folder 候选改为共享搜索接线”的工作区 contract。
- 新增本轮文档补记：
  - `docs/review/step-07-顶部搜索与命令面板接入审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step07顶部搜索与命令面板接入-2026-04-13.md`
  - `docs/step/07-顶部搜索与命令面板接入-2026-04-13.md`
  - `docs/release/Step07-顶部搜索与命令面板接入-2026-04-13.md`
  - `docs/release/最新版本说明-第三十七轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSelectors.ts` 改为通过 `buildNotesSearchDocuments()` 与 `searchNotesSearchDocuments()` 生成顶部搜索结果。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceCommandPaletteModel.ts` 改为让 note/folder 候选复用共享搜索文档、查询结果和 folder path 关键词。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/package.json` 新增 `@sdkwork/notes-search` workspace 依赖声明。
- `sdkwork-notes-pc-react/tsconfig.base.json` 与 `sdkwork-notes-pc-react/vite.config.ts` 新增 `@sdkwork/notes-search` 的 monorepo 解析入口。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-view-model.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-command-palette.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-search typecheck`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP07-1 / 索引文档模型冻结 = L4`
- `CP07-2 / 统一查询 API = L4`
- `CP07-3 / 顶部搜索与命令面板接入 = L4`
- `Step 07` 继续推进，暂不宣称 `L4`

## [Unreleased] - 2026-04-13 / Step 07 统一查询 API
### Added

- `sdkwork-notes-pc-react/scripts/workspace-search-query.contract.test.mjs`，为 `notes-search` 冻结统一查询函数、tag/folder/trash 过滤、基础排序和 in-memory service `rebuild()` 行为。
- 新增本轮文档补记：
  - `docs/review/step-07-统一查询API审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step07统一查询API-2026-04-13.md`
  - `docs/step/07-统一查询API-2026-04-13.md`
  - `docs/release/Step07-统一查询API-2026-04-13.md`
  - `docs/release/最新版本说明-第三十六轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-search/src/index.ts` 新增 `searchNotesSearchDocuments()` 与 `createInMemoryNotesSearchService()`，并冻结最小查询排序规则。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-search-query.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步锁定新的根脚本门禁。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-search-schema.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-search-query.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-search typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP07-1 / 索引文档模型冻结 = L4`
- `CP07-2 / 统一查询 API = L4`
- `Step 07` 继续推进，暂不宣称 `L4`

## [Unreleased] - 2026-04-13 / Step 07 索引文档模型冻结
### Added

- `sdkwork-notes-pc-react/scripts/workspace-search-schema.contract.test.mjs`，为 `notes-search` 冻结统一 document/query/result contract，并覆盖本地 draft 合并、folder path 解析与共享结果 envelope。
- 新增本轮文档补记：
  - `docs/review/step-07-索引文档模型冻结审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step07索引文档模型冻结-2026-04-13.md`
  - `docs/step/07-索引文档模型冻结-2026-04-13.md`
  - `docs/release/Step07-索引文档模型冻结-2026-04-13.md`
  - `docs/release/最新版本说明-第三十五轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-search/src/index.ts` 改为导出统一 `NotesSearchDocument / NotesSearchQuery / NotesSearchResult`，并新增 `buildNotesSearchDocuments()`、`normalizeNotesSearchQuery()` 与 `createNotesSearchResult()`。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-search-schema.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步锁定新的根脚本门禁。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-search-schema.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-search typecheck`
- `pnpm.cmd typecheck`

### Status

- `CP07-1 / 索引文档模型冻结 = L4`
- `Step 07` 继续推进，暂不宣称 `L4`

## [Unreleased] - 2026-04-13 / Step 06 启动恢复 smoke 闭环
### Added

- `sdkwork-notes-pc-react/scripts/workspace-startup-recovery-smoke.contract.test.mjs` 为真实启动恢复链路补充 smoke contract，覆盖 current envelope、legacy raw snapshot、unknown version、corrupted payload、`loadWorkspace()` failure 以及 trash/missing draft filtering。
- 新增本轮文档补记：
  - `docs/review/step-06-启动恢复smoke审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step06启动恢复smoke补齐-2026-04-13.md`
  - `docs/step/06-启动恢复smoke补齐-2026-04-13.md`
  - `docs/release/Step06-启动恢复smoke-2026-04-13.md`
  - `docs/release/最新版本说明-第三十四轮推进补记-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/package.json` 将 `workspace-startup-recovery-smoke.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步锁定新的根脚本门禁。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-startup-recovery-smoke.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-local-schema.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-local-recovery.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd typecheck`

### Status

- `CP06-4 / 启动恢复 smoke test = L4`
- `Step 06 = L4`
## [Unreleased] - 2026-04-13 / Step 06 标准化本地快照接口
### Added

- `sdkwork-notes-pc-react/scripts/workspace-local-snapshot.contract.test.mjs`，新增标准化本地快照 contract，冻结 `empty snapshot factory + snapshot resolver + read-only snapshot reader` 三条公开边界。
- 新增本轮审计、进度、Step 补记与发布文档：
  - `docs/review/step-06-本地快照接口审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step06本地快照接口增量-2026-04-13.md`
  - `docs/step/06-本地快照接口增量-2026-04-13.md`
  - `docs/release/Step06-本地快照接口-2026-04-13.md`
  - `docs/架构/05-数据模型与存储设计-本地快照接口补充-2026-04-13.md`
  - `docs/架构/07-性能-离线-搜索-同步设计-本地快照接口补充-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-local/src/index.ts` 新增 `NotesLocalWorkspaceSnapshotLoader`、`NotesLocalWorkspaceSnapshotReader`、`createEmptyNotesLocalWorkspaceSnapshot()`、`resolveNotesLocalWorkspaceSnapshot()`、`createNotesLocalWorkspaceSnapshotReader()` 与 `notesLocalWorkspaceSnapshotReader`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-local/src/index.ts` 统一把 legacy raw snapshot、current versioned envelope、loader failure 和 unknown version 收口到标准化 `NotesLocalWorkspaceSnapshot`。
- `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 已把 `workspace-local-snapshot.contract.test.mjs` 接入 `test:workspace:contracts`。

### Fixed

- 修复后续搜索与同步仍需要自己理解 `{ version, workspace }` 或历史 raw snapshot 的接口缺口，当前已具备统一快照读边界。
- 修复本地快照空值、异常载荷和 loader failure 缺少单一标准化收口路径的问题，当前已统一降级为空快照。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-local-snapshot.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-local-schema.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-local-recovery.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-local typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：`Step 06 标准化本地快照接口`
- 改动目的：把本地 workspace 快照从“已有 schema 契约”继续推进为“可被搜索与同步共同消费的显式读边界”。
- 风险控制：通过 snapshot contract、schema contract、recovery contract、脚本门禁和根级 typecheck 五层验证控制回退风险。
- 验证摘要：新增 snapshot contract 已进入根级 `test:workspace:contracts`，根级 `pnpm.cmd typecheck` fresh pass。
- 关联能力：`Step 06 / Wave-B / 第三十三轮推进 / CP06-3`

### Status

- `Step 03` 保持 `L4`
- `Step 04` 保持 `L4`
- `Step 05` 保持 `L4`
- `Step 06` 保持 `L3`
- `CP06-3 / 标准化本地快照接口 = L4`
- 下一执行入口继续保持在 `Step 06-本地存储层与离线草稿能力一期`

## [Unreleased] - 2026-04-13 / Step 06 本地 schema 与迁移
### Added

- `sdkwork-notes-pc-react/scripts/workspace-local-schema.contract.test.mjs`，新增本地 schema/migration contract，冻结“legacy raw 兼容读 + versioned envelope 读写 + unknown version/corrupted payload 安全降级”。
- 新增本轮审计、架构、进度与发布文档：
  - `docs/review/step-06-本地schema与迁移审计-2026-04-13.md`
  - `docs/架构/10-实施进度-Step06本地Schema增量-2026-04-13.md`
  - `docs/release/Step06-本地Schema与迁移-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-local/src/index.ts` 改为新增 `NOTES_LOCAL_WORKSPACE_SCHEMA_VERSION = 1`、`NotesLocalWorkspaceEnvelope`，并统一冻结当前本地 workspace storage contract。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-local/src/index.ts` 改为同时兼容历史 raw snapshot 与当前 versioned envelope 的读取路径。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-local/src/index.ts` 改为 `saveDraft / clearDraft` 只写当前 envelope，不再写历史 raw 顶层结构。
- `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 已同步把 `workspace-local-schema.contract.test.mjs` 接入 `test:workspace:contracts`。
- `docs/step/06-本地存储层与离线草稿能力一期.md`、`docs/架构/05-数据模型与存储设计.md`、`docs/架构/07-性能-离线-搜索-同步设计.md` 与 `docs/release/最新版本说明.md` 已同步回写本轮结论。

### Fixed

- 修复 `notes-local` 本地 workspace 存储仍缺显式 schema version 的问题，当前已具备稳定升级入口。
- 修复历史 raw snapshot 与当前恢复入口之间缺少兼容迁移口径的问题，升级后现有本地数据不会被直接抛弃。
- 修复未知版本或损坏 payload 可能污染恢复主链的风险，当前已统一安全降级为空快照。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-local-schema.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-local-recovery.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-local typecheck`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：`Step 06 本地 workspace schema 与迁移策略`
- 改动目的：把本地 workspace 持久化从“隐式 raw shape”提升为“显式 versioned envelope + 兼容迁移读路径”，为后续搜索与同步统一本地快照接口打底。
- 风险控制：通过 schema contract、恢复入口 contract、脚本聚合合同、包级与根级 typecheck 六层验证控制回退风险。
- 验证摘要：新增 schema contract 已进入根级 `test:workspace:contracts`，根级 `pnpm.cmd typecheck` fresh pass。
- 关联能力：`Step 06 / Wave-B / 第三十二轮推进 / CP06-1`

### Status

- `Step 03` 保持 `L4`
- `Step 04` 保持 `L4`
- `Step 05` 保持 `L4`
- `Step 06` 提升到 `L3`
- 下一执行入口继续保持在 `Step 06-本地存储层与离线草稿能力一期`

## [Unreleased] - 2026-04-13 / Step 06 本地恢复入口
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceRecovery.ts`，新增恢复候选过滤、选中、移除和本地草稿回放纯函数，冻结 `Step 06` 第一条读侧恢复边界。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceRecoveryBanner.tsx`，新增工作区恢复提示横幅组件。
- `sdkwork-notes-pc-react/scripts/workspace-local-recovery.contract.test.mjs`，新增本地恢复入口 contract，冻结“只消费 live note 恢复候选 + 恢复回放 + store/page 接线”。
- 新增本轮审计、架构、进度与发布文档：
  - `docs/review/step-06-恢复入口与本地草稿消费审计-2026-04-13.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-本地恢复入口补充-2026-04-13.md`
  - `docs/架构/10-实施进度-Step06恢复入口增量-2026-04-13.md`
  - `docs/release/Step06-本地恢复入口-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 改为在初始化时读取 `NotesLocalStore.loadWorkspace().drafts`，并暴露 `recoveredDrafts / activeRecoveredDraft / restoreRecoveredDraft / dismissRecoveredDraft`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为接入恢复提示 UI，并根据当前 active note 提供“打开 / 恢复 / 放弃”动作。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/zh-CN.ts` 与 `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/en-US.ts` 已同步补齐恢复提示文案。
- `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 已同步把 `workspace-local-recovery.contract.test.mjs` 接入 `test:workspace:contracts`。
- `docs/release/最新版本说明.md` 与 `docs/step/06-本地存储层与离线草稿能力一期.md` 已同步回写本轮结论。

### Fixed

- 修复本地恢复检查点“只写不读”的断点，当前启动链已经能够真正消费恢复草稿。
- 修复页面缺少恢复入口的问题，当前用户已经可以显式恢复或放弃本地草稿。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-local-recovery.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：`Step 06 本地草稿恢复入口`
- 改动目的：把 `Step 05` 已冻结的退出恢复检查点正式消费到工作区启动链和页面入口中，形成最小可见恢复闭环。
- 风险控制：通过恢复过滤 contract、脚本聚合合同、包级与根级 typecheck 四层验证控制回退风险。
- 验证摘要：新合同已进入根级 `test:workspace:contracts`，根级 `pnpm.cmd typecheck` fresh pass。
- 关联能力：`Step 06 / Wave-B / 第三十一轮推进 / CP06-2`

### Status

- `Step 03` 保持 `L4`
- `Step 04` 保持 `L4`
- `Step 05` 保持 `L4`
- `Step 06` 提升到 `L2`
- 下一执行入口继续保持在 `Step 06-本地存储层与离线草稿能力一期`

## [Unreleased] - 2026-04-13 / Step 05 退出恢复检查点
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-local/src/index.ts`，补齐 `@sdkwork/notes-local` 的本地恢复检查点存储实现，冻结 `LocalDraftSnapshot` 字段、浏览器存储适配与 `sdkwork-notes-local-workspace` 存储键。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceExitRecovery.ts`，新增退出恢复 service，统一负责恢复快照构建、capture 与 clear 边界。
- `sdkwork-notes-pc-react/scripts/workspace-exit-recovery.contract.test.mjs`，新增退出恢复 contract，冻结“本地检查点 upsert/clear + capture->flush 顺序 + store/page 主链接线”。
- 新增本轮审计、架构、进度与发布文档：
  - `docs/review/step-05-退出恢复检查点审计-2026-04-13.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-退出恢复检查点补充-2026-04-13.md`
  - `docs/架构/10-实施进度-退出恢复检查点增量-2026-04-13.md`
  - `docs/release/Step05-退出恢复检查点-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 改为在 `draft-change` 时立即写入恢复检查点，并在远端确认保存成功或无真实差异时清理本地检查点。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceAutosaveRuntime.ts` 改为冻结 `pagehide / visibilitychange(hidden)` 的执行顺序为 `captureRecoverySnapshot -> flushDraft`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为只装配退出触发器，不再直接感知本地恢复存储细节。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/package.json` 与 `sdkwork-notes-pc-react/tsconfig.base.json` 正式接入 `@sdkwork/notes-local` 工作区依赖与 source alias。
- `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 已同步把 `workspace-exit-recovery.contract.test.mjs` 接入 `test:workspace:contracts`。
- `docs/release/最新版本说明.md` 与 `docs/step/05-编辑器与自动保存可靠性升级.md` 已同步回写本轮结论。

### Fixed

- 修复草稿恢复证据只依赖 `pagehide` 最后一跳的问题，草稿变脏后已具备本地恢复检查点。
- 修复远端已经确认保存后仍可能残留伪恢复草稿的问题，本地检查点现会在成功保存后立即清理。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-exit-recovery.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：`Step 05 保存链可靠性闭环收口`
- 改动目的：把页面关闭 / 异常退出 / 崩溃前的恢复检查点正式纳入保存主链，冻结 Step 06 的消费边界。
- 风险控制：通过退出恢复 contract、脚本聚合合同、包级与根级 typecheck 四层验证控制回退风险。
- 验证摘要：新合同已进入根级 `test:workspace:contracts` 主门禁，根级 `pnpm.cmd typecheck` fresh pass。
- 关联能力：`Step 05 / Wave-B / 第三十轮推进 / 退出恢复检查点`

### Status

- `Step 03` 保持 `L4`
- `Step 04` 保持 `L4`
- `Step 05` 升级到 `L4`
- 下一执行入口切换到 `Step 06-本地草稿与恢复能力`

## [Unreleased] - 2026-04-13 / Step 05 保存重试退避与观测
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSaveRetryPolicy.ts`，新增独立重试策略服务，冻结默认退避节奏、最大重试次数与最小 telemetry 事件接口。
- `sdkwork-notes-pc-react/scripts/workspace-save-retry-policy.contract.test.mjs`，新增保存重试策略 contract，冻结“默认退避规则 + telemetry 事件 + store 必须消费 retry policy”的架构事实。
- 新增本轮审计、架构、进度与发布文档：
  - `docs/review/step-05-保存重试退避与观测审计-2026-04-13.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-保存重试退避与观测补充-2026-04-13.md`
  - `docs/架构/10-实施进度-保存重试退避与观测增量-2026-04-13.md`
  - `docs/release/Step05-保存重试退避与观测-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 改为在 `save queue` 主链上消费 retry policy，失败后按退避规则自动重试，恢复成功与重试耗尽均写入 telemetry 事件。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/package.json` 正式声明 `@sdkwork/notes-observability` 工作区依赖。
- `sdkwork-notes-pc-react/tsconfig.base.json` 新增 `@sdkwork/notes-observability` source alias，修复工作区 `tsc` 解析边界。
- `docs/release/最新版本说明.md` 与 `docs/step/05-编辑器与自动保存可靠性升级.md` 同步回写本轮状态。

### Fixed

- 修复保存失败后缺少自动退避与最大重试上限的问题。
- 修复 `notes-notes` 无法从工作区类型层解析 `@sdkwork/notes-observability` 的 typecheck 阻塞。

### Tests

- `node .\scripts\workspace-save-retry-policy.contract.test.mjs`
- `node .\scripts\workspace-save-queue.contract.test.mjs`
- `node .\scripts\workspace-save-feedback.contract.test.mjs`
- `node .\scripts\workspace-save-flush-boundary.contract.test.mjs`
- `node .\scripts\workspace-high-risk-flush-boundary.contract.test.mjs`
- `node .\scripts\package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

## [Unreleased] - 2026-04-13 / Step 05 串行保存编排
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSaveQueue.ts`，新增独立保存编排服务，冻结串行保存、replay 合并与 stale response protection。
- `sdkwork-notes-pc-react/scripts/workspace-save-queue.contract.test.mjs`，新增 save queue contract，冻结“一个 active request + 最多一次 replay + store 必须消费 save queue”的架构事实。
- 新增本轮审计、架构、进度与发布文档：
  - `docs/review/step-05-串行保存编排审计-2026-04-13.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-串行保存编排补充-2026-04-13.md`
  - `docs/架构/10-实施进度-串行保存编排增量-2026-04-13.md`
  - `docs/release/Step05-串行保存编排-2026-04-13.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 改为通过 `activeNoteSaveQueue` 区分 `requestReplay()` 与 `waitForActiveRequest()`，并统一消费 `resolveNotesWorkspaceSaveCompletion()`。
- `sdkwork-notes-pc-react/scripts/workspace-high-risk-flush-boundary.contract.test.mjs` 升级为冻结“`dirty / error` 必须 flush、`saving / retrying` 必须 wait”。
- `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 已同步将 `workspace-save-queue.contract.test.mjs` 与升级后的高风险刷盘 contract 纳入 `test:workspace:contracts`。
- `docs/step/05-编辑器与自动保存可靠性升级.md`、`docs/架构/README.md`、`docs/架构/05-数据模型与存储设计.md`、`docs/架构/06-业务流程-应用接口与集成设计.md`、`docs/架构/07-性能-离线-搜索-同步设计.md`、`docs/架构/09-实施计划.md`、`docs/架构/10-实施进度-2026-04-07.md` 与 `docs/release/最新版本说明.md` 已同步修正当前 Step 05 口径。

### Fixed

- 修复连续保存请求可能并发交叠的问题，活跃笔记保存当前已进入串行编排。
- 修复高风险动作在 `saving / retrying` 期间可能跳过等待的边界缺陷。
- 修复旧保存响应覆盖更新草稿的隐性丢稿风险。

### Refactored

- 保存链从“统一 flush 入口 + 反馈状态机”继续演进为“统一 flush 入口 + 反馈状态机 + save queue”，为后续自动退避与 Step 06 本地恢复打下稳定主脊柱。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-save-queue.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-save-feedback.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-save-flush-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-high-risk-flush-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Docs

- 本轮新增或更新：
  - `docs/review/step-05-串行保存编排审计-2026-04-13.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-串行保存编排补充-2026-04-13.md`
  - `docs/架构/10-实施进度-串行保存编排增量-2026-04-13.md`
  - `docs/release/Step05-串行保存编排-2026-04-13.md`
  - `docs/step/05-编辑器与自动保存可靠性升级.md`
  - `docs/架构/README.md`
  - `docs/架构/05-数据模型与存储设计.md`
  - `docs/架构/06-业务流程-应用接口与集成设计.md`
  - `docs/架构/07-性能-离线-搜索-同步设计.md`
  - `docs/架构/09-实施计划.md`
  - `docs/架构/10-实施进度-2026-04-07.md`
  - `docs/release/最新版本说明.md`

### Release

- 影响范围：`Step 05 保存链可靠性升级主链`
- 改动目的：把统一 `flushDraft` 继续提升为真正的串行保存编排层，消除并发保存与高风险切换下的隐性丢稿风险。
- 风险控制：通过 save queue contract、高风险刷盘 contract、脚本聚合链、包级与根级 typecheck 五层验证控制回退。
- 验证摘要：save queue、高风险刷盘、保存反馈、统一 flush 入口与总脚本链验证全部通过。
- 关联能力：`Step 05 / Wave-B / 第二十九轮推进 / 串行保存编排`

### Status

- `Step 03` 保持 `L4`
- `Step 04` 保持 `L4`
- `Step 05` 升级到 `L3`
- 下一执行入口继续保持在 `Step 05-编辑器与自动保存可靠性升级`

## [Unreleased] - 2026-04-13 / Step 03 认证宿主边界纠偏
### Added

- `docs/review/step-03-认证宿主边界纠偏-2026-04-13.md`，新增本轮回归止损审计记录，沉淀当前根级门禁阻塞、边界调整原因与下一轮输入。
- `docs/架构/06-业务流程-应用接口与集成设计-认证宿主边界补充-2026-04-13.md`，新增认证宿主边界补充，明确 notes 仓库以 `@sdkwork/notes-auth` 作为唯一 shared auth 宿主层。
- `docs/架构/10-实施进度-认证宿主边界纠偏-2026-04-13.md`，新增实施进度增量文档，记录本轮止损与根级验证恢复。
- `docs/release/Step03-认证宿主边界纠偏-2026-04-13.md`，新增本轮发布说明。

### Changed

- `sdkwork-notes-pc-react/scripts/workspace-boundary-contract.test.mjs`，不再把仓库外 `@sdkwork/auth-pc-react` 的内部依赖树当作 notes 仓库唯一边界依据，改为冻结 `@sdkwork/notes-auth` 的宿主边界、`sdkworkAuthBridge.ts` 的 `notes-core` runtime 绑定，以及其它包不得直连 shared auth 的事实。
- `docs/release/最新版本说明.md`，同步回写本轮认证宿主边界纠偏与当前 Step 状态。

### Fixed

- 修复根级 `pnpm.cmd typecheck` 因旧版 shared auth 宿主合同过期而无法通过的问题。
- 修复 notes 仓库对认证宿主边界的过期假设，使当前质量门禁重新基于本仓库真实可控边界运行。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-boundary-contract.test.mjs`
- `pnpm.cmd typecheck`

### Docs

- 本轮新增或更新：
  - `docs/review/step-03-认证宿主边界纠偏-2026-04-13.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-认证宿主边界补充-2026-04-13.md`
  - `docs/架构/10-实施进度-认证宿主边界纠偏-2026-04-13.md`
  - `docs/release/Step03-认证宿主边界纠偏-2026-04-13.md`
  - `docs/release/最新版本说明.md`

### Release

- 影响范围：`Step 03 / 认证宿主边界 / 根级 workspace 合同门禁`
- 改动目的：把 notes 仓库的认证宿主边界重新冻结为 `notes-auth + notes-core bridge`，恢复根级质量门禁。
- 风险控制：只调整本仓库合同与文档，不修改仓库外 shared auth 包，并通过根级 `typecheck` 全链复核。
- 验证摘要：`workspace-boundary-contract` 与根级 `pnpm.cmd typecheck` 已全部通过。
- 关联能力：`Step 03 / Wave-A / 第二十八轮推进 / 认证宿主边界纠偏`

### Status

- `Step 03` 保持 `L4`
- `Step 05` 保持 `L2`
- 下一执行入口继续保持在 `Step 05-编辑器与自动保存可靠性升级`

## [Unreleased] - 2026-04-07 / Step 05 保存失败反馈与重试状态机
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSaveFeedback.ts`，新增统一 save feedback model，并冻结 `statusKey / canManualSave / isBusy / bannerMessage / retryAvailable` 五类输出。
- `sdkwork-notes-pc-react/scripts/workspace-save-feedback.contract.test.mjs`，新增保存失败反馈与重试状态机 contract，冻结“显式 retry lifecycle + 统一 UI 反馈模型”这一架构事实。

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/types/notesWorkspace.ts`，将 `NoteSaveState` 扩展为 `idle / dirty / saving / saved / error / retrying / recovered`，为失败反馈与恢复语义提供显式协议。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`，保存请求态改为 `dirty -> saving`、`error -> retrying`，保存成功态改为 `saving -> saved`、`retrying/error -> recovered`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NoteEditorPane.tsx` 与 `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为统一消费 `saveFeedback` 模型，不再各自维护零散的保存状态判断。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceErrorBanner.tsx` 增加可选 retry CTA，页面层仅在 `retryAvailable` 时暴露 `flushDraft`。
- `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 已同步将 `workspace-save-feedback.contract.test.mjs` 纳入 `test:workspace:contracts` 聚合链。

### Fixed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/zh-CN.ts`，补齐 `notes.actions.retrySave`、`notes.editor.status.retrying` 与 `notes.editor.status.recovered` 中文文案，避免中文环境出现翻译回退。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-save-feedback.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-error-banner-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Docs

- 新增本轮审计、架构、进度与发布文档：
  - `docs/review/step-05-失败反馈与重试状态机审计-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-保存失败反馈与重试状态机补充-2026-04-07.md`
  - `docs/架构/10-实施进度-保存失败反馈与重试状态机增量-2026-04-07.md`
  - `docs/release/Step05-保存失败反馈与重试状态机-2026-04-07.md`

### Release

- 影响范围：`Step 05 保存链可靠性升级主链`
- 改动目的：在统一刷盘入口基础上，继续形成“失败 -> 重试中 -> 恢复”的显式保存反馈闭环。
- 风险控制：通过新增 contract、错误横幅边界回归、包级与根级 typecheck 四层验证控制回退。
- 验证摘要：新增 contract 已接入 `test:workspace:contracts`，本轮验证命令全部通过。
- 关联能力：`Step 05 / Wave-B / 第二十七轮推进 / 保存失败反馈与重试状态机`

### Status

- Step 04 保持 `L4`
- Step 05 维持 `L2`
- `CP05-3 / 失败反馈与重试策略` 已达到 `L4`

## [Unreleased] - 2026-04-07 / Step 05 统一刷盘入口收敛
### Added

- `sdkwork-notes-pc-react/scripts/workspace-save-flush-boundary.contract.test.mjs`，新增统一刷盘入口 contract，冻结“编辑器保存、快捷键保存、页面隐藏刷盘必须共享 `flushDraft`”这一架构事实。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-05-保存链可靠性审计-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-统一刷盘入口补充-2026-04-07.md`
  - `docs/架构/10-实施进度-统一刷盘入口增量-2026-04-07.md`
  - `docs/release/Step05-统一刷盘入口收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceAutosave.ts` 新增 `shouldFlush`，把 autosave 调度资格与 flush 执行资格拆分为两个显式字段。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceAutosave.ts` 将 `saveState === 'error'` 建模为“允许 flush、禁止重新调度 autosave”的重试态。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为让 `onSave`、页面命令 `persistActiveNote` 和隐藏态刷盘统一共享 `flushDraft`。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-save-flush-boundary.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链，防止脚本链回退。
- `docs/架构/10-实施进度-2026-04-07.md` 与 `docs/release/最新版本说明.md` 已同步修正 Step 05 当前口径。

### Refactored

- 保存链开始从“多入口 + 多条件”收敛为“单一 flush 入口 + 多触发器复用”，为后续 save queue 与失败恢复状态机打下统一执行边界。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-autosave.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-save-flush-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-autosave-visibility-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-autosave-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：Step 05 保存链可靠性升级主链。
- 改动目的：统一手动保存、快捷键保存和隐藏态刷盘的执行入口，避免失败重试语义继续分裂。
- 风险控制：通过新 contract、脚本链冻结、包级与根级 typecheck 四层验证控制回归。
- 验证摘要：新增 contract 已接入 `test:workspace:contracts` 并随 `pnpm.cmd typecheck` 全链通过。
- 关联能力：`Step 05 / Wave-B / 第二十六轮推进 / 统一刷盘入口收敛`

### Status

- Step 04 保持 `L4`
- Step 05 维持 `L2`
- `CP05-2 / 统一刷盘入口` 已达到 `L4`

## [Unreleased] - 2026-04-07 / Step 05 可见性刷盘边界收敛
### Added

- `sdkwork-notes-pc-react/scripts/workspace-autosave-visibility-boundary.contract.test.mjs`，新增 autosave 可见性边界 contract，冻结“`visibilitychange(hidden)` flush 需要通过共享 runtime service 装配并接入页面”这一架构事实。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-05-保存链可靠性审计-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-可见性刷盘边界补充-2026-04-07.md`
  - `docs/架构/10-实施进度-可见性刷盘边界增量-2026-04-07.md`
  - `docs/release/Step05-可见性刷盘边界收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceAutosaveRuntime.ts` 新增 `bindNotesWorkspaceVisibilityAutosave()`，把 `visibilitychange(hidden)` 的 flush 语义收敛到 autosave runtime 边界。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为通过共享 runtime service 装配 `document.visibilitychange`，页面只保留 DOM 事件适配与 `document.visibilityState === 'hidden'` 判定。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-autosave-visibility-boundary.contract.test.mjs` 纳入 `test:workspace:contracts`，确保 autosave 可见性边界进入总门禁。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链，防止脚本链回退。
- `docs/架构/README.md`、`docs/架构/06-业务流程-应用接口与集成设计.md`、`docs/架构/07-性能-离线-搜索-同步设计.md`、`docs/架构/10-实施进度-2026-04-07.md` 与 `docs/release/最新版本说明.md` 已同步纠正当前阶段与保存触发口径。

### Refactored

- 保存链的页面隐藏刷盘能力从“仅 `pagehide`”升级为“`visibilitychange(hidden)` + `pagehide` 共享 runtime 边界”，为 Step 05 的 save queue 与失败恢复演进建立统一入口。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-autosave-visibility-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-autosave-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：Step 05 保存链可靠性升级主链。
- 改动目的：让页面隐藏类场景在 `visibilitychange(hidden)` 时即可通过共享 runtime 边界触发刷盘，降低桌面场景下的丢稿风险。
- 风险控制：通过先失败后通过的 Node contract、脚本链冻结、包级与根级 typecheck 四层验证控制回归。
- 验证摘要：新增 contract 已接入 `test:workspace:contracts` 并随 `pnpm.cmd typecheck` 全链通过。
- 关联能力：`Step 05 / Wave-B / 第二十五轮推进 / 可见性刷盘边界收敛`

### Status

- Step 04 保持 `L4`
- Step 05 启动并推进到 `L2`
- 下一执行入口继续保持在 `Step 05-编辑器与自动保存可靠性升级`

## [Unreleased] - 2026-04-07 / Step 04 对话框底部适配边界收敛
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceDialogFooter.tsx`，新增独立对话框底部适配组件，统一承接 cancel/confirm 按钮的最终视图绑定。
- `sdkwork-notes-pc-react/scripts/workspace-page-dialog-footer-boundary.contract.test.mjs`，新增页面对话框底部边界 contract，冻结“Dialog footer 最终 UI 绑定不得继续停留在 `NotesWorkspacePage.tsx`”这一架构事实。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-对话框底部适配边界收敛-2026-04-07.md`
  - `docs/review/step-04-能力兑现-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-对话框底部适配边界补充-2026-04-07.md`
  - `docs/架构/10-实施进度-对话框底部适配边界增量-2026-04-07.md`
  - `docs/架构/13-Step-04-L4收口-2026-04-07.md`
  - `docs/release/Step04-对话框底部适配边界收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为直接消费 `NotesWorkspaceDialogFooter`，不再在页面层执行 `footer={(<>...</>)}` 或直接装配 ghost/danger 按钮。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/index.ts` 导出新的对话框底部适配边界组件。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-dialog-footer-boundary.contract.test.mjs` 纳入 `test:workspace:contracts`，确保对话框底部边界进入总门禁。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链，防止脚本链回退。

### Refactored

- 工作区页面对话框底部的最终视图适配职责从页面容器层下沉到独立组件边界，页面彻底回到“状态输入 + runtime 注入 + 布局装配”的薄容器职责，Step 04 由此完成收口。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-dialog-footer-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-error-banner-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-shortcut-hints-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-header-actions-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-command-palette-boundary.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：Step 04 页面容器纯化链路与最终收口。
- 改动目的：消除 `NotesWorkspacePage.tsx` 中最后一块高优先级本地视图胶水，并以真实证据完成 Step 04 放行。
- 风险控制：通过 source contract、脚本链冻结、包级与根级 typecheck 四层验证控制回归。
- 验证摘要：新 contract 已先失败后通过，`pnpm.cmd typecheck` 已重跑 `test:workspace:contracts` 全链并通过。
- 关联能力：`Step 04 / Wave-B / 第二十四轮推进 / 对话框底部适配边界收敛`

### Notes

- 包内 Vitest 在当前环境仍受 `spawn EPERM` 约束，属于既有环境限制，不作为本轮回归依据。

### Status

- Step 04 升级为 `L4`
- `NotesWorkspacePage.tsx` 已无上一轮审计定义下的高优先级本地视图胶水
- 下一执行入口切换为 `Step 05-编辑器与自动保存可靠性升级`

## [Unreleased] - 2026-04-07 / Step 04 错误提示适配边界收敛
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceErrorBanner.tsx`，新增独立错误提示适配组件，统一承接错误提示条的最终 banner/dismiss button 绑定。
- `sdkwork-notes-pc-react/scripts/workspace-page-error-banner-boundary.contract.test.mjs`，新增页面错误提示边界 contract，冻结“错误提示最终 UI 绑定不得继续停留在 `NotesWorkspacePage.tsx`”这一架构事实。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-错误提示适配边界收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-错误提示适配边界补充-2026-04-07.md`
  - `docs/架构/10-实施进度-错误提示适配边界增量-2026-04-07.md`
  - `docs/release/Step04-错误提示适配边界收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为直接消费 `NotesWorkspaceErrorBanner`，不再在页面层执行 `errorMessage ? (...) : null` 或直接绑定 `clearError` 按钮。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/index.ts` 导出新的错误提示适配边界组件。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-error-banner-boundary.contract.test.mjs` 纳入 `test:workspace:contracts`，确保错误提示边界进入总门禁。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链，防止脚本链回退。

### Refactored

- 工作区页面错误提示条的最终视图适配职责从页面容器层下沉到独立组件边界，页面进一步退回到“状态输入 + 文案传递 + 命令入口绑定”的薄装配职责。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-error-banner-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-shortcut-hints-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-header-actions-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-command-palette-boundary.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：Step 04 页面容器纯化链路。
- 改动目的：继续消除 `NotesWorkspacePage.tsx` 中残留的顶部错误提示本地渲染胶水。
- 风险控制：通过 source contract、脚本链冻结、包级与根级 typecheck 四层验证控制回归。
- 验证摘要：新 contract 已先失败后通过，`pnpm.cmd typecheck` 已重跑 `test:workspace:contracts` 全链并通过。
- 关联能力：`Step 04 / Wave-B / 第二十三轮推进 / 错误提示适配边界收敛`

### Notes

- 包内 Vitest 在当前环境仍受 `spawn EPERM` 约束，属于既有环境限制，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- `error banner` 已不再是当前页面层主阻塞
- 当前下一轮重点转为 `Dialog footer` 的页面胶水复核

## [Unreleased] - 2026-04-07 / Step 04 快捷键提示适配边界收敛
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceShortcutHints.tsx`，新增独立快捷键提示适配组件，统一承接快捷键提示区的最终 chip/label 绑定。
- `sdkwork-notes-pc-react/scripts/workspace-page-shortcut-hints-boundary.contract.test.mjs`，新增页面快捷键提示边界 contract，冻结“快捷键提示最终 UI 绑定不得继续停留在 NotesWorkspacePage.tsx”这一架构事实。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-快捷键提示适配边界收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-快捷键提示适配边界补充-2026-04-07.md`
  - `docs/架构/10-实施进度-快捷键提示适配边界增量-2026-04-07.md`
  - `docs/release/Step04-快捷键提示适配边界收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为直接消费 `NotesWorkspaceShortcutHints`，不再在页面层执行 `pagePresentation.shortcutHints.map(...)`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/index.ts` 导出新的快捷键提示适配边界组件。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-shortcut-hints-boundary.contract.test.mjs` 纳入 `test:workspace:contracts`，确保快捷键提示边界进入总门禁。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链，防止脚本链回退。

### Refactored

- 工作区页面快捷键提示区的最终视图适配职责从页面容器层下沉到独立组件边界，页面进一步退回到“文案/数据输入 + 命令入口绑定”的薄装配职责。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-shortcut-hints-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-header-actions-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-command-palette-boundary.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：Step 04 页面容器纯化链路。
- 改动目的：继续消除 `NotesWorkspacePage.tsx` 中残留的快捷键提示本地渲染胶水。
- 风险控制：通过 source contract、脚本链冻结、包级与根级 typecheck 四层验证控制回归。
- 验证摘要：新 contract 已先失败后通过，`pnpm.cmd typecheck` 已重跑 `test:workspace:contracts` 全链并通过。
- 关联能力：`Step 04 / Wave-B / 第二十二轮推进 / 快捷键提示适配边界收敛`

### Notes

- 包内 Vitest 在当前环境仍受 `spawn EPERM` 约束，属于既有环境限制，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- `shortcut hints` 已不再是当前页面层主阻塞
- 当前下一轮重点转为顶部错误提示条与对话框 footer 的页面胶水复核

## [Unreleased] - 2026-04-07 / Step 04 顶部动作适配边界收敛
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceHeaderActions.tsx`，新增独立顶部动作适配组件，统一承接顶部动作区的最终 `Link/Button` 节点绑定。
- `sdkwork-notes-pc-react/scripts/workspace-page-header-actions-boundary.contract.test.mjs`，新增页面顶部动作边界 contract，冻结“顶部动作最终 UI 绑定不得继续停留在 `NotesWorkspacePage.tsx`”这一架构事实。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-顶部动作适配边界收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-顶部动作适配边界补充-2026-04-07.md`
  - `docs/架构/10-实施进度-顶部动作适配边界增量-2026-04-07.md`
  - `docs/release/Step04-顶部动作适配边界收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为直接消费 `NotesWorkspaceHeaderActions`，不再在页面层执行 `headerActions.map(...)`、`action.kind === 'link'` 分支和顶部动作图标解析。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/index.ts` 导出新的顶部动作适配边界组件。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-header-actions-boundary.contract.test.mjs` 纳入 `test:workspace:contracts`，确保顶部动作边界进入总门禁。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链，防止脚本链回退。

### Refactored

- 工作区页面顶部动作区的最终视图适配职责从页面容器层下沉到独立组件边界，页面进一步退回到“descriptor 提供 + 命令入口绑定”的薄装配职责。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-header-actions-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-command-palette-boundary.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：Step 04 页面容器纯化链路。
- 改动目的：继续消除 `NotesWorkspacePage.tsx` 中残留的顶部动作区最终视图装配胶水。
- 风险控制：通过 source contract、脚本链冻结、包级与根级 typecheck 四层验证控制回归。
- 验证摘要：新增 contract 通过，`pnpm.cmd typecheck` 已重跑 `test:workspace:contracts` 全链并通过。
- 关联能力：`Step 04 / Wave-B / 第二十一轮推进 / 顶部动作适配边界收敛`

### Notes

- 包内 Vitest 在当前环境仍受 `spawn EPERM` 约束，属于既有环境限制，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- `header actions` 已不再是当前页面层主阻塞
- 当前下一轮重点转为复核剩余页面本地渲染胶水与 `L4` 退出条件

## [Unreleased] - 2026-04-07 / Step 04 页面洞察区组件收敛
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceInsightsPanel.tsx`，新增独立洞察区组件，统一承接工作区指标卡与焦点卡渲染。
- `sdkwork-notes-pc-react/scripts/workspace-page-container-boundary.contract.test.mjs`，新增页面容器边界 contract，冻结“洞察区渲染不得继续停留在 `NotesWorkspacePage.tsx`”这一架构事实。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-页面洞察区组件收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-页面洞察区组件收敛补充-2026-04-07.md`
  - `docs/架构/10-实施进度-页面洞察区组件增量-2026-04-07.md`
  - `docs/release/Step04-页面洞察区组件收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为直接消费 `NotesWorkspaceInsightsPanel`，不再在页面层定义 `WorkspaceMetricCard` 和洞察区映射逻辑。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/index.ts` 导出新的洞察区组件。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-container-boundary.contract.test.mjs` 纳入 `test:workspace:contracts`，确保页面容器瘦身进入总门禁。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链，防止脚本链回退。

### Refactored

- 工作区页面的洞察区渲染责任从页面容器层下沉到独立组件边界，页面进一步退回到“装配 + 绑定”职责，而不是继续承担局部视图组件职责。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-chrome.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：Step 04 页面容器瘦身链路。
- 改动目的：继续消除 `NotesWorkspacePage.tsx` 中仍被架构审计点名的洞察区本地渲染胶水。
- 风险控制：通过 source contract、脚本链冻结、包级与根级 typecheck 三层验证控制回归。
- 验证摘要：新增 contract 通过，`pnpm.cmd typecheck` 重新执行 `test:workspace:contracts` 全链并通过。
- 关联能力：`Step 04 / Wave-B / 第十九轮推进 / 页面容器纯化`

### Notes

- 包内 Vitest 在当前环境仍受 `spawn EPERM` 约束，属于既有环境限制，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- 页面洞察区已不再是当前主阻塞
- 当前主阻塞继续收敛为 header action 和 command palette 的最终视图绑定胶水

## [Unreleased] - 2026-04-07 / Step 04 页面Chrome收敛
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspacePageChrome.ts`，新增页面 chrome 服务，统一承接工作区页面的 header action descriptor 与跨 command palette / 指标卡 / 焦点卡的 icon 解析策略。
- `sdkwork-notes-pc-react/scripts/workspace-page-chrome.contract.test.mjs`，新增 Node contract，冻结“页面级 icon 解析”和“顶部动作区状态化 descriptor”两类行为。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-页面Chrome收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-页面Chrome收敛补充-2026-04-07.md`
  - `docs/架构/10-实施进度-页面Chrome增量-2026-04-07.md`
  - `docs/release/Step04-页面Chrome收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为消费 `buildNotesWorkspacePageHeaderActions()` 与 `resolveNotesWorkspaceChromeIcon()`，不再在页面层内联维护 `COMMAND_PALETTE_ICONS`、`PAGE_PRESENTATION_ICONS` 和顶部动作区按钮定义。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/index.ts` 导出新的页面 chrome 服务边界。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-chrome.contract.test.mjs` 纳入 `test:workspace:contracts`，确保页面 chrome 收敛进入总门禁。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链，防止脚本链回退。

### Refactored

- 工作区页面的视觉符号与顶部动作定义从页面容器层下沉到独立服务边界，页面进一步退回到“渲染 + 绑定”职责，而不是继续承担规则定义职责。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-chrome.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-presentation-model.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：Step 04 页面容器收敛链路。
- 改动目的：继续消除 `NotesWorkspacePage.tsx` 中已被架构审计明确指出的 icon / header action 胶水。
- 风险控制：通过独立 Node contract、脚本链冻结、包级与根级 typecheck 三层验证控制回归。
- 验证摘要：新增 contract 通过，`pnpm.cmd typecheck` 重新执行 `test:workspace:contracts` 全链并通过。
- 关联能力：`Step 04 / Wave-B / 第十八轮推进 / 页面容器纯化`

### Notes

- 包内 Vitest 在当前环境仍受 `spawn EPERM` 约束，属于既有环境限制，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- repository 面向未来 `read-through / replica / queued-sync` 的接缝已不再是当前主阻塞
- 当前唯一主阻塞继续收敛为页面局部视图适配胶水

## [Unreleased] - 2026-04-07 / Step 04 读策略注册表收敛
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/repository/noteWorkspaceReadStrategyRegistry.ts`，新增读策略注册表模块，统一提供 `defaultKey / listKeys / resolve`。
- `sdkwork-notes-pc-react/scripts/workspace-read-strategy-registry.contract.test.mjs`，新增 Node contract，冻结“策略注册、默认回退、重复 key 拒绝、repository 按 key 选策略”行为。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-读策略注册表收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-读策略注册表补充-2026-04-07.md`
  - `docs/架构/10-实施进度-读策略注册表增量-2026-04-07.md`
  - `docs/release/Step04-读策略注册表收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/types/notesWorkspace.ts` 新增 `NoteWorkspaceReadStrategyKey`，显式定义 `workspace-snapshot / read-through-cache / replica-snapshot / queued-sync-snapshot`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/repository/noteRepository.ts` 改为通过 registry 解析 `workspaceReadStrategyKey`，不再只绑定单一默认策略。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/repository/noteRepository.test.ts` 补充未来策略 key 选择用例。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-read-strategy-registry.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-read-strategy-registry.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-read-strategy.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-data-source.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Notes

- `pnpm.cmd --filter @sdkwork/notes-notes test -- src/repository/noteRepository.test.ts` 在当前环境仍受 `spawn EPERM` 约束，属于既有环境问题，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- repository 面向未来 `read-through / replica / queued-sync` 的策略接缝已成为真实能力
- 当前主要残项收敛为页面容器中剩余的 icon / action / layout 胶水
## [Unreleased] - 2026-04-07 / Step 04 页面展示模型收敛
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspacePagePresentationModel.ts`，新增页面展示模型服务，统一输出 `modifierKey / shortcutHints / metricCards / focusCard`。
- `sdkwork-notes-pc-react/scripts/workspace-page-presentation-model.contract.test.mjs`，新增 Node contract，冻结页面展示模型的快捷键、统计卡片与焦点卡片行为。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-页面展示模型收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-页面展示模型补充-2026-04-07.md`
  - `docs/架构/10-实施进度-页面展示模型增量-2026-04-07.md`
  - `docs/release/Step04-页面展示模型收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为消费 `pagePresentation`，不再内联组装快捷键提示、统计卡片与焦点卡片 badge/detail。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/index.ts` 导出页面展示模型服务。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-presentation-model.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-presentation-model.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Notes

- `pnpm.cmd --filter @sdkwork/notes-notes test -- src/store/useNotesWorkspaceStore.test.ts` 在当前环境仍受 `spawn EPERM` 约束，属于既有环境问题，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- 页面展示胶水继续收敛，但命令面板 icon 映射与部分 header action/layout 装配仍在页面层
- repository 面向未来 read-through / replica / queued-sync 的策略接缝仍待建立

## [Unreleased] - 2026-04-07 / Step 04 移动笔记写路径编排收敛
### Added

- `sdkwork-notes-pc-react/scripts/workspace-write-path.contract.test.mjs` 新增 `moveNoteState()` contract，用 Node 合同锁定“move plan 预判 -> 远程移动 -> store 应用”的协作链。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-移动笔记写路径编排收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-移动笔记写路径补充-2026-04-07.md`
  - `docs/架构/10-实施进度-移动笔记写路径增量-2026-04-07.md`
  - `docs/release/Step04-移动笔记写路径编排收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/services/noteWorkspaceWriteCoordinator.ts` 新增 `NoteWorkspaceMoveNoteStateResult`、`moveNote` 依赖和 `moveNoteState()`，将移动笔记写路径的预判、服务调用与状态计划拼装下沉到 write coordinator。
- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 的 `moveNote()` 改为消费 write coordinator，而不是继续内联 `workspaceService.moveNote() + planMovedNoteState()`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-write-path.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Notes

- `pnpm.cmd --filter @sdkwork/notes-notes test -- src/store/useNotesWorkspaceStore.test.ts` 在当前环境仍受 `spawn EPERM` 约束，属于既有环境问题，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- write coordinator 现已覆盖 `createNote / createFolder / renameFolder / moveNote`
- 主要收口重点已转向 repository 策略接缝与页面容器胶水

## [Unreleased] - 2026-04-07 / Step 04 重命名文件夹写路径编排收敛
### Added

- `sdkwork-notes-pc-react/scripts/workspace-write-path.contract.test.mjs` 新增 `renameFolderState()` contract，用 Node 合同锁定“远程重命名 -> 状态计划拼装 -> store 应用”的协作链。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-重命名文件夹写路径编排收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-重命名文件夹写路径补充-2026-04-07.md`
  - `docs/架构/10-实施进度-重命名文件夹写路径增量-2026-04-07.md`
  - `docs/release/Step04-重命名文件夹写路径编排收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/services/noteWorkspaceWriteCoordinator.ts` 新增 `NoteWorkspaceRenameFolderStateResult`、`renameFolder` 依赖和 `renameFolderState()`，将重命名文件夹写路径的服务调用、返回值归一化与状态计划拼装下沉到 write coordinator。
- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 的 `renameFolder()` 改为消费 write coordinator，而不是继续内联 `workspaceService.renameFolder() + planRenamedFolderState()`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-write-path.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Notes

- `pnpm.cmd --filter @sdkwork/notes-notes test -- src/store/useNotesWorkspaceStore.test.ts` 在当前环境仍受 `spawn EPERM` 约束，属于既有环境问题，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- write coordinator 现已覆盖 `createNote / createFolder / renameFolder`
- `moveNote`、repository 策略接缝与页面容器胶水仍是后续收口重点

## [Unreleased] - 2026-04-07 / Step 04 创建文件夹写路径编排收敛
### Added

- `sdkwork-notes-pc-react/scripts/workspace-write-path.contract.test.mjs` 新增 `createFolderState()` contract，用 Node 契约锁定创建文件夹的远程调用与状态计划拼装协作链。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-创建文件夹写路径编排收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-创建文件夹写路径补充-2026-04-07.md`
  - `docs/架构/10-实施进度-创建文件夹写路径增量-2026-04-07.md`
  - `docs/release/Step04-创建文件夹写路径编排收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/services/noteWorkspaceWriteCoordinator.ts` 新增 `createFolderState()`，将创建文件夹写路径的服务调用与状态计划拼装下沉到 write coordinator。
- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 的 `createFolder()` 改为消费 write coordinator，而不是继续内联 `workspaceService.createFolder() + planCreatedFolderState()`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-write-path.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Notes

- `pnpm.cmd --filter @sdkwork/notes-notes test -- src/store/useNotesWorkspaceStore.test.ts` 在当前环境仍受 `spawn EPERM` 约束，属于既有环境问题，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- write coordinator 现已覆盖 `createNote` 与 `createFolder`
- `renameFolder / moveNote`、repository 策略接缝与页面容器胶水仍是后续收口重点

## [Unreleased] - 2026-04-07 / Step 04 创建笔记写路径编排收敛
### Added

- `sdkwork-notes-pc-react/scripts/workspace-write-path.contract.test.mjs` 新增 `createNotesWorkspaceWriteCoordinator.createNoteState()` contract，用 Node 契约锁定 “持久化 -> 详情回填 -> 状态计划” 协作链。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-创建笔记写路径编排收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-创建笔记写路径补充-2026-04-07.md`
  - `docs/架构/10-实施进度-创建笔记写路径增量-2026-04-07.md`
  - `docs/release/Step04-创建笔记写路径编排收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/services/noteWorkspaceWriteCoordinator.ts` 新增 `createNotesWorkspaceWriteCoordinator()` 与 `createNoteState()`，将创建笔记写路径的服务调用、详情回填与状态计划拼装下沉到显式 coordinator。
- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 的 `createNote()` 改为消费 write coordinator，而不是继续内联 `save + findById + planCreatedNoteState`。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-write-path.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Notes

- `pnpm.cmd --filter @sdkwork/notes-notes test -- src/store/useNotesWorkspaceStore.test.ts` 在当前环境仍受 `spawn EPERM` 约束，属于既有环境问题，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- `createNote` 已从 Step 04 主要写路径残留中移除，但 `createFolder / renameFolder / moveNote` 仍待按相同模式继续下沉
- repository 策略接缝与页面容器胶水仍是后续收口重点

## [Unreleased] - 2026-04-07 / Step 04 页面命令运行时收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspacePageCommandRuntime.ts`，统一页面命令依赖组装、命令执行、命令面板 action 转换与对话框确认命令转换
- 新增 `sdkwork-notes-pc-react/scripts/workspace-page-command-runtime.contract.test.mjs`
- 新增配套文档
  - `docs/review/step-04-页面命令运行时收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-页面命令运行时补充-2026-04-07.md`
  - `docs/架构/10-实施进度-页面命令运行时增量-2026-04-07.md`
  - `docs/release/Step04-页面命令运行时收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为通过 page command runtime service 执行页面命令，不再内联依赖工厂与执行器拼装
- `packages/sdkwork-notes-notes/src/services/index.ts` 导出 page command runtime service
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-command-runtime.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 与 contract 聚合链保持一致

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-command-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前维持 `L3`
- 页面命令依赖组装与执行已完成运行时收敛
- 当前主要剩余阻塞收缩为 store 写路径协调、repository 策略接缝与少量页面展示胶水

## [Unreleased] - 2026-04-07 / Step 04 侧栏缩放运行时收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceSidebarResizeRuntime.ts`，统一 `pointermove/pointerup` 生命周期、宽度 `220..420` 钳制与一次性 cleanup
- 新增 `sdkwork-notes-pc-react/scripts/workspace-sidebar-resize-runtime.contract.test.mjs`
- 新增配套文档
  - `docs/review/step-04-侧栏缩放运行时收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-侧栏缩放运行时补充-2026-04-07.md`
  - `docs/架构/10-实施进度-侧栏缩放运行时增量-2026-04-07.md`
  - `docs/release/Step04-侧栏缩放运行时收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为通过 sidebar resize runtime service 协调拖拽宽度与事件解绑
- `packages/sdkwork-notes-notes/src/services/index.ts` 导出 sidebar resize runtime service
- `sdkwork-notes-pc-react/package.json` 将 `workspace-sidebar-resize-runtime.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 与 contract 聚合链保持一致

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-sidebar-resize-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前维持 `L3`
- create note flow、hotkey runtime、sidebar resize runtime 均已完成页面级运行时收敛
- 当前主要剩余阻塞收缩为 store 写路径协调与 repository 策略抽象

## [Unreleased] - 2026-04-07 / Step 04 快捷键运行时收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceHotkeyRuntime.ts`，统一 keydown 绑定、搜索焦点透传、preventDefault 与页面命令分发
- 新增 `sdkwork-notes-pc-react/scripts/workspace-hotkey-runtime.contract.test.mjs`
- 新增配套文档
  - `docs/review/step-04-快捷键运行时收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-快捷键运行时补充-2026-04-07.md`
  - `docs/架构/10-实施进度-快捷键运行时增量-2026-04-07.md`
  - `docs/release/Step04-快捷键运行时收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为通过 hotkey runtime service 协调 keydown 监听与页面命令分发
- `packages/sdkwork-notes-notes/src/services/index.ts` 导出 hotkey runtime service
- `sdkwork-notes-pc-react/package.json` 将 `workspace-hotkey-runtime.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 与 contract 聚合链保持一致

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-hotkey-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前维持 `L3`
- create note flow 与 hotkey runtime 均已收敛，页面残留的主要 runtime 责任收缩到 sidebar resize 与少量装配逻辑

## [Unreleased] - 2026-04-07 / Step 04 创建笔记流程收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceCreateNoteRuntime.ts`，统一 create note 的默认标题解析、当前文件夹透传与成功态视图回切
- 新增 `sdkwork-notes-pc-react/scripts/workspace-create-note-runtime.contract.test.mjs`
- 新增配套文档
  - `docs/review/step-04-创建笔记流程收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-创建笔记流程补充-2026-04-07.md`
  - `docs/架构/10-实施进度-创建笔记流程增量-2026-04-07.md`
  - `docs/release/Step04-创建笔记流程收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为通过 create note runtime service 协调创建流程
- `packages/sdkwork-notes-notes/src/services/index.ts` 导出 create note runtime service
- `sdkwork-notes-pc-react/package.json` 将 `workspace-create-note-runtime.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 与 contract 聚合链保持一致

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-create-note-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前维持 `L3`
- create note 页面级运行时已收敛，但 hotkey runtime、sidebar resize runtime 与 store 内剩余写路径协同仍未关闭

## [Unreleased] - 2026-04-07 / Step 04 自动保存运行时收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceAutosaveRuntime.ts`，统一 autosave timer 与 `pagehide` 绑定装配
- 新增 `sdkwork-notes-pc-react/scripts/workspace-autosave-runtime.contract.test.mjs`
- 新增配套文档
  - `docs/review/step-04-自动保存运行时收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-自动保存运行时补充-2026-04-07.md`
  - `docs/架构/10-实施进度-自动保存运行时增量-2026-04-07.md`
  - `docs/release/Step04-自动保存运行时收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为通过 autosave runtime service 装配 timer 与 `pagehide` 生命周期
- `packages/sdkwork-notes-notes/src/services/index.ts` 导出 autosave runtime service
- `sdkwork-notes-pc-react/package.json` 将 `workspace-autosave-runtime.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 与 contract 聚合链保持一致

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-autosave-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前维持 `L3`
- autosave runtime 已收敛，但 create note flow 与其他页面 runtime 仍未抽离

## [Unreleased] - 2026-04-07 / Step 04 对话框运行时收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceDialogRuntime.ts`，统一 destructive dialog 的运行时协调与 restore note 流程
- 新增 `sdkwork-notes-pc-react/scripts/workspace-dialog-runtime.contract.test.mjs`
- 新增配套文档
  - `docs/review/step-04-对话框运行时收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-对话框运行时补充-2026-04-07.md`
  - `docs/架构/10-实施进度-对话框运行时增量-2026-04-07.md`
  - `docs/release/Step04-对话框运行时收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为通过 dialog runtime service 协调 destructive dialog 和 restore note
- `packages/sdkwork-notes-notes/src/services/index.ts` 导出 dialog runtime service
- `sdkwork-notes-pc-react/package.json` 将 `workspace-dialog-runtime.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 与 contract 聚合链保持一致

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-dialog-runtime.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前维持 `L3`
- destructive dialog runtime 已收敛，但 autosave runtime 与 create note flow 仍未抽离

## [Unreleased] - 2026-04-07 / Step 04 对话框状态收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceDialogState.ts`，统一 destructive dialog 的展示态生成
- 新增 `sdkwork-notes-pc-react/scripts/workspace-dialog-state.contract.test.mjs`
- 新增配套文档
  - `docs/review/step-04-对话框状态收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-对话框状态补充-2026-04-07.md`
  - `docs/架构/10-实施进度-对话框状态增量-2026-04-07.md`
  - `docs/release/Step04-对话框状态收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为消费统一 `dialogState`
- `packages/sdkwork-notes-notes/src/services/index.ts` 导出 dialog state service
- `sdkwork-notes-pc-react/package.json` 将 `workspace-dialog-state.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 与 contract 聚合链保持一致

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-dialog-state.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前维持 `L3`
- 对话框展示态已收敛，但 dialog runtime coordinator 尚未抽离

## [Unreleased] - 2026-04-07 / Step 04 自动保存策略收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceAutosave.ts`，统一自动保存计划生成与延迟常量管理
- 新增 `sdkwork-notes-pc-react/scripts/workspace-autosave.contract.test.mjs`
- 新增配套文档
  - `docs/review/step-04-自动保存策略收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-自动保存策略补充-2026-04-07.md`
  - `docs/架构/10-实施进度-自动保存策略增量-2026-04-07.md`
  - `docs/release/Step04-自动保存策略收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为消费 autosave plan，而不是页面内联推导保存规则
- `sdkwork-notes-pc-react/package.json` 将 `workspace-autosave.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 与 contract 聚合链保持一致

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-autosave.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前维持 `L3`
- 自动保存规则边界已收敛，但自动保存运行时装配仍在 `NotesWorkspacePage.tsx`，后续需继续抽离 coordinator

## [Unreleased] - 2026-04-07 / Step 04 页面依赖装配收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspacePageCommandDependencies.ts`，建立页面命令依赖工厂
- 新增 `sdkwork-notes-pc-react/scripts/workspace-page-command-dependencies.contract.test.mjs`
- 新增增量文档：
  - `docs/review/step-04-页面依赖装配收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-页面依赖装配补充-2026-04-07.md`
  - `docs/架构/10-实施进度-页面依赖装配增量-2026-04-07.md`
  - `docs/release/Step04-页面依赖装配收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为通过页面命令依赖工厂注入执行器依赖
- `packages/sdkwork-notes-notes/src/services/index.ts` 导出页面命令依赖工厂
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-command-dependencies.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步约束新的总门禁

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-command-dependencies.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前仍为 `L3`
- 页面命令装配边界已建立，但页面生命周期与局部运行时编排仍未完全收敛

## [Unreleased] - 2026-04-07 / Step 04 读取策略边界收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/repository/noteWorkspaceReadStrategy.ts`，建立 `workspace-snapshot` 读取策略边界
- 新增 `sdkwork-notes-pc-react/scripts/workspace-read-strategy.contract.test.mjs`
- 新增增量文档：
  - `docs/review/step-04-读取策略边界收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-读取策略边界补充-2026-04-07.md`
  - `docs/架构/10-实施进度-读取策略边界增量-2026-04-07.md`
  - `docs/release/Step04-读取策略边界收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/repository/noteRepository.ts` 改为通过读取策略构建工作区快照
- 新增 `createNoteRepository()` 工厂，允许后续注入自定义读取策略
- `sdkwork-notes-pc-react/package.json` 将 `workspace-read-strategy.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步约束新的总门禁

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-read-strategy.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前仍为 `L3`
- repository 读取策略边界已建立，剩余主阻塞点集中在页面依赖装配层

## [Unreleased] - 2026-04-07 / Step 04 页面命令执行收敛

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspacePageCommandExecutor.ts`，统一工作区页面命令执行边界
- 新增 `sdkwork-notes-pc-react/scripts/workspace-page-command-executor.contract.test.mjs`
- 新增增量文档：
  - `docs/review/step-04-页面命令执行收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-页面命令执行补充-2026-04-07.md`
  - `docs/架构/10-实施进度-页面命令执行增量-2026-04-07.md`
  - `docs/release/Step04-页面命令执行收敛-2026-04-07.md`

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为通过执行器统一分发页面命令，并补齐显式命令类型
- `packages/sdkwork-notes-notes/src/services/index.ts` 导出页面命令执行器
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-command-executor.contract.test.mjs` 纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步约束新的总门禁

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-command-executor.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- Step 04 当前仍为 `L3`
- 页面命令解析与执行边界已完成分离，但页面装配层与 repository 读取策略边界仍未完全收敛

## [Unreleased] - 2026-04-07 / Step 04 页面动作编排补充

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspacePageActions.ts`，统一承载快捷键、命令面板、确认框动作到页面命令的解析。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-page-actions.contract.test.mjs`。
- 新增发布说明 `docs/release/Step04-页面动作编排收敛-2026-04-07.md`。

### Changed

- `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为消费统一页面命令解析服务，减少页面内联分支。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-actions.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步更新合同门禁编排。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-actions.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- Step 04 继续维持 `L3`，页面动作解析已服务化，但动作执行与 repository 读策略抽象尚未关闭。

## [Unreleased] - 2026-04-07 / Step 04 写路径协调补充

### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceWriteCoordinator.ts`，统一承载 `createNote / createFolder / renameFolder / moveNote` 的即时状态协调逻辑。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-write-path.contract.test.mjs`，用 Node contract 锁定写路径状态收敛规则。
- 新增发布说明 `docs/release/Step04-写路径协调收敛-2026-04-07.md`。

### Changed

- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 改为通过写路径协调器回写本地状态，减少 store 内联分支。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-write-path.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步校验新的合同门禁编排。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-write-path.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### Status

- Step 04 继续维持 `L3`，写路径边界已收敛，但页面动作编排与 repository 读策略抽象尚未关闭。

## [Unreleased] - 2026-04-07

### Step 04 - L3 (Wave-B 第七轮推进)

#### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceFolderMutationCoordinator.ts`，将文件夹 delete / move 的即时状态协调沉淀为独立纯函数服务。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-folder-mutation.contract.test.mjs`，冻结文件夹删除子树裁剪、无效选中清理、descendant move 校验与新父节点展开规则。
- 新增 `docs/review/step-04-文件夹变更协调收敛-2026-04-07.md`，记录本轮 mutation 边界收口证据。

#### Changed

- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 的 `deleteFolder()` 已改为消费 `planDeletedFolderState()`。
- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 的 `moveFolder()` 已改为消费 `planMovedFolderState()`。
- `sdkwork-notes-pc-react/package.json` 的 `test:workspace:contracts` 已纳入 `workspace-folder-mutation.contract.test.mjs`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 已同步冻结新的工作区合同脚本链路。

#### Refactored

- 将文件夹 delete / move 的即时状态协调从 store 内联逻辑进一步收敛到专用 service 边界，为后续写路径协调继续收口提供复用入口。

#### Tests

- 通过 `node --test --experimental-test-isolation=none scripts/workspace-folder-mutation.contract.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- 通过 `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- 通过 `pnpm.cmd test:workspace:contracts`
- 通过 `pnpm.cmd typecheck`

#### Docs

- 回写 `docs/review/step-04-执行卡-2026-04-07.md`
- 回写 `docs/review/step-04-质量审计-2026-04-07.md`
- 回写 `docs/架构/06-业务流程-应用接口与集成设计.md`
- 回写 `docs/架构/10-实施进度-2026-04-07.md`
- 回写 `docs/release/最新版本说明.md`

#### Release

- Step 04 继续维持 `L3`，但文件夹 delete / move 的即时状态协调已被正式纳入独立 service 契约与工作区门禁。

### Step 04 - L3 (Wave-B 第六轮推进)

#### Added

- 新增 `docs/review/step-04-文件夹选择回退收敛-2026-04-07.md`，记录初始化链中文件夹选择有效性回退的专项审计结果。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-orchestrator.contract.test.mjs` 中的契约用例，冻结文件夹选择仅在当前视图仍适用且文件夹仍存在时才允许保留的行为。

#### Changed

- `packages/sdkwork-notes-notes/src/services/noteWorkspaceOrchestrator.ts` 的 `initializeWorkspace()` 现在显式接收 `currentSelectedFolderId`，并在初始化结果中返回 `selectedFolderId`。
- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 初始化工作区时会显式透传 `currentSelectedFolderId`，并直接消费 orchestrator 返回的文件夹选择结果。
- `docs/架构/06-业务流程-应用接口与集成设计.md` 与 `docs/架构/10-实施进度-2026-04-07.md` 已同步回写初始化链中的文件夹选择回退事实。

#### Refactored

- 将工作区初始化链中的文件夹选择有效性判断从 store 的本地状态推断进一步收敛到 orchestrator 契约层。

#### Tests

- 通过 `node --test --experimental-test-isolation=none scripts/workspace-orchestrator.contract.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- 通过 `pnpm.cmd test:workspace:contracts`
- 通过 `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- 通过 `pnpm.cmd typecheck`

#### Docs

- 回写 `docs/review/step-04-执行卡-2026-04-07.md`
- 回写 `docs/review/step-04-质量审计-2026-04-07.md`
- 回写 `docs/架构/06-业务流程-应用接口与集成设计.md`
- 回写 `docs/架构/10-实施进度-2026-04-07.md`

#### Release

- Step 04 继续维持 `L3`，但初始化链中的文件夹选择回退已被正式纳入 orchestrator 契约。

### Step 04 - L3 (Wave-B 第五轮推进)

#### Added

- 新增 `docs/review/step-04-列表源与选中回退收敛-2026-04-07.md`，记录工作区列表源与选中回退的专项审计结果。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-orchestrator.contract.test.mjs` 中的契约用例，冻结 `trash` 视图刷新后的列表源回退行为。

#### Changed

- `packages/sdkwork-notes-notes/src/services/noteWorkspaceOrchestrator.ts` 的 `initializeWorkspace()` 现在显式接收 `currentActiveView`，并按当前视图决定刷新后的默认选中列表源。
- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 初始化工作区时会显式透传 `currentActiveView`，避免刷新后总是从正常笔记列表做选中回退。
- `docs/架构/06-业务流程-应用接口与集成设计.md` 与 `docs/架构/10-实施进度-2026-04-07.md` 已同步回写当前列表源与选中回退事实。

#### Refactored

- 将 `trash view -> refresh -> selection fallback` 这段工作区编排规则从 store 的默认行为进一步收敛到 orchestrator 契约层。

#### Tests

- 通过 `node --test --experimental-test-isolation=none scripts/workspace-orchestrator.contract.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- 通过 `pnpm.cmd test:workspace:contracts`
- 通过 `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- 通过 `pnpm.cmd typecheck`

#### Docs

- 回写 `docs/review/step-04-执行卡-2026-04-07.md`
- 回写 `docs/review/step-04-质量审计-2026-04-07.md`
- 回写 `docs/架构/06-业务流程-应用接口与集成设计.md`
- 回写 `docs/架构/10-实施进度-2026-04-07.md`

#### Release

- Step 04 继续维持 `L3`，但 `trash` 视图的列表源与选中回退已被正式纳入 orchestrator 契约。

### Step 04 - L3 (Wave-B 第四轮推进)

#### Added

- 新增 `packages/sdkwork-notes-notes/src/types/notesWorkspace.ts` 工作区数据源能力契约：
  - `NoteWorkspaceDataSource`
  - `NoteWorkspaceDataSourceCapabilities`
  - `createRemoteAppSdkNoteWorkspaceDataSource()`
  - `createEmptyNoteWorkspaceSnapshot()`
- 新增 `sdkwork-notes-pc-react/scripts/workspace-data-source.contract.test.mjs`，将工作区数据源能力描述纳入 Node 契约测试门禁。
- 新增架构补充文档 `docs/架构/06-业务流程-应用接口与集成设计-工作区数据源能力补充-2026-04-07.md`。
- 新增 review 文档 `docs/review/step-04-数据源能力契约收敛-2026-04-07.md`。

#### Changed

- `packages/sdkwork-notes-notes/src/repository/noteRepository.ts` 的 `queryWorkspaceSnapshot()` 现在显式返回 `dataSource`。
- `packages/sdkwork-notes-notes/src/services/noteWorkspaceService.ts` 与 `noteWorkspaceOrchestrator.ts` 统一使用新的工作区快照契约。
- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts` 现在持有 `dataSource` 状态，完成 repository -> service -> orchestrator -> store 主链路对齐。
- `sdkwork-notes-pc-react/package.json` 的 `test:workspace:contracts` 已纳入 `workspace-data-source.contract.test.mjs`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 已同步更新，保证脚本门禁与执行入口一致。
- `sdkwork-notes-pc-react/scripts/workspace-orchestrator.contract.test.mjs` 已升级加载方式，以适配 orchestrator 对相对模块的真实依赖。

#### Tests

- 通过 `node --test --experimental-test-isolation=none scripts/workspace-data-source.contract.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/workspace-orchestrator.contract.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- 通过 `pnpm.cmd test:workspace:contracts`
- 通过 `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- 通过 `pnpm.cmd typecheck`

#### Notes

- 当前 Step 04 继续维持 `L3`
- 尚未关闭的缺口仍包括：
  - `refresh / list source / selection fallback` 的进一步下沉
  - page 侧快捷键与 action dispatch 的进一步收敛
  - repository 面向 read-through / replica / sync 的策略抽象预埋

### Step 04 - L3

#### Added

- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceSelectors.ts` 中的 `buildNotesWorkspaceViewModel()`，作为工作区页面统一视图模型出口。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-view-model.contract.test.mjs`，用于冻结 selector/page 边界下的视图模型输出合同。
- 新增 `packages/sdkwork-notes-notes/src/services/noteWorkspaceCommandPaletteModel.ts` 中的 `buildNoteWorkspaceCommandPaletteItems()`，作为命令面板统一条目模型出口。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-command-palette.contract.test.mjs`，用于冻结命令面板 service model 边界合同。

#### Changed

- `NotesWorkspacePage.tsx` 已改为消费单一 `workspaceViewModel`，不再在页面层自行拼装工作区视图派生状态。
- `NotesWorkspacePage.tsx` 已改为消费命令面板 descriptor，页面不再直接装配 actions / views / folders / notes 条目。
- `test:workspace:contracts` 已接入 `workspace-view-model.contract.test.mjs`。
- `test:workspace:contracts` 已接入 `workspace-command-palette.contract.test.mjs`。
- `scripts/package-scripts-contract.test.mjs` 已同步冻结新的工作区合同脚本命令。

#### Refactored

- 将 `visibleNotes / counts / activeOutline / activeTaskProgress / activeWordCount / activeNoteFolderName / activeNoteUpdatedLabel` 从 page 层 memo 逻辑收敛到 selector 纯函数层。
- 将命令面板条目数据、优先级、关键字和展示元数据从 page 层收敛到独立 service model。

#### Tests

- 通过 `node --test --experimental-test-isolation=none scripts/workspace-view-model.contract.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/workspace-command-palette.contract.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- 通过 `pnpm.cmd test:workspace:contracts`
- 通过 `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- 通过 `pnpm.cmd typecheck`

#### Docs

- 回写 Step 04 的执行卡、数据访问边界决议、质量审计和视图模型边界收敛评审文档。
- 回写 `docs/架构/06`、`docs/架构/10` 与最新版本说明。

#### Release

- Step 04 当前唯一有效结论更新为 `L3`，仍需继续留在当前 Step 完成 orchestrator / store / page 的剩余收口。

### Step 03 - L4

#### Added

- 新增 `scripts/session-store-behavior.test.mjs`，用于验证 `notes-core` 会话迁移、受控会话存储和运行时上下文解析。
- 新增 `scripts/desktop-session-bridge.contract.test.mjs`，用于冻结桌面原生会话桥与启动期水合同接线。
- 新增 Tauri 会话状态命令：
  - `read_session_state`
  - `write_session_state`
  - `clear_session_state`
- 新增 Desktop 原生会话桥：
  - `packages/sdkwork-notes-desktop/src/desktop/sessionBridge.ts`

#### Changed

- `notes-core/useAppSdkClient.ts` 已冻结统一会话存储适配接口与运行时配置解析入口。
- Web 会话主持久层从 `localStorage` 切换为 `sessionStorage`，旧键只保留一次性迁移能力。
- Desktop 启动链已在 `createDesktopApp()` 中安装原生会话桥，前端镜像与 Tauri 原生会话文件保持串行同步。
- `.env.example`、`.env.development`、`.env.test`、`.env.production` 已显式声明 `VITE_APP_OWNER_MODE=tenant`。
- `test:workspace:contracts` 与 `test:desktop:contracts` 已接入 Step 03 合同测试。

#### Fixed

- 修复 Step 03 会话行为测试依赖未声明 `esbuild` 导致的执行失败，改为基于工作区现有 `typescript` 进行最小转译验证。
- 修复“会话仍主要依赖 localStorage”的实现偏差，使 Web/Desktop 都进入受控会话边界。
- 修复运行时配置来源与 `ownerMode` 缺乏单一事实来源的治理缺口。

#### Tests

- 通过 `node --test --experimental-test-isolation=none scripts/env-config-contract.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/session-store-behavior.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/desktop-session-bridge.contract.test.mjs`
- 通过 `pnpm.cmd test:workspace:contracts`
- 通过 `pnpm.cmd test:desktop:contracts`
- 通过 `pnpm.cmd test:desktop:rust`
- 通过 `pnpm.cmd typecheck`

#### Docs

- 回写 Step 03 的 review 文档、实施进度文档、L4 收口文档与最新版本说明。

#### Release

- Step 03 当前唯一有效结论更新为 `L4`，下一执行入口切换到 `Step 04`。

### Step 02 - L4

#### Added

- 新增 `@sdkwork/notes-local`、`@sdkwork/notes-search`、`@sdkwork/notes-sync`、`@sdkwork/notes-observability`、`@sdkwork/notes-updater` 五个未来能力包落点，并将其纳入 workspace 与 lockfile 的真实工程结构。

#### Changed

- 将根级 `test:workspace:contracts` 与 `test:desktop:contracts` 统一切换为 `node --test --experimental-test-isolation=none`，使合同门禁可以在当前 Windows / PowerShell 环境中直接执行。
- 将 `internal-packages-turbo-contract.test.mjs` 的 turbo dry-run JSON 抓取方式改为文件描述符落盘读取，保持验证强度同时规避受限 stdout 管道。

#### Fixed

- 修复直接执行 `pnpm.cmd test:workspace:contracts` 时的 `spawn EPERM` 失败路径。
- 修复 turbo dry-run 合同测试在当前环境下返回 `null` 状态导致的误报失败。
- 修复五个未来能力包未进入 `pnpm-lock.yaml` importer 的集成缺口。

#### Tests

- 通过 `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- 通过 `node --test --experimental-test-isolation=none scripts/internal-packages-turbo-contract.test.mjs`
- 通过 `pnpm.cmd test:workspace:contracts`
- 通过 `pnpm.cmd test:desktop:contracts`
- 通过 `pnpm.cmd typecheck`

#### Docs

- 回写 Step 02 的 review 文档、实施进度文档、L4 收口文档与最新版本说明。

#### Release

- Step 02 当前唯一有效结论更新为 `L4`，下一执行入口切换到 `Step 03`。
## [Unreleased] - 2026-04-07 / Step 04 命令面板适配边界收敛
### Added

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceCommandPalette.tsx`，新增命令面板适配边界组件，统一承接 descriptor 到最终 `NoteCommandPaletteItem` 的 UI item 绑定。
- `sdkwork-notes-pc-react/scripts/workspace-page-command-palette-boundary.contract.test.mjs`，新增页面命令面板边界 contract，冻结“命令面板最终 UI 绑定不得继续停留在 `NotesWorkspacePage.tsx`”这一架构事实。
- 新增本轮审计、架构、发布文档：
  - `docs/review/step-04-命令面板适配边界收敛-2026-04-07.md`
  - `docs/架构/06-业务流程-应用接口与集成设计-命令面板适配边界补充-2026-04-07.md`
  - `docs/架构/10-实施进度-命令面板适配边界增量-2026-04-07.md`
  - `docs/release/Step04-命令面板适配边界收敛-2026-04-07.md`

### Changed

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 改为直接消费 `NotesWorkspaceCommandPalette`，不再在页面层本地组装 `NoteCommandPaletteItem[]`。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/index.ts` 导出新的命令面板适配边界组件。
- `sdkwork-notes-pc-react/package.json` 将 `workspace-page-command-palette-boundary.contract.test.mjs` 纳入 `test:workspace:contracts`。
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 同步冻结新的 contract 聚合链，防止脚本链回退。

### Refactored

- 工作区页面的命令面板最终图标解析与点击闭包绑定从页面容器层下沉到独立组件边界，页面进一步退回到“descriptor 提供 + 执行入口绑定”职责。

### Tests

- `node --test --experimental-test-isolation=none scripts/workspace-page-command-palette-boundary.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-command-palette.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### Release

- 影响范围：Step 04 页面容器纯化链路。
- 改动目的：继续消除 `NotesWorkspacePage.tsx` 中残留的命令面板 UI 适配胶水。
- 风险控制：通过 source contract、脚本链冻结、包级与根级 typecheck 四层验证控制回归。
- 验证摘要：新增 contract 通过，`pnpm.cmd typecheck` 重新执行 `test:workspace:contracts` 全链并通过。
- 关联能力：`Step 04 / Wave-B / 第二十轮推进 / 页面容器纯化`

### Notes

- 包内 Vitest 在当前环境仍受 `spawn EPERM` 约束，属于既有环境限制，不作为本轮回归依据。

### Status

- Step 04 维持 `L3`
- command palette 已不再是当前页面层主阻塞
- 当前主阻塞继续收敛为 header action 到最终 button/link 节点的 UI 绑定

