# Step 08 app-sdk远程apply结果适配合同冻结审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-result-adapter.contract.json`
- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-target.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-target-contract.test.mjs`
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-core/src/sdk/useAppSdkClient.ts`

## 审计结论

- 本轮没有发现新的 P0 / P1 缺陷。
- 在“上游真实 `remoteApply(noteId, body)` 仍未落地”的前提下，继续冻结 future result adapter 合同是正确增量，因为它把“未来如何把 app-sdk 语义结果接回本地 sync worker”从口头约定提升为可审计 spec。
- 当前冻结的最小结果适配合同为：
  - shared wrapper owner：`@sdkwork/notes-core`
  - client accessor：`getAppSdkClientWithSession`
  - semantic SDK method：`client.note.remoteApply(noteId, body)`
  - `applied -> completed`
  - `conflict -> conflict`
  - transport failure 继续 `throw`

## 已确认成立的约束

1. semantic response 只允许映射为本地 `completed` 或 `conflict`，不允许引入“语义 failed payload”。
2. `applied` 必须继续使用 `appliedAt` 和 `remoteCursor` 驱动本地 `completed` 结果。
3. `conflict` 必须继续使用 `conflict.occurredAt`、`conflict.message` 和 `conflict.code` 驱动本地 `conflict` 结果。
4. `conflict.code` 当前允许直接透传：
   - `stale-base-version`
   - `deleted-remotely`
   - `folder-structure-changed`
   超出集合时必须回退到 `unknown`。
5. transport failure 继续要求 `throw`，交由现有 `executeNextNotesSyncTask()` 的 unexpected failure 路径收敛为 `failed / unknown / retryable=true`。
6. 本轮继续禁止 wrapper 层伪造 direct-write fallback，也继续禁止把 path `noteId` 与 body `entityId` 解绑。

## 残余风险

- 当前 spec 只冻结了结果适配目标，不代表上游 `@sdkwork/app-sdk` 已经存在真实 `note.remoteApply()`。
- 当前还没有 shared wrapper 的真实 adapter 实现，也没有把 bootstrap `apply(request)` 接到真实 generated SDK method。
- 若未来上游返回新的 conflict code，本地当前策略会先回退到 `unknown`；这能保持安全，但仍需要后续补充更精细的冲突分类。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

1. 等上游生成真实 `note.remoteApply(noteId, body)` 后，先在 `@sdkwork/notes-core` 落一层最薄 adapter，再让 shell/bootstrap 注入该 adapter。
2. adapter 只负责 request/response 映射，不要吞掉 transport exception，也不要在 wrapper 内补 direct-write 兼容分支。
3. 若上游 conflict code 集合扩大，应优先更新本地 result adapter spec 和 contract test，再决定是否扩展 `NotesSyncConflictCode`。
