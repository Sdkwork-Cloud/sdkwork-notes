# Step 08 / app-sdk远程apply合同缺口审计 - 2026-04-14

## 本轮目标

在 `shell / desktop -> bootstrap -> apply(request)` 顶层注入路径已经存在的前提下，确认 shared wrapper -> `@sdkwork/app-sdk` -> `spring-ai-plus-app-api` 是否已经具备可被真实消费的 replay-safe remote apply 合同，避免把现有 direct-write note API 误接成 worker replay handler。

## 实际完成

1. `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-contract.test.mjs`
   - 审计 shared wrapper、generated SDK note surface、request/result DTO 与 `NotesAppApiController` 当前事实。
   - 明确拒绝把不存在的 `remoteApply / syncApply / applyMutation / replayMutation` 一类语义入口描述为“已存在”。
2. `sdkwork-notes-pc-react/package.json`
3. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 已把 `workspace-sync-app-sdk-contract.test.mjs` 纳入 `test:workspace:contracts` 与根级脚本门禁。
4. 已确认当前上游合同状态：
   - note SDK 仍只有 direct-write / text versioning 接口。
   - note DTO 仍缺 `idempotencyKey / localRevision / baseRemoteCursor / mutation`。
   - note result 仍缺 ack `remoteCursor`。
   - `NotesAppApiController.batchUpdate` 仍是正文版本控制，不是 replay-safe sync transport。

## 风险控制

1. 本轮没有把当前 `createNote / updateNote / updateNoteContent / move / restore / deleteNote / batchUpdate` 这类 direct-write API 接成 replay handler。
2. 本轮没有宣称真实 `apply(request)` 已在 app 本地完成接线。
3. 本轮没有把 `Step 08` 或 `CP08-4 / 冲突与失败恢复验证` 向上升级；当前结论仍保持保守。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply合同缺口审计 = L3`

## 下一轮入口

1. 先在 `spring-ai-plus-app-api` / backend / OpenAPI generator 闭合真实 replay-safe 合同。
2. 生成语义化 app-sdk 方法后，再把 shared wrapper 与 bootstrap `apply(request)` 接到真实 transport。
3. 在那之前，继续禁止把当前 note direct-write API 当作 replay handler。
