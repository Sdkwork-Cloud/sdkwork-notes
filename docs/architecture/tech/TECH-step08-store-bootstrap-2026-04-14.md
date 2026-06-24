> Migrated from `docs/release/Step08-工作区store-bootstrap调用接线-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step08 - 工作区 store bootstrap 调用接线 - 2026-04-14

## 交付摘要

- 新增 `notes-notes` bootstrap facade，用于在 session 边界显式装配 notes workspace store。
- `AppProviders` 现在在认证态执行 bootstrap，在退出/切换用户时 reset。
- 该接线只推进 caller wiring，不伪造远端执行闭环。

## 影响范围

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/bootstrap/notesWorkspaceStoreBootstrap.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/bootstrap/index.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/index.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-shell/src/application/providers/AppProviders.tsx`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-shell/src/application/providers/AppProviders.test.tsx`
- `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs`

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / notes-notes 工作区 store bootstrap 调用接线 = L3`

## 未完成项

- 真实 `execute(task)` handler
- remote ack apply / `remoteCursor`
- desktop/background runtime caller
- conflict/manual replay UI

