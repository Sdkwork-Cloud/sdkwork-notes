> Migrated from `docs/step/08-主写入路径接入-persistActiveNote增量-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 - 主写入路径接入 persistActiveNote 增量

- 日期：`2026-04-13`
- 波次：`Wave-C / 第四十二轮推进`
- 检查点：`CP08-3 / 主写入路径接入`
- 本轮增量：`persistActiveNote -> sync queue`

## 交付范围

- 仅接入 `notes-notes` 的 `persistActiveNote` 主写入路径。
- 在 `persistActiveNote` 成功保存活动草稿并更新工作区状态后，显式追加一条 `note / upsert / queued` 同步任务到 `@sdkwork/notes-sync` 队列边界。
- 本轮同步任务时间戳明确使用本地提交草稿的 `requestedActiveNote.updatedAt`，而不是远端保存响应时间。
- `createNote` 既有接入继续保留，并抽取为可复用 helper，供后续其他写路径复用。
- 不在本轮提前接入 `moveNoteToTrash`、`restoreNoteFromTrash`、`deleteNotePermanently`、`moveNote` 等其他写路径。
- 不在本轮提前接入后台同步 worker、冲突 UI 或离在线切换 smoke。

## 变更摘要

### 新增

- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
  - 新增 `persistActiveNote` 成功后必须落一条 `queued` 同步任务到 queue store 的合同。
  - 明确冻结“任务实体类型 = note、操作类型 = upsert、状态 = queued、时间戳 = 本地提交草稿 updatedAt”的语义。

### 修改

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - 将已有的入队逻辑收敛为可复用的 `enqueueNoteUpsertSyncTask(noteId, updatedAt)` helper。
  - `createNote()` 继续复用该 helper。
  - `persistActiveNote()` 成功路径新增调用该 helper，把已提交草稿映射为 `note/upsert` 队列任务。

## 兑现结果

- `persistActiveNote` 不再只是“远端保存成功 + 本地保存状态回写”，而是已经开始产出可追踪的同步任务。
- `createNote + persistActiveNote` 现在共同构成 `CP08-3` 下两条真实主写入链路，队列接入不再只覆盖低频创建场景。
- 同步任务时间戳与本地提交草稿时间对齐，后续 worker / 回放 / 冲突分析可以继续沿用“用户实际提交顺序”的事实源。

## 当前状态

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = 进行中`
- `CP08-3 / createNote 增量 = L3`
- `CP08-3 / persistActiveNote 增量 = L3`
- `CP08-4 / 冲突与失败恢复验证 = 未开始`
- `Step 08` 当前整体仍为 `L2`

## 仍缺失项

- `moveNoteToTrash`、`restoreNoteFromTrash`、`deleteNotePermanently`、`moveNote` 等其余主写入路径尚未进入 queue。
- 当前仍是“主写入成功后补队列”的过渡方案，不是最终的“本地事务 + 入队 + 后台同步”完整双层确认模型。
- 冲突提示、失败恢复 UI、离在线切换验证仍未落地，因此 Step 08 不能宣称 `L4`。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

