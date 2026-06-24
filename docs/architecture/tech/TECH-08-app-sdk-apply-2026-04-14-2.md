> Migrated from `docs/step/08-app-sdk远程apply共享包装服务合同冻结-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 / app-sdk远程apply共享包装服务合同冻结 - 2026-04-14

## 本轮目标

在上一轮已经冻结 future `remoteApply(noteId, body)` target contract 和 result adapter contract 的基础上，继续冻结 future `@sdkwork/notes-core` shared-wrapper public service surface，明确后续真实 adapter 应该以什么服务名、输入输出类型、调用约束和结果映射对接 `notes-sync` worker。

## 实际完成

1. `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-service.contract.json`
   - 新增 shared-wrapper service contract spec。
   - 冻结 future service owner：
     - `@sdkwork/notes-core`
     - `packages/sdkwork-notes-core/src/services/appNoteSyncService.ts`
     - `IAppNoteSyncService`
     - `appNoteSyncService.remoteApply`
   - 冻结 service 输入输出：
     - 输入：`NotesSyncRemoteApplyRequest`
     - 输出：`NotesSyncTaskExecutionResult`
   - 冻结 service 内部调用约束：
     - `getAppSdkClientWithSession`
     - `unwrapAppSdkResponse`
     - `client.note.remoteApply(request.entityId, request)`
   - 冻结 service guardrail：
     - `request.entityType` 必须保持 `note`
     - path `noteId` 必须与 `request.entityId` 一致
     - transport failure 必须继续 `throw`
     - 禁止 direct-write fallback
2. `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-service-contract.test.mjs`
   - 新增 Node contract。
   - 锁定 shared-wrapper service spec 的 owner、输入输出、SDK 调用形状、public exports 目标和禁止项。
   - 同时校验该 spec 与：
     - `notes-remote-apply-app-sdk-target.contract.json`
     - `notes-remote-apply-app-sdk-result-adapter.contract.json`
     - `NotesSyncRemoteApplyRequest`
     - `NotesSyncTaskExecutionResult`
     - 现有 `notes-core` service pattern
     保持一致。
3. `sdkwork-notes-pc-react/package.json`
4. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 已把新 contract 纳入根级 `test:workspace:contracts` 与脚本门禁。

## 风险控制

1. 本轮只冻结 future shared-wrapper public service contract，不引入任何伪运行时 service 实现。
2. 本轮不新增 `packages/sdkwork-notes-core/src/services/appNoteSyncService.ts` 占位实现，避免误导为“已具备真实 remote apply 能力”。
3. 本轮不把现有 note direct-write API 伪装成 `appNoteSyncService.remoteApply(request)`。
4. 本轮继续保持：
   - `Step 08 = L2`
   - `CP08-4 / 冲突与失败恢复验证 = L2`

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-service-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply共享包装服务合同冻结 = L3`

## 下一轮入口

1. 若上游真实 `client.note.remoteApply(noteId, body)` 已生成，优先在 `@sdkwork/notes-core` 落一层最薄 `appNoteSyncService` 实现，并保持异常继续走 worker 现有失败恢复链。
2. 若上游真实方法仍未生成，继续停留在 `Step 08 / CP08-4`，只补“闭合准备度” guardrail，不伪造 runtime 能力。
3. 只有 shared-wrapper service 与上游 semantic SDK 都真实存在后，才允许把 bootstrap `apply(request)` 接到真实 service。

