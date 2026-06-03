# Step 08 / app-sdk远程apply结果适配合同冻结 - 2026-04-14

## 本轮目标

在上一轮已经冻结 future `remoteApply(noteId, body)` target contract 的基础上，继续冻结“future app-sdk 语义响应如何适配回本地 `NotesSyncTaskExecutionResult`”这一层合同，避免后续 shared wrapper 接线时对成功、冲突和传输失败三类结果产生漂移。

## 实际完成

1. `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-result-adapter.contract.json`
   - 新增本地 result adapter contract spec。
   - 冻结 shared wrapper owner：
     - `@sdkwork/notes-core`
     - `getAppSdkClientWithSession`
     - `client.note.remoteApply`
   - 冻结 semantic response 到本地结果的最小映射：
     - `applied -> completed`
     - `conflict -> conflict`
   - 冻结 conflict code 规则：
     - 透传：`stale-base-version / deleted-remotely / folder-structure-changed`
     - 回退：`unknown`
   - 冻结 transport failure 继续 `throw`，交给 worker 现有 `failed / unknown / retryable=true` 路径收敛。
2. `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs`
   - 新增 Node contract，锁定 result adapter spec 的 owner、输入来源、结果映射和 transport failure 约束。
   - 同时校验该 spec 与：
     - `notes-remote-apply-app-sdk-target.contract.json`
     - `NotesSyncTaskExecutionResult`
     - 本地 conflict / failure 语义
     保持一致。
3. `sdkwork-notes-pc-react/package.json`
4. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 已把新 contract 纳入根级 `test:workspace:contracts` 与脚本门禁。

## 风险控制

1. 本轮只冻结 result adapter contract，不添加任何本地 placeholder SDK method。
2. 本轮不改变 `notes-sync` worker / runtime / bootstrap 的真实执行行为。
3. 本轮不宣称 shared wrapper 已经具备真实 `remoteApply` adapter。
4. 本轮继续禁止把现有 note direct-write API 伪装成 replay-safe remote apply handler。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply结果适配合同冻结 = L3`

## 下一轮入口

1. 若上游真实 `note.remoteApply(noteId, body)` 已生成，优先在 `@sdkwork/notes-core` 增加最薄 result adapter。
2. 若上游真实方法仍未生成，继续停留在 `Step 08 / CP08-4`，只补“闭合准备度”相关 guardrail，不伪造 runtime 能力。
3. 只有 shared wrapper 真实 adapter 落地后，才允许把 bootstrap `apply(request)` 接到 generated SDK method。
