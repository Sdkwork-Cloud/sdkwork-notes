# Step 08 app-sdk远程apply上游闭环输入合同冻结审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-upstream-closure.contract.json`
- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-target.contract.json`
- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-service.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-contract.test.mjs`
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
- `spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/notes/NotesAppApiController.java`
- `spring-ai-plus-app-api/sdkwork-sdk-app/README.md`
- `spring-ai-plus-app-api/sdkwork-sdk-app/app-openapi-8080.json`
- `spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/sdk.ts`
- `spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/note.ts`

## 审计结论

- 本轮没有发现新的 P0 / P1 缺陷。
- 在“当前工作区不能修改兄弟仓库，且上游真实 `note.remoteApply(noteId, body)` 仍未落地”的前提下，冻结 upstream closure input contract 是正确增量，因为它把未来上游真实闭环的唯一入口从口头约定提升为可执行 spec。
- 当前冻结的最小 upstream closure path 为：
  - app-api repo：`spring-ai-plus-app-api`
  - controller file：`NotesAppApiController.java`
  - OpenAPI base snapshot：`sdkwork-sdk-app/app-openapi-8080.json`
  - regen guide：`sdkwork-sdk-app/README.md`
  - prepare script：`sdkwork-sdk-app/bin/prepare-openapi-source.mjs`
  - TypeScript SDK package：`sdkwork-sdk-app/sdkwork-app-sdk-typescript`

## 已确认成立的约束

1. future semantic app capability 仍必须继续对齐：
   - `client.note.remoteApply(noteId, body)`
   - `NotesAppApiController`
   - `POST /app/v3/api/notes/{noteId}:remoteApply`
   - `POST /app/v3/api/notes/{noteId}/remote-apply`
2. 上游闭环的唯一生成入口必须继续使用：
   - `app-openapi-8080.json`
   - `upgrade/`
   - `prepare-openapi-source.mjs`
   - `sdkwork-app-sdk-typescript`
3. 当前 generated SDK 仍只有 `sdk.ts` 与 `api/note.ts` 的 existing note surface；`note-remote-apply-request.ts` 与 `note-remote-apply-result-vo.ts` 仍不存在。
4. 当前 `NotesAppApiController`、`sdk.ts` 与 `api/note.ts` 中仍不存在 `remoteApply`、`:remoteApply` 或 `/remote-apply` 标记。
5. 本轮继续禁止三类错误路径：
   - app 本地 handwritten remote apply HTTP client
   - shared-wrapper fake success fallback
   - direct-write API remapping as replay transport

## 残余风险

- 当前 spec 只冻结了 future upstream closure 输入，不代表兄弟仓库已经开始实现。
- 当前 OpenAPI overlay 文件仍未创建，后续上游实现时仍需要决定具体 upgrade 文档与 overlay 命名。
- 当前 generated request/result type 文件仍不存在，shared-wrapper 仍不能进入真实实现阶段。
- 当前 bootstrap `apply(request)` 仍没有真实远端 handler 可接。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-service-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

1. 当上游进入可改状态时，先按此 spec 补 controller / OpenAPI / SDK regen，不要先在 app 本地写 workaround。
2. 上游真实 `remoteApply` 生成前，继续保持 `Step 08 / CP08-4 = L2`，不得提前声称 shared-wrapper 或 runtime 已闭环。
3. 上游真实产物生成后，再回到 `@sdkwork/notes-core` 落最薄 `appNoteSyncService` 实现，并继续复用既有 result adapter contract。
