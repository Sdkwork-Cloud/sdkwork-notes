> Migrated from `docs/架构/10-实施进度-Step08工作区remote-apply装配边界-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度-Step08工作区remote-apply装配边界-2026-04-14

## 1. 本轮定位

本轮继续停留在 `Step 08 / CP08-4`，目标是把上一轮冻结的 `remote apply request` 合同接到 `notes-notes` 的 workspace runtime / bootstrap 边界，但仍然不接真实 transport。

## 2. 已落地的实现事实

1. `createNotesWorkspaceSyncRuntime(...)` 现在既支持 `execute(task)`，也支持 `apply(request)`。
2. `apply(request)` 路径复用 `notes-sync` 的 `createNotesSyncRemoteApplyExecutor({ apply })`，不会在 workspace 层复制第二套 request 映射逻辑。
3. `bootstrapNotesWorkspaceStore(...)` 现在支持 `apply(request)` 注入，并能据此创建 workspace sync runtime。

## 3. 这轮刻意不做的事情

1. 不自动修改 `AppProviders` 的默认 bootstrap 调用方式。
2. 不接真实 App SDK / HTTP transport。
3. 不把当前 note 写路径的任务改成 `replayable: true`。

## 4. 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
pnpm.cmd typecheck
```

## 5. 阶段结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 工作区remote-apply装配边界 = L3`

这轮的意义不是“工作区已默认开启后台同步”，而是“工作区层现在已经有了消费显式 remote apply request 的正式注入点”。

