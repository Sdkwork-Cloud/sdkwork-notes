> Migrated from `docs/step/08-主写入路径接入-moveNoteToTrash增量-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 - 主写入路径接入 moveNoteToTrash 增量

- 日期：`2026-04-13`
- 波次：`Wave-C / 第四十三轮推进`
- 检查点：`CP08-3 / 主写入路径接入`
- 本轮增量：`moveNoteToTrash -> sync queue`

## 交付范围

- 仅接入 `notes-notes` 的 `moveNoteToTrash` 主写入路径。
- 在 `moveNoteToTrash` 成功把笔记移入废纸篓并更新工作区状态后，显式追加一条 `note / delete / queued` 同步任务到 `@sdkwork/notes-sync` 队列边界。
- 本轮同步任务时间戳明确优先使用删除事实时间 `deletedAt`，缺失时才回退到 `updatedAt`。
- `createNote` 与 `persistActiveNote` 既有接入继续保留，并复用同一条通用入队 helper。
- 不在本轮提前接入 `restoreNoteFromTrash`、`deleteNotePermanently`、`moveNote` 等其他写路径。
- 不在本轮提前接入后台同步 worker、冲突 UI 或离在线切换 smoke。

## 变更摘要

### 新增

- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
  - 新增 `moveNoteToTrash` 成功后必须落一条 `queued` 删除任务到 queue store 的合同。
  - 明确冻结“任务实体类型 = note、操作类型 = delete、状态 = queued、时间戳 = deletedAt”的语义。

### 修改

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - 将已有的 `note/upsert` 入队逻辑提升为通用 `enqueueNoteSyncTask(noteId, operation, atValue)` helper。
  - `createNote()` 与 `persistActiveNote()` 继续复用该 helper 的 `upsert` 变体。
  - `moveNoteToTrash()` 成功路径新增调用该 helper，把删除动作映射为 `note/delete` 队列任务。

## 兑现结果

- `moveNoteToTrash` 不再只是“远端移入废纸篓成功 + 本地列表切换”，而是已经开始产出可追踪的删除同步任务。
- `createNote + persistActiveNote + moveNoteToTrash` 现在共同构成 `CP08-3` 下三条真实主写入链路，Step 08 一期范围内的删除类场景开始进入队列闭环。
- 删除任务时间戳与本地删除事实对齐，后续 worker / 回放 / 冲突分析可以继续沿用“用户实际删除时间”的事实源。

## 当前状态

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = 进行中`
- `CP08-3 / createNote 增量 = L3`
- `CP08-3 / persistActiveNote 增量 = L3`
- `CP08-3 / moveNoteToTrash 增量 = L3`
- `CP08-4 / 冲突与失败恢复验证 = 未开始`
- `Step 08` 当前整体仍为 `L2`

## 仍缺失项

- `restoreNoteFromTrash`、`deleteNotePermanently`、`moveNote` 等其余主写入路径尚未进入 queue。
- 当前仍是“主写入成功后补队列”的过渡方案，不是最终的“本地事务 + 入队 + 后台同步”完整双层确认模型。
- 冲突提示、失败恢复 UI、离在线切换验证仍未落地，因此 Step 08 不能宣称 `L4`。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

