# Step08-工作区remote-apply装配边界 - 2026-04-14

## 发布摘要

- `notes-notes` 的 workspace sync runtime 现在可直接消费 `apply(request)`。
- `bootstrapNotesWorkspaceStore(...)` 现在支持显式 `apply(request)` 注入。
- 当前默认 app shell 仍未自动注入真实 transport，因此本轮交付的是装配边界，不是完整远端同步。

## 风险控制

- 仍未接真实 App SDK / HTTP handler。
- 当前已接入 note 任务仍然是 `replayable: false` 的 `direct-write` 影子任务。
- 默认 bootstrap 不会自动制造伪同步。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
pnpm.cmd typecheck
```

## 发布结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 工作区remote-apply装配边界 = L3`

下一轮仍需停留在 `CP08-4`，把这条工作区装配边界接到真实 replay-safe transport / ack apply 实现上。
