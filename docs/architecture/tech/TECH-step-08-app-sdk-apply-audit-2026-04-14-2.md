> Migrated from `docs/review/step-08-app-sdk远程apply共享包装服务合同冻结审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 app-sdk远程apply共享包装服务合同冻结审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-service.contract.json`
- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-result-adapter.contract.json`
- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-target.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-service-contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-target-contract.test.mjs`
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-core/src/services/appUserService.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-core/src/sdk/useAppSdkClient.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-core/src/sdk/appSdkResult.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`

## 审计结论

- 本轮没有发现新的 P0 / P1 缺陷。
- 在“上游真实 `note.remoteApply(noteId, body)` 仍未落地”的前提下，继续冻结 future shared-wrapper public service contract 是正确增量，因为它把“未来 `@sdkwork/notes-core` 应该如何把 app-sdk 语义结果接回本地 sync worker”从口头约定提升为可执行 spec。
- 当前冻结的最小 shared-wrapper public service contract 为：
  - shared wrapper package：`@sdkwork/notes-core`
  - service file：`packages/sdkwork-notes-core/src/services/appNoteSyncService.ts`
  - service export：`appNoteSyncService`
  - service interface：`IAppNoteSyncService`
  - service method：`remoteApply`
  - local input：`NotesSyncRemoteApplyRequest`
  - local output：`NotesSyncTaskExecutionResult`
  - client accessor：`getAppSdkClientWithSession`
  - response unwrapper：`unwrapAppSdkResponse`
  - semantic SDK method：`client.note.remoteApply(request.entityId, request)`

## 已确认成立的约束

1. shared-wrapper public service 的对外输入必须继续使用本地 `NotesSyncRemoteApplyRequest`，不能把 worker 直接耦合到 future generated `NoteRemoteApplyRequest`。
2. shared-wrapper public service 的对外输出必须继续使用本地 `NotesSyncTaskExecutionResult`，保持 worker 与 runtime 的现有稳定语义。
3. shared-wrapper service 内部调用必须继续绑定：
   - `getAppSdkClientWithSession`
   - `unwrapAppSdkResponse`
   - `client.note.remoteApply(request.entityId, request)`
4. service 必须继续遵守：
   - `request.entityType` 必须保持 `note`
   - path `noteId` 必须与 body `request.entityId` 一致
5. semantic response 到本地结果的映射必须继续委托给 `notes-remote-apply-app-sdk-result-adapter.contract.json`，不允许在 service contract 层重新发明第二套映射。
6. transport failure 必须继续 `throw`，交由现有 `executeNextNotesSyncTask()` 的 unexpected failure 路径收敛为 `failed / unknown / retryable=true`。
7. 本轮继续禁止 wrapper 层补 direct-write fallback，也继续禁止 service 层吞掉 transport error。

## 残余风险

- 当前 spec 只冻结了 future shared-wrapper public service surface，不代表 `packages/sdkwork-notes-core/src/services/appNoteSyncService.ts` 已经存在。
- 当前仍没有真实 generated SDK 方法 `client.note.remoteApply(noteId, body)`。
- 当前也没有把 bootstrap `apply(request)` 接到真实 shared-wrapper service。
- 若未来上游返回新的 conflict code，本地仍需要先更新 result adapter spec，再决定是否扩展 `NotesSyncConflictCode`。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-service-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

1. 只有在上游真实 `note.remoteApply(noteId, body)` 生效后，才在 `@sdkwork/notes-core` 落最薄 `appNoteSyncService` 实现。
2. `appNoteSyncService` 只负责 request/response 映射，不要吞掉 transport exception，也不要补 direct-write fallback。
3. 在真实 service 落地前，继续把 `Step 08 / CP08-4` 保持在 `L2`，不要提前声明 shared-wrapper 已闭环。

