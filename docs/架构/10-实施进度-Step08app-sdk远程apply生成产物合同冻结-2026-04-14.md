# 10-实施进度-Step08app-sdk远程apply生成产物合同冻结-2026-04-14

## 本轮目标

冻结 future `legacy-java-plus-app-api` TypeScript generated SDK 的 remote apply request、result、envelope、types barrel 与 `api/note.ts` 绑定，避免后续上游生成产物落地时再次讨论文件名、export 名与 API method shape。

## 本轮完成

1. 新增 `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-generated-output.contract.json`
   - 冻结 future generated request：
     - `src/types/note-remote-apply-request.ts`
     - `NoteRemoteApplyRequest`
   - 冻结 future generated result：
     - `src/types/note-remote-apply-result-vo.ts`
     - `NoteRemoteApplyResultVO`
   - 冻结 future generated envelope：
     - `src/types/plus-api-result-note-remote-apply-result-vo.ts`
     - `PlusApiResultNoteRemoteApplyResultVO`
   - 冻结 future barrel exports：
     - `src/types/index.ts`
   - 冻结 future API binding：
     - `remoteApply(noteId, body: NoteRemoteApplyRequest): Promise<PlusApiResultNoteRemoteApplyResultVO>`
2. 新增 `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs`
   - 把上述 generated output spec、当前缺失事实、target contract 与 upstream closure contract 绑定为可执行 guardrail。
3. 更新 `sdkwork-notes-pc-react/package.json`
4. 更新 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 把新 generated output contract 纳入 `test:workspace:contracts`。

## 架构结论

- 当前 app 侧已经不再缺“future generated output 命名”，而是缺“上游 controller / OpenAPI / generator 真实产物”。
- 本轮把 future TypeScript generated SDK 的最小 surface 收敛为单一 spec：
  - request type
  - result type
  - `PlusApiResult` envelope
  - `types/index.ts` barrel export
  - `api/note.ts` method binding
- 因此后续真实实现必须先在 `legacy-java-plus-app-api` 闭合生成链，再回到 shared-wrapper；不允许在 app 本地补 alias file 或复用 batchUpdate DTO 假装闭合。

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply生成产物合同冻结 = L3`

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```
