> Migrated from `docs/step/08-同步任务回放安全边界-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 08-同步任务回放安全边界

- 日期：`2026-04-14`
- 归属 Step：`Step 08 / CP08-4`
- 本轮范围：`notes-sync replay 安全边界显式化`

## 1. 目标

本轮不伪造真实远端 replay handler，也不把当前 App SDK note 写接口直接接到 worker。当前主写入链路仍然是 `direct-write`，同步队列里的任务只是“远端成功后的同步影子”；如果直接自动回放，会重复写远端。

因此本轮只做一件事：把“哪些任务可自动回放、哪些任务绝对不能自动回放”的边界写进任务合同、worker 语义和主写入路径。

## 2. 本轮完成

### 2.1 `@sdkwork/notes-sync`

- `NotesSyncTask` 新增 `replayable: boolean`。
- `CreateNotesSyncTaskInput` 新增 `replayable?: boolean`，缺省值统一收敛为 `false`。
- `NotesSyncTaskFailureCode` 新增 `replay-disabled`。
- 队列读取时会为缺失 `replayable` 的 legacy task 回填 `false`，避免旧快照被误当成可安全回放任务。
- `executeNextNotesSyncTask()` 现在会：
  - 仍然先把目标任务持久化为 `running`；
  - 仅对 `replayable: true` 的任务调用 `execute(task)`；
  - 对 `replayable: false` 的 queued task 直接终态回写 `failed`，并写入 `lastFailure.code = 'replay-disabled'`。

### 2.2 `@sdkwork/notes-notes`

- 当前所有已接入的 note 主写入路径都显式写入 `replayable: false`：
  - `createNote`
  - `persistActiveNote`
  - `toggleFavorite`
  - `moveNoteToTrash`
  - `restoreNoteFromTrash`
  - `moveNote`
  - `deleteNotePermanently`
  - `clearTrash`

这等价于把当前现实冻结下来：现在的 queue task 仍然是“写后镜像元数据”，不是“可安全重放的远端写指令”。

### 2.3 Node contract 对齐

- `workspace-sync-state-machine.contract.test.mjs`
- `workspace-sync-queue.contract.test.mjs`
- `workspace-sync-write-path.contract.test.mjs`
- `workspace-sync-worker.contract.test.mjs`
- `workspace-sync-worker-runtime.contract.test.mjs`
- `workspace-sync-runtime-boundary.contract.test.mjs`
- `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.test.ts`

以上测试已同步验证：

1. 新任务合同会显式携带 `replayable`。
2. legacy 队列会把缺失字段回填为 `false`。
3. worker 不会执行不可回放任务。
4. 不可回放任务会稳定终态失败为 `replay-disabled`。

## 3. 为什么这轮只算 L3

这轮解决的是“误回放保护”，不是“真实远端回放闭环”。

当前仍然缺：

1. replay-safe transport / idempotency 边界。
2. 真正的 remote ack apply / `remoteCursor` 合并闭环。
3. app/bootstrap 或 desktop/background 的默认 runtime 实例化。
4. conflict/manual recovery UI。

因此结论必须保持保守：

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 同步任务回放安全边界 = L3`

## 4. 验证

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

## 5. 下一轮入口

下一轮仍然必须停留在 `Step 08 / CP08-4`，且不能直接把当前 App SDK note 写接口接成 replay handler。

安全的下一步只有两类：

1. 先定义 replay-safe transport / idempotency 边界，再让 worker 真正向远端 apply。
2. 先把上游写语义从 `direct-write` 演进为真正的 `local-submit -> queue -> remote apply`。

