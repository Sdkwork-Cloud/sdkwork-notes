> Migrated from `docs/review/step-08-app-sdk远程apply合同缺口审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 app-sdk远程apply合同缺口审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/packages/sdkwork-notes-core/src/sdk/useAppSdkClient.ts`
- `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
- `../../legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/sdk.ts`
- `../../legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/note.ts`
- `../../legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-create-request.ts`
- `../../legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-update-request.ts`
- `../../legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-content-update-request.ts`
- `../../legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-move-request.ts`
- `../../legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-batch-update-request.ts`
- `../../legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-batch-operation-request.ts`
- `../../legacy-java-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-batch-update-result-vo.ts`
- `../../legacy-java-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/notes/NotesAppApiController.java`
- `../../legacy-java-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/notes/README.md`

## 审计结论

- 本轮没有发现 app 内部 caller wiring 的新 P0 / P1 缺陷，但确认了一个明确阻塞：当前 shared app-sdk 与 `NotesAppApiController` 仍不存在 replay-safe remote apply 合同。
- `shell / desktop -> bootstrap -> apply(request)` 的顶层注入路径已经真实存在，但当前仓库还没有可以被如实接线的上游语义接口。
- 当前 note direct-write API 与 `batchUpdate` 必须继续禁止作为 replay handler 使用，否则会把“远端成功后的同步影子任务”错误伪装成“可安全重放的远端写指令”。

## 已确认成立的约束

1. app 侧远端能力路径仍必须保持为 `feature / store / service -> shared app-sdk wrapper -> @sdkwork/app-sdk -> legacy-java-plus-app-api`。
2. 当前 generated note surface 只有 direct-write 或正文 versioning 能力：
   - `createNote`
   - `updateNote`
   - `updateNoteContent`
   - `move`
   - `restore`
   - `archive`
   - `deleteNote`
   - `permanentlyDelete`
   - `clearTrash`
   - `batchUpdate`
3. 当前 note request 合同仍缺少 replay-safe transport 必需字段：
   - `idempotencyKey`
   - `localRevision`
   - `baseRemoteCursor`
   - `mutation`
4. 当前 note result 合同仍缺少 ack 后游标字段 `remoteCursor`。
5. `NotesAppApiController` 当前仍把 `batchUpdate` 路径落到 `textBatchOperationService.applyBatch(...)`，README 也只把它定义为 `expectedVersionId` 驱动的正文版本控制，不是同步 transport。
6. 因为上游合同未闭合，当前已接入 note 队列任务必须继续维持 `replayable: false`，默认 caller 也必须继续不注入真实 `apply(request)`。

## 残余风险

- 若后续有人直接把当前 `createNote / updateNote / updateNoteContent / move / restore / deleteNote / batchUpdate` 接到 worker replay，会制造重复远端写入与错误幂等语义。
- 当前仍没有真实 ack apply / `remoteCursor` 合并闭环，也没有冲突恢复 UI 与离在线切换 smoke。
- 上游合同闭环涉及 `legacy-java-plus-app-api`、OpenAPI 3.x 与 SDK 生成链；在本仓库内部继续堆 caller wiring 已经没有真实性收益。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

1. 下一轮先在 `legacy-java-plus-app-api` / backend / OpenAPI generator 闭合语义化 replay-safe 方法，再生成新的 app-sdk surface。
2. 新合同至少要显式覆盖：
   - `idempotencyKey`
   - `localRevision`
   - `baseRemoteCursor`
   - `mutation`
   - ack 后的 `remoteCursor`
3. 只有上游合同生成完成后，才允许把 shared wrapper 与当前 bootstrap `apply(request)` 注入路径真正接通。

