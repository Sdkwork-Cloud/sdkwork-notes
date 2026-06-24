> Migrated from `docs/review/step-08-同步任务远端apply幂等边界审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 同步任务远端apply幂等边界审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`
- `sdkwork-notes-pc-react/scripts/workspace-sync-remote-apply.contract.test.mjs`
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`

## 审计结论

- 本轮未发现新的 P0 / P1 级问题。
- 先冻结“显式远端 apply 请求”再接 transport，是比继续让 handler 直接消费原始 `NotesSyncTask` 更稳妥的边界收敛。
- 将 `task.id` 显式提升为 `idempotencyKey` 是正确的最小合同，它至少把未来远端去重键从隐式约定提升成可审计字段。

## 已确认成立的约束

1. `createNotesSyncRemoteApplyRequest(task)` 只接受 `replayable: true` 的任务。
2. 当前转换后的远端请求显式带有：
   - `idempotencyKey`
   - `taskId`
   - `entityType / entityId / operation`
   - `localRevision`
   - `baseRemoteCursor`
   - `mutation`
3. 请求中的 `mutation` 不是对原始 task payload 的直接对象透传，而是复制型映射。
4. `createNotesSyncRemoteApplyExecutor({ apply })` 已把未来 transport 所需输入收敛为 `apply(request)`，无需让 transport 直接读取 worker 内部任务对象。
5. 新 contract 已纳入 `test:workspace:contracts`，脚本声明与实际门禁保持一致。

## 残余风险

- 当前仍没有真实 transport、鉴权、幂等回执与 ack apply 实现。
- `idempotencyKey = task.id` 只是最小边界，远端如何持久化与去重仍待后续实现确认。
- 当前系统仍然没有真正的 `replayable: true` note 主写入生产链；现有 note 写任务仍然是 `direct-write` 成功后的同步影子。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

1. 继续停留在 `Step 08 / CP08-4`。
2. 下一轮优先实现真实 replay-safe transport / ack apply handler，而不是扩散更多 queue UI。
3. 在真实 transport 落地前，不要把当前 App SDK note 写接口直接接到 `createNotesSyncRemoteApplyExecutor({ apply })` 的 `apply` 侧。

