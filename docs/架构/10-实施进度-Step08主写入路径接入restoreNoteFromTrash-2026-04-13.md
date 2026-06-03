# 10. 实施进度 - Step 08 主写入路径接入 restoreNoteFromTrash - 2026-04-13

## 本轮结论

- `CP08-3 / 主写入路径接入` 已从“创建 + 正文保存 + 删除”三主链状态推进到“创建 + 正文保存 + 删除 + 恢复”四主链状态。
- 当前已完成的最小增量为：`restoreNoteFromTrash -> sync queue`。
- `Step 08` 整体仍未闭环，继续保持进行中。

## 本轮新增架构事实

### 1. `notes-notes` 已把恢复类主写入链路接入 `notes-sync`

- `restoreNoteFromTrash()` 成功后，现在会把恢复结果映射为一条 `note / restore / queued` 同步任务。
- 这意味着 `notes-sync` 不再只承接创建、保存与删除场景，而是已经开始进入恢复类写链。

### 2. note 级通用入队 helper 继续承接新增 operation

- `useNotesWorkspaceStore.ts` 继续通过 `enqueueNoteSyncTask(noteId, operation, atValue)` 统一承接 note 级同步任务入队。
- `createNote()` / `persistActiveNote()` 走 `upsert`，`moveNoteToTrash()` 走 `delete`，`restoreNoteFromTrash()` 新增走 `restore`。
- 这为后续 `deleteNotePermanently` 与 `moveNote` 的接入提供了统一入口。

### 3. 恢复任务时间戳事实源已明确绑定到恢复结果时间

- `restoreNoteFromTrash` 的同步任务时间戳取自 `updatedAt`。
- 该决策确保恢复事件在队列中的排序与远端恢复结果语义一致，为后续回放与冲突分类保留清晰恢复事实。

### 4. 工作区合同主链已覆盖四条真实写路径

- `workspace-sync-write-path.contract.test.mjs` 现已同时覆盖：
  - `createNote -> queued sync task`
  - `persistActiveNote -> queued sync task`
  - `moveNoteToTrash -> queued delete sync task`
  - `restoreNoteFromTrash -> queued restore sync task`
- `CP08-3` 的验证证据已从“创建 + 更新 + 删除”三类主链集合进一步升级为“创建 + 更新 + 删除 + 恢复”四类主链集合。

## 对后续波次的影响

- `deleteNotePermanently` 可以沿用当前 helper 模式扩展为永久删除类 operation 映射。
- `moveNote` 可以在不引入 worker 的前提下，继续先完成主写入 -> queue 的接线闭环。
- `CP08-4` 的 worker / 冲突恢复实现将建立在“高频保存 + 删除恢复类写链都能稳定产出 queue task”的前提上。

## 剩余阻塞

- 永久删除、移动等其余写路径仍未接入 queue。
- 仍未形成后台消费 queue、执行远端写入、应用回执与冲突分类的执行链。
- UI 侧尚未暴露同步状态、失败提示和冲突恢复入口。
