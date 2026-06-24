> Migrated from `docs/release/Step08-同步任务远端apply幂等边界-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step08-同步任务远端apply幂等边界 - 2026-04-14

## 发布摘要

- `notes-sync` 现已新增显式 `NotesSyncRemoteApplyRequest`。
- `createNotesSyncRemoteApplyRequest(task)` 会把 `replayable: true` 任务转换成带 `idempotencyKey` 的远端 apply 请求。
- `createNotesSyncRemoteApplyExecutor({ apply })` 已把 worker 侧 `execute(task)` 适配为 transport 侧 `apply(request)`。

## 风险控制

- 当前 `replayable: false` 的 `direct-write` 影子任务仍然不能被转换成远端请求。
- 远端请求中的 `mutation` 会复制 payload，避免 transport 层原地污染队列快照对象。
- 本轮没有接入真实 App SDK note 写接口，也没有宣称真实自动 replay 已打通。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 发布结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 同步任务远端apply幂等边界 = L3`

下一轮仍需停留在 `CP08-4`，把这条显式 request boundary 接到真实 replay-safe transport / ack apply 实现上，而不是直接重用当前 `direct-write` note 写接口。

