> Migrated from `docs/step/08-app-sdk远程apply生成产物合同冻结-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 / CP08-4 / app-sdk远程apply生成产物合同冻结 - 2026-04-14

## 本轮结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply生成产物合同冻结 = L3`

## 本轮完成

- 新增 `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-generated-output.contract.json`，冻结 future TypeScript app-sdk generated output 的 request、result、envelope、barrel export 与 API binding 形状。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs`，把 generated output spec、target contract、upstream closure contract 与当前 app-api SDK 事实绑定为根级 contract。
- 更新 `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`，确保该测试进入 `test:workspace:contracts`。

## 冻结范围

- future request type file / export：
  - `sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-remote-apply-request.ts`
  - `NoteRemoteApplyRequest`
- future result type file / export：
  - `sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-remote-apply-result-vo.ts`
  - `NoteRemoteApplyResultVO`
- future PlusApiResult envelope file / export：
  - `sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/plus-api-result-note-remote-apply-result-vo.ts`
  - `PlusApiResultNoteRemoteApplyResultVO`
- future barrel exports：
  - `sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/index.ts`
- future API binding：
  - `client.note.remoteApply(noteId, body: NoteRemoteApplyRequest): Promise<PlusApiResultNoteRemoteApplyResultVO>`

## 风险与限制

- 当前上游 generated SDK 仍不存在上述 request / result / envelope 文件。
- 当前 `api/note.ts` 与 `types/index.ts` 仍不存在 `remoteApply` 相关导出，因此本轮仍是 closure-ready guardrail，而不是产物落地。
- 当前明确禁止把 `note-batch-update-request.ts`、`note-batch-update-result-vo.ts` 直接复用为 future remote apply 生成产物。

## 验证基线

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 下一轮入口

- 若上游可改，优先在 `legacy-java-plus-app-api` 闭合 `remoteApply` controller / OpenAPI / generator，然后验证生成产物是否满足该 spec。
- 若上游仍不可改，则继续停留在 `Step 08 / CP08-4`，只补 guardrail，不把当前 direct-write 产物伪装成 remote apply generated output。

