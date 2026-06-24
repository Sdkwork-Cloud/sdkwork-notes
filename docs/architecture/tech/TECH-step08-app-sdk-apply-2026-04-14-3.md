> Migrated from `docs/release/Step08-app-sdk远程apply生成产物合同冻结-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step08-app-sdk远程apply生成产物合同冻结 - 2026-04-14

## 本轮发布内容

- 新增 `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-generated-output.contract.json`，冻结 future TypeScript app-sdk generated request、result、envelope、barrel export 与 API binding。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs`，把 generated output spec、target contract、upstream closure contract 与当前上游缺失事实纳入根级 contract 门禁。
- 更新 `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`，确保该合同进入 `test:workspace:contracts`。

## 风险与限制

- 当前仍不存在真实 generated `NoteRemoteApplyRequest / NoteRemoteApplyResultVO / PlusApiResultNoteRemoteApplyResultVO`。
- 当前 `api/note.ts` 仍不存在 `remoteApply(noteId, body)` 方法签名。
- 当前不能修改兄弟仓库 `legacy-java-plus-app-api`，因此本轮只交付 generated-output closure-ready spec，不交付上游产物。

## 验证基线

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply生成产物合同冻结 = L3`

## 下一轮发布入口

- 若上游可改，优先按该 spec 验证 `legacy-java-plus-app-api` 的 OpenAPI / generator 产物是否真实生成 request、result、envelope 与 barrel export。
- 若上游仍不可改，则继续停留在 `Step 08 / CP08-4`，只补 guardrail，不伪造 generated output。

