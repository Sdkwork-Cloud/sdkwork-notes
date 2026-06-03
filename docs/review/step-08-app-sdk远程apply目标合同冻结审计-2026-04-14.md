# Step 08 app-sdk远程apply目标合同冻结审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-target.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-target-contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-contract.test.mjs`
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`

## 审计结论

- 本轮没有发现新的 P0 / P1 缺陷。
- 在“上游真实合同仍缺失”的前提下，把 future `app-sdk / app-api` 目标合同冻结为本地 spec 是正确增量，它让后续上游实现不再依赖口头约定。
- 当前冻结的最小目标合同为：
  - semantic SDK method：`client.note.remoteApply(noteId, body)`
  - controller owner：`NotesAppApiController`
  - route aliases：
    - `POST /app/v3/api/notes/{noteId}:remoteApply`
    - `POST /app/v3/api/notes/{noteId}/remote-apply`
  - request 继续对齐本地 `NotesSyncRemoteApplyRequest`
  - response 使用单一 typed body，通过 `outcome = applied | conflict` 区分结果；transport failure 继续作为异常抛出，而不是塞进 typed response

## 已确认成立的约束

1. future request 仍必须显式覆盖：
   - `idempotencyKey`
   - `taskId`
   - `entityType`
   - `entityId`
   - `operation`
   - `mutation`
   - `localRevision`
   - `baseRemoteCursor`
2. 路径 `noteId` 与 body `entityId` 必须保持一致，避免 replay 请求被错误重定向到其他实体。
3. `entityType` 在 notes 场景下必须固定为 `note`，不在本轮扩展多实体 transport。
4. 成功与冲突都必须回传 `remoteCursor`，否则本地游标推进没有统一事实来源。
5. 领域冲突被定义为 typed outcome，而不是依赖 SDK 对 HTTP 409 exception body 的非稳定解析。
6. transport failure 仍然应该抛出，让现有 worker/runtime 的 retry / failed 路径继续承接，不把网络失败塞进语义 response。

## 残余风险

- 当前 spec 只是本地冻结目标，不代表上游已经实现。
- 若后续上游坚持采用不同的 method name、path style 或 conflict 表达方式，需要同步更新本地 spec、contract test 与 `notes-sync` adapter 假设。
- 当前仍没有真实 `remoteApply(noteId, body)` SDK surface，也没有 ack apply runtime。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

1. 上游 `spring-ai-plus-app-api` / OpenAPI / generator 实现时，优先按本地 spec 落 `remoteApply(noteId, body)`，避免新增第二套命名。
2. 一旦上游生成了真实 SDK method，下一轮应先在 shared wrapper 加最薄 adapter，再把 bootstrap `apply(request)` 接到该 adapter。
3. 在真实 SDK method 生成前，继续禁止把现有 direct-write note API 当作 replay handler。
