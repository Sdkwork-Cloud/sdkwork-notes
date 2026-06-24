> Migrated from `docs/架构/10-实施进度-Step08app-sdk远程apply上游闭环输入合同冻结-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度-Step08app-sdk远程apply上游闭环输入合同冻结-2026-04-14

## 本轮目标

冻结 future `legacy-java-plus-app-api / OpenAPI / generator` 的真实闭环输入，避免后续上游实现时再次讨论 controller 入口、snapshot / upgrade 入口和 TypeScript SDK 产物路径。

## 本轮完成

1. 新增 `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-upstream-closure.contract.json`
   - 冻结 app-api repo 与 controller 入口：
     - `legacy-java-plus-app-api`
     - `src/main/java/com/sdkwork/ai/gateway/api/app/v3/notes/NotesAppApiController.java`
   - 冻结 OpenAPI / generator 入口：
     - `sdkwork-sdk-app/README.md`
     - `sdkwork-sdk-app/app-openapi-8080.json`
     - `sdkwork-sdk-app/upgrade`
     - `sdkwork-sdk-app/bin/prepare-openapi-source.mjs`
     - `sdkwork-sdk-app/sdkwork-app-sdk-typescript`
   - 冻结 future generated outputs：
     - `src/sdk.ts`
     - `src/api/note.ts`
     - `src/types/note-remote-apply-request.ts`
     - `src/types/note-remote-apply-result-vo.ts`
2. 新增 `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs`
   - 把上述 handoff entrypoints、当前缺失事实和禁止项绑定为可执行 guardrail。
3. 更新 `sdkwork-notes-pc-react/package.json`
4. 更新 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 把新 upstream closure contract 纳入 `test:workspace:contracts`。

## 架构结论

- 当前 app 侧远端同步链已经不再缺“本地 contract 命名”，而是缺“上游 controller / OpenAPI / generator 真实产物”。
- 本轮把这一缺口继续收敛为单一 closure path：
  - `NotesAppApiController`
  - `app-openapi-8080.json / upgrade`
  - `prepare-openapi-source.mjs`
  - `sdkwork-app-sdk-typescript`
- 因此后续真实实现必须先补上游，再回到 app 侧 shared-wrapper；不允许反向从 app 本地手写 HTTP 绕过 generator。

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply上游闭环输入合同冻结 = L3`

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

