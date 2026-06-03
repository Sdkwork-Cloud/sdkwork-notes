# 10-实施进度-Step08app-sdk远程apply目标合同冻结-2026-04-14

## 1. 本轮定位

本轮继续停留在 `Step 08 / CP08-4`。上一轮已经确认“当前 shared app-sdk 与 `NotesAppApiController` 没有 replay-safe remote apply 合同”，因此本轮不再继续堆 caller wiring，而是把 future 上游目标合同冻结为本地可审计 spec。

## 2. 已落地的实现事实

1. 新增本地 target contract：
   - `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-target.contract.json`
2. 新增 Node contract：
   - `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-target-contract.test.mjs`
3. target contract 已冻结以下事实：
   - future semantic SDK method：`client.note.remoteApply(noteId, body)`
   - future controller owner：`NotesAppApiController`
   - future route aliases：
     - `POST /app/v3/api/notes/{noteId}:remoteApply`
     - `POST /app/v3/api/notes/{noteId}/remote-apply`
   - request 继续对齐 `NotesSyncRemoteApplyRequest`
   - response 使用单一 typed body，通过 `outcome = applied | conflict` 区分领域结果
   - transport failure 继续 `throw`
4. 根级 `test:workspace:contracts` 与脚本门禁已纳入该新 contract。

## 3. 这轮为什么是正确增量

1. 当前仓库已经确认没有可被如实消费的上游 semantic contract，继续在 app 本地追加 wiring 不会提升真实性。
2. 直接在本地加 placeholder SDK method 会构成 local SDK fork，违反 app-sdk integration 边界。
3. 用 target contract + guardrail 的方式先冻结 method / route / request / response，可以让后续上游实现与本地 `notes-sync` transport 假设保持一致。

## 4. 这轮刻意不做的事情

1. 不修改 `notes-sync` worker/runtime/bootstrp 真实执行语义。
2. 不在 shared wrapper 添加本地 `remoteApply` placeholder。
3. 不宣称上游 `app-api`、OpenAPI、generator 已完成。
4. 不把当前 direct-write note API 暴露为 replay handler。

## 5. 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 6. 阶段结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply目标合同冻结 = L3`

本轮的真实意义不是“remote apply 已实现”，而是“future 上游实现已经有了明确、机器可校验的目标合同，不再只靠文字描述”。 
