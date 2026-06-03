# 10-实施进度-Step08app-sdk远程apply结果适配合同冻结-2026-04-14

## 本轮目标

冻结 future `app-sdk -> shared wrapper -> notes-sync worker` 的结果适配语义，让后续真实 `remoteApply(noteId, body)` 落地时只需实现最薄 adapter，而不会再重新讨论本地 `completed / conflict / failed` 三类结果如何对应。

## 本轮完成

1. 新增 `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-result-adapter.contract.json`
   - 冻结 shared wrapper owner：`@sdkwork/notes-core`
   - 冻结 client accessor：`getAppSdkClientWithSession`
   - 冻结 semantic SDK method：`client.note.remoteApply`
   - 冻结结果映射：
     - `applied -> completed`
     - `conflict -> conflict`
   - 冻结冲突码规则：
     - 透传：`stale-base-version / deleted-remotely / folder-structure-changed`
     - fallback：`unknown`
   - 冻结 transport failure：`throw`
2. 新增 `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs`
   - 把 result adapter spec、target contract、local sync worker 语义三者绑定为一个可执行 guardrail。
3. 更新 `sdkwork-notes-pc-react/package.json`
4. 更新 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 把新 guardrail 纳入 `test:workspace:contracts`。

## 架构结论

- 当前允许被 future semantic response 直接映射的本地结果只剩 `completed` 与 `conflict`。
- transport failure 继续保留为异常边界，交给 worker 现有 unexpected failure 路径落到 `failed / unknown / retryable=true`。
- shared wrapper 不允许在 result adapter 中补 direct-write fallback，否则会破坏 replay-safe contract 的唯一性。

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply结果适配合同冻结 = L3`

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```
