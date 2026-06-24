> Migrated from `docs/架构/10-实施进度-Step08工作区store-bootstrap调用接线-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度 - Step08 工作区 store bootstrap 调用接线 - 2026-04-14

## 进度摘要

- 已完成 `notesWorkspaceStore` 的 session caller wiring。
- `notes-notes` 现在对外暴露 bootstrap facade，shell provider 负责在认证态接线、在退出态 reset。
- 当前实现只把 queue/store/bootstrap 边界接通，未实现真实远端执行。

## 已落地文件

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/bootstrap/notesWorkspaceStoreBootstrap.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/bootstrap/index.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/index.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-shell/src/application/providers/AppProviders.tsx`
- `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs`

## 能力判定

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / notes-notes 工作区 store bootstrap 调用接线 = L3`

## 架构含义

1. shell 现在拥有明确的 session 级 bootstrap 调用点。
2. `notes-notes` 负责封装 store/runtime 组装细节，避免跨包把 runtime 细节外泄。
3. runtime 依然是“可注入、未闭环”的状态，真实 handler 仍是下一道门槛。

## 下一步

- 把真实 `execute(task)` handler 接到 `bootstrapNotesWorkspaceStore({ execute })`。
- 在 handler 成立后再补 remote ack apply。
- 在 desktop/background 侧决定最终 runtime caller 所属边界。

