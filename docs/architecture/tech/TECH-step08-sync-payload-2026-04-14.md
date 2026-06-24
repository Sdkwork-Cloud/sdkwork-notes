> Migrated from `docs/release/Step08-同步任务payload冻结-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step08 同步任务 payload 冻结 - 2026-04-14

## 发布摘要

- 本轮为 `Step 08 / CP08-4` 增加了显式同步任务 payload 合同。
- `NotesSyncTask` 现在具备 `mutation`，同步队列 schema 升级到 `2`。
- note 主写入路径已经全部把显式 payload 写入 queue snapshot。

## 风险控制

- 本轮没有引入默认 replay handler。
- schema 1 队列会被清空，但在当前 direct-write 模式下不会丢失真实用户写入。
- 当前版本依然不能把现有 App SDK note 写接口直接作为 replay handler。

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
- `CP08-4 / 同步任务 payload 冻结 = L3`
- 下一轮仍需继续停留在 `CP08-4`

