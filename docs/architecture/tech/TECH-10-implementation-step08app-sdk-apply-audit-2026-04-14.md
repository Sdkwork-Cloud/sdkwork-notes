> Migrated from `docs/架构/10-实施进度-Step08app-sdk远程apply合同缺口审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度-Step08app-sdk远程apply合同缺口审计-2026-04-14

## 1. 本轮定位

本轮继续停留在 `Step 08 / CP08-4`，没有提前进入 `Step 09`。目标不是继续在 app 内部堆 caller wiring，而是确认 shared wrapper -> `@sdkwork/app-sdk` -> `legacy-java-plus-app-api` 这条远端能力链是否已经具备可被真实消费的 replay-safe remote apply 合同。

## 2. 已落地的审计事实

1. `workspace-sync-app-sdk-contract.test.mjs` 已新增并纳入根级 `test:workspace:contracts`。
2. 当前 generated note SDK surface 仍只有 direct-write / text versioning 方法：
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
3. 当前 note request DTO 仍缺少：
   - `idempotencyKey`
   - `localRevision`
   - `baseRemoteCursor`
   - `mutation`
4. 当前 note result DTO 仍缺少 ack `remoteCursor`。
5. `NotesAppApiController` 当前仍把 `batchUpdate` 路径落到 `textBatchOperationService.applyBatch(...)`，README 也只把它定义为正文 versioning，不是 replay-safe sync transport。

## 3. 这轮为什么不能继续往下接真实 caller

1. 顶层 `apply(request)` 注入路径虽然已经存在，但当前仓库没有可被如实消费的上游语义合同。
2. 若直接复用现有 note direct-write API，会把“远端成功后的同步影子任务”误接成“可安全重放的远端写指令”，破坏 replay / 幂等语义。
3. 因此下一步必须是上游合同闭环，而不是 app 本地 workaround：
   - `legacy-java-plus-app-api`
   - backend capability
   - OpenAPI 3.x
   - SDK regeneration

## 4. 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 5. 阶段结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply合同缺口审计 = L3`

本轮的真实意义不是“app 已拿到远端 replay”，而是“已经用 contract guardrail 证明：当前真实阻塞在上游合同，不能再用 direct-write note API 假装补齐”。

