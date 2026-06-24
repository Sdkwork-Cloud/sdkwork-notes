> Migrated from `docs/release/Step08-同步任务回放安全边界-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step08-同步任务回放安全边界 - 2026-04-14

## 发布摘要

- `NotesSyncTask` 现在已显式区分 `replayable` 与 `non-replayable`。
- 当前 `direct-write` note 主写入路径产生的 queue task 统一标记为 `replayable: false`。
- worker 不再假装可以自动回放这些不安全任务，而是以 `replay-disabled` 终态失败收敛。

## 风险控制

- 本轮没有把当前 App SDK note 写接口伪装成 replay handler。
- legacy queue 中缺失 `replayable` 的任务会统一回填为 `false`，避免旧快照被误回放。
- 不可回放任务在持久化 `running` 后直接终态失败，避免重复远端写入。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-state-machine.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-queue.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-worker.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-worker-runtime.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 发布结论

- `Step 08` 继续维持 `L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 同步任务回放安全边界 = L3`

下一轮仍需停留在 `CP08-4`，先定义 replay-safe transport / idempotency 边界，或把上游写链改造为真正的 `local-submit -> queue -> remote apply`。

