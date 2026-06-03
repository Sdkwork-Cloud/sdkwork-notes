# Step08-app-sdk远程apply上游闭环输入合同冻结 - 2026-04-14

## 本轮发布内容

- 新增 `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-upstream-closure.contract.json`，冻结 future `spring-ai-plus-app-api / OpenAPI / generator` 的唯一闭环输入路径。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs`，把 app-api controller、OpenAPI snapshot、SDK generator 入口和预期缺失产物纳入根级 contract 门禁。
- 更新 `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`，确保该合同进入 `test:workspace:contracts`。

## 风险与限制

- 当前仍不存在真实 generated SDK 方法 `client.note.remoteApply(noteId, body)`。
- 当前仍不存在 generated `NoteRemoteApplyRequest / NoteRemoteApplyResultVO`。
- 当前仍不能修改兄弟仓库 `spring-ai-plus-app-api`，因此本轮只交付 closure-ready spec，不交付上游实现。

## 验证基线

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply上游闭环输入合同冻结 = L3`

## 下一轮发布入口

- 若上游可改，优先按该 spec 闭合 `NotesAppApiController -> app-openapi-8080.json / upgrade -> sdkwork-app-sdk-typescript`。
- 若上游仍不可改，则继续停留在 `Step 08 / CP08-4`，只补 guardrail，不伪造 runtime。
