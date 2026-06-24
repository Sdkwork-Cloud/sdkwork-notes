> Migrated from `docs/架构/10-实施进度-Step08同步任务远端apply幂等边界-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度-Step08同步任务远端apply幂等边界-2026-04-14

## 1. 本轮定位

本轮继续停留在 `Step 08 / CP08-4`，目标不是接入真实远端 replay，而是先把“worker 与未来 transport 如何交接”冻结为显式、可审计、带幂等键的请求边界。

## 2. 已落地的实现事实

1. `notes-sync` 新增 `NotesSyncRemoteApplyRequest`，当前远端 apply 请求显式固定：
   - `idempotencyKey`
   - `taskId`
   - `entityType / entityId / operation`
   - `localRevision`
   - `baseRemoteCursor`
   - `mutation`
2. `createNotesSyncRemoteApplyRequest(task)` 仅允许转换 `replayable: true` 的任务。
3. `createNotesSyncRemoteApplyExecutor({ apply })` 已把既有 worker 侧 `execute(task)` 边界收敛为 transport 侧 `apply(request)`。
4. `mutation` 会在转换时复制，避免远端执行层原地污染队列中的任务快照。

## 3. 这轮刻意不做的事情

1. 不接真实 App SDK note 写接口。
2. 不实现真实 ack apply / `remoteCursor` 合并。
3. 不把当前 `direct-write` 影子任务升级为 `replayable: true`。

## 4. 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 5. 阶段结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 同步任务远端apply幂等边界 = L3`

这轮的意义不是“远端同步已完成”，而是“未来 transport 将消费显式 request，而不是直接消费原始 task 对象”。

