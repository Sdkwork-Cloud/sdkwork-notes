# Step 08 / app-sdk远程apply上游闭环输入合同冻结 - 2026-04-14

## 本轮目标

在已经冻结 target contract、result adapter contract 和 shared-wrapper service contract 的基础上，继续把“未来要去哪里补齐上游能力”冻结为可执行 spec，明确 `spring-ai-plus-app-api`、OpenAPI snapshot / upgrade 流程和 TypeScript SDK 生成产物的唯一闭环入口。

## 实际完成

1. `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-upstream-closure.contract.json`
   - 新增 upstream closure contract spec。
   - 冻结 future 上游闭环入口：
     - `spring-ai-plus-app-api`
     - `src/main/java/com/sdkwork/ai/gateway/api/app/v3/notes/NotesAppApiController.java`
     - `sdkwork-sdk-app/README.md`
     - `sdkwork-sdk-app/app-openapi-8080.json`
     - `sdkwork-sdk-app/upgrade`
     - `sdkwork-sdk-app/sdkwork-app-sdk-typescript`
   - 冻结 future generated outputs：
     - `sdkwork-app-sdk-typescript/src/sdk.ts`
     - `sdkwork-app-sdk-typescript/src/api/note.ts`
     - `sdkwork-app-sdk-typescript/src/types/note-remote-apply-request.ts`
     - `sdkwork-app-sdk-typescript/src/types/note-remote-apply-result-vo.ts`
   - 冻结 regen workflow：
     - `curl http://localhost:8080/v3/api-docs/app -o spring-ai-plus-app-api/sdkwork-sdk-app/app-openapi-8080.json`
     - `sdkwork-sdk-app/bin/prepare-openapi-source.mjs`
2. `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs`
   - 新增 Node contract。
   - 锁定 upstream closure spec 的 owner、generator handoff entrypoints、预期缺失文件和禁止项。
   - 同时校验该 spec 与：
     - `notes-remote-apply-app-sdk-target.contract.json`
     - `notes-remote-apply-app-sdk-service.contract.json`
     - 当前 `spring-ai-plus-app-api` controller / SDK / README 事实
     保持一致。
3. `sdkwork-notes-pc-react/package.json`
4. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 已把新 contract 纳入根级 `test:workspace:contracts` 与脚本门禁。

## 风险控制

1. 本轮只冻结 upstream closure handoff contract，不修改兄弟仓库 `spring-ai-plus-app-api`。
2. 本轮不新增 app 侧 handwritten remote apply HTTP client，也不新增 shared-wrapper 占位 runtime。
3. 本轮继续禁止把现有 note direct-write API 伪装成 replay-safe transport。
4. 本轮继续保持：
   - `Step 08 = L2`
   - `CP08-4 / 冲突与失败恢复验证 = L2`

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply上游闭环输入合同冻结 = L3`

## 下一轮入口

1. 若上游仓库进入可改状态，优先按该 spec 在 `spring-ai-plus-app-api` 补齐 `NotesAppApiController.remoteApply`、OpenAPI snapshot / upgrade 输入和 TypeScript SDK regen 产物。
2. 若上游仍不可改或真实能力仍未落地，继续停留在 `Step 08 / CP08-4`，只补 closure-readiness guardrail，不伪造 runtime。
3. 只有上游 controller / OpenAPI / generator 真正闭环后，才允许在 `@sdkwork/notes-core` 落真实 `appNoteSyncService` 并把 bootstrap `apply(request)` 接到该 service。
