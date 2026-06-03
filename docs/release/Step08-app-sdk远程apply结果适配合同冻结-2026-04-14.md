# Step08-app-sdk远程apply结果适配合同冻结 - 2026-04-14

## 本轮发布内容

- 新增 `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-result-adapter.contract.json`，冻结 future app-sdk 语义响应到本地 `NotesSyncTaskExecutionResult` 的适配合同。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs`，把 owner、映射语义、冲突码回退规则和 transport failure 约束纳入根级 contract 门禁。
- 更新 `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`，确保该合同进入 `test:workspace:contracts`。

## 风险与限制

- 当前仍不存在真实 generated SDK 方法 `client.note.remoteApply(noteId, body)`。
- 当前仍没有 shared wrapper 的真实 adapter 实现。
- 当前 transport failure 依然只能依靠现有 worker 异常收敛路径处理，本轮不改变运行时策略。

## 验证基线

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply结果适配合同冻结 = L3`

## 下一轮发布入口

- 等上游真实 `remoteApply(noteId, body)` 合同生成后，在 `@sdkwork/notes-core` 落最薄 adapter，并保持 transport failure 继续走 worker 现有失败恢复链。
