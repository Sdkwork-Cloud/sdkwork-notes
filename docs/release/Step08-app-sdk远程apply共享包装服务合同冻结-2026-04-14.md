# Step08-app-sdk远程apply共享包装服务合同冻结 - 2026-04-14

## 本轮发布内容

- 新增 `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-service.contract.json`，冻结 future `@sdkwork/notes-core` shared-wrapper public service surface。
- 新增 `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-service-contract.test.mjs`，把 service owner、输入输出、SDK 调用形状和禁止项纳入根级 contract 门禁。
- 更新 `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`，确保该合同进入 `test:workspace:contracts`。

## 风险与限制

- 当前仍不存在真实 generated SDK 方法 `client.note.remoteApply(noteId, body)`。
- 当前仍不存在真实 `appNoteSyncService` 实现。
- 当前 transport failure 仍然只能依赖现有 worker 异常收敛路径处理，本轮不改变运行时策略。

## 验证基线

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-service-contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply共享包装服务合同冻结 = L3`

## 下一轮发布入口

- 若上游真实 `note.remoteApply(noteId, body)` 已生成，优先落 `@sdkwork/notes-core` 最薄 service 实现。
- 若上游仍未生成，则继续停留在 `Step 08 / CP08-4`，只补闭合准备度 guardrail，不伪造 runtime。
