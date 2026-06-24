# 10-实施进度-Step08app-sdk远程apply共享包装服务合同冻结-2026-04-14

## 本轮目标

冻结 future `@sdkwork/notes-core` shared-wrapper public service surface，确保后续真实 `remoteApply(noteId, body)` 落地时，shared-wrapper 只需实现最薄 service，而不需要重新讨论 service 命名、输入输出边界和异常策略。

## 本轮完成

1. 新增 `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-service.contract.json`
   - 冻结 shared-wrapper owner：`@sdkwork/notes-core`
   - 冻结 service 目标文件：`packages/sdkwork-notes-core/src/services/appNoteSyncService.ts`
   - 冻结 service export：`appNoteSyncService`
   - 冻结 service interface：`IAppNoteSyncService`
   - 冻结 service method：`remoteApply`
   - 冻结 local input / output：
     - `NotesSyncRemoteApplyRequest`
     - `NotesSyncTaskExecutionResult`
   - 冻结内部依赖：
     - `getAppSdkClientWithSession`
     - `unwrapAppSdkResponse`
     - `client.note.remoteApply(request.entityId, request)`
2. 新增 `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-service-contract.test.mjs`
   - 把 service spec、target contract、result adapter contract 与当前 notes-core service pattern 绑定为一个可执行 guardrail。
3. 更新 `sdkwork-notes-pc-react/package.json`
4. 更新 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 把新 service contract 纳入 `test:workspace:contracts`。

## 架构结论

- 当前 shared-wrapper public service 层已经形成明确 contract：
  - 外部只消费本地 `NotesSyncRemoteApplyRequest`
  - 外部只返回本地 `NotesSyncTaskExecutionResult`
  - 内部再对接 future generated `NoteRemoteApplyRequest / NoteRemoteApplyResultVO`
- 结果映射职责继续由 result adapter contract 承担，service contract 不重新发明第二套结果语义。
- transport failure 继续留在异常边界，由 worker 的现有失败恢复链路处理。

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply共享包装服务合同冻结 = L3`

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-service-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```
