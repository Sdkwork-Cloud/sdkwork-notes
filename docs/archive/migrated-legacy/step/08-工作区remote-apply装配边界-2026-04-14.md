# Step 08 / 工作区remote-apply装配边界 - 2026-04-14

## 本轮目标

把上一轮冻结的 `NotesSyncRemoteApplyRequest` 从 `notes-sync` 包内合同继续推进到 `notes-notes` 的 runtime / bootstrap 装配边界，使工作区层能够直接消费 `apply(request)`，而不是只能注入 `execute(task)`。

## 实际完成

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSyncRuntime.ts`
   - `createNotesWorkspaceSyncRuntime(...)` 现在既支持 `execute(task)`，也支持 `apply(request)`。
   - 当调用方提供 `apply(request)` 时，runtime 会通过 `createNotesSyncRemoteApplyExecutor({ apply })` 自动适配到 worker `execute(task)` 边界。
2. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/bootstrap/notesWorkspaceStoreBootstrap.ts`
   - `bootstrapNotesWorkspaceStore(...)` 现在新增 `apply(request)` 注入入口。
   - bootstrap 在收到 `apply(request)` 时，会构建消费显式 request 的 workspace sync runtime。
3. Node contract 已新增覆盖：
   - runtime 能把 `apply(request)` 适配进 worker drain。
   - bootstrap 能接受 `apply(request)` 并把它传给 runtime 边界。

## 风险控制

1. 当前默认 `AppProviders` 仍然只调用 `bootstrapNotesWorkspaceStore()`，没有自动注入真实 `apply(request)`。
2. 当前 note 主写入链仍然是 `direct-write`，已接入任务仍然都是 `replayable: false`，因此本轮不会让现有任务自动触发真实 replay。
3. 本轮没有接真实 App SDK / HTTP handler，也没有宣称 ack apply、冲突恢复 UI 或手动 replay 已完成。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
pnpm.cmd typecheck
```

## 结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 工作区remote-apply装配边界 = L3`

## 下一轮入口

1. 在 app/bootstrap 或 desktop/background 层提供真实 `apply(request)` 实现。
2. 让该实现返回真实 ack / `remoteCursor`，进入远端 apply 与回执合并闭环。
3. 在此之前，不要把当前 `direct-write` note 写接口直接作为原始 replay handler 暴露给 worker。
