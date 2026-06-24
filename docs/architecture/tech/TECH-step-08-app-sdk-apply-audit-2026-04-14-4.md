> Migrated from `docs/review/step-08-app-sdk远程apply生成产物合同冻结审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 app-sdk远程apply生成产物合同冻结审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-generated-output.contract.json`
- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-target.contract.json`
- `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-upstream-closure.contract.json`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs`
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
- `legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/note.ts`
- `legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/index.ts`
- `legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-batch-update-request.ts`
- `legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-batch-update-result-vo.ts`
- `legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/plus-api-result-note-batch-update-result-vo.ts`

## 审计结论

- 本轮没有发现新的 P0 / P1 缺陷。
- 在“当前 generated SDK 尚未产出 real remote apply request / result / envelope 文件”的事实下，先冻结 generated output contract 是正确增量，因为它把 future generator 产物从口头预期提升为可执行 spec。
- 当前冻结的最小 generated output surface 为：
  - request：`NoteRemoteApplyRequest`
  - result：`NoteRemoteApplyResultVO`
  - envelope：`PlusApiResultNoteRemoteApplyResultVO`
  - barrel：`src/types/index.ts`
  - API binding：`client.note.remoteApply(noteId, body)`

## 已确认成立的约束

1. future generated request 字段必须继续对齐 target contract：
   - `idempotencyKey`
   - `taskId`
   - `entityType`
   - `entityId`
   - `operation`
   - `mutation`
   - `localRevision`
   - `baseRemoteCursor`
2. future generated response 仍必须继续对齐 typed outcome 语义：
   - `applied -> taskId / remoteCursor / appliedAt`
   - `conflict -> taskId / remoteCursor / conflict.code / conflict.message / conflict.occurredAt`
3. future generated SDK 必须继续提供独立 envelope file / export，不能省略 `PlusApiResult...` 包装层。
4. 当前 upstream generated SDK 中，`api/note.ts` 与 `types/index.ts` 仍不存在 `NoteRemoteApplyRequest / NoteRemoteApplyResultVO / PlusApiResultNoteRemoteApplyResultVO`。
5. 当前不得把 `note-batch-update-request.ts`、`note-batch-update-result-vo.ts`、`plus-api-result-note-batch-update-result-vo.ts` 误标为 remote apply 产物。

## 残余风险

- 当前 spec 只冻结了 future generated output，不代表上游 generator 已开始产出这些文件。
- 当前 barrel export 的命名与 envelope file 名称已被冻结，后续上游若已有不同 generator naming policy，仍需要显式对齐或调整 spec。
- 当前 shared-wrapper service 仍不能进入真实实现阶段，因为 generated output 本身还不存在。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

1. 上游真实生成 `remoteApply` 之前，继续保持 `Step 08 / CP08-4 = L2`，不得提前声称 shared-wrapper 或 runtime 已闭环。
2. 上游进入可改状态后，优先检查 generator 命名、types barrel 和 `PlusApiResult` envelope 是否满足该 spec，再开始 shared-wrapper 实现。
3. 若上游选择不同 generated file naming policy，必须先回写 contract，而不是在 app 侧写临时 alias 掩盖偏差。

