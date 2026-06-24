> Migrated from `docs/review/step-08-工作区remote-apply装配边界审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 工作区remote-apply装配边界审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSyncRuntime.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/bootstrap/notesWorkspaceStoreBootstrap.ts`
- `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs`

## 审计结论

- 本轮未发现新的 P0 / P1 级问题。
- 把 workspace runtime / bootstrap 边界升级为可直接消费 `apply(request)` 是正确的增量，它让未来 transport 装配层不必自己拼接 `execute(task)` 适配逻辑。
- 当前仍然没有默认 transport caller，因此这轮是“可接入”而不是“已接入”。

## 已确认成立的约束

1. `createNotesWorkspaceSyncRuntime(...)` 现在接受两类注入：
   - `execute(task)`
   - `apply(request)`
2. 当提供 `apply(request)` 时，runtime 会复用 `notes-sync` 的 `createNotesSyncRemoteApplyExecutor({ apply })`，而不是在 `notes-notes` 里重写第二套 request 映射逻辑。
3. `bootstrapNotesWorkspaceStore(...)` 现在已支持显式 `apply(request)` 注入。
4. bootstrap 在 `apply(request)` 路径下会构建 workspace sync runtime，并把该 runtime 写入 store binding。
5. 当前默认 app shell 仍不会自动注入 `apply(request)`，因此不会制造伪同步。

## 残余风险

- 仍没有真实远端 transport / ack apply 实现。
- 默认 app shell 尚未消费这条新边界。
- 当前 replayable 生产链仍不存在；已接入 note 写路径依然是 `direct-write` 影子任务。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
pnpm.cmd typecheck
```

## 审计建议

1. 下一轮优先让 app/bootstrap 或 desktop/background 提供真实 `apply(request)`。
2. `remoteCursor` 回执合并要和该 transport 一起落地，不要再追加新的空壳 runtime。

