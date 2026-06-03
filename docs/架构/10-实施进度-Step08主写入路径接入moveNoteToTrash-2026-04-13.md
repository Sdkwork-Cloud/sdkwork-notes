# 10. 实施进度 - Step 08 主写入路径接入 moveNoteToTrash - 2026-04-13

## 本轮结论

- `CP08-3 / 主写入路径接入` 已从“创建 + 正文保存”双主链状态推进到“创建 + 正文保存 + 删除”三主链状态。
- 当前已完成的最小增量为：`moveNoteToTrash -> sync queue`。
- `Step 08` 整体仍未闭环，继续保持进行中。

## 本轮新增架构事实

### 1. `notes-notes` 已把删除类主写入链路接入 `notes-sync`

- `moveNoteToTrash()` 成功后，现在会把移入废纸篓结果映射为一条 `note / delete / queued` 同步任务。
- 这意味着 `notes-sync` 不再只承接创建与正文保存场景，而是开始进入删除类写链。

### 2. 主写入入队逻辑已从单一 upsert helper 升级为通用 note task helper

- `useNotesWorkspaceStore.ts` 现在通过 `enqueueNoteSyncTask(noteId, operation, atValue)` 统一承接 note 级同步任务入队。
- `createNote()` 与 `persistActiveNote()` 继续走 `upsert`，`moveNoteToTrash()` 新增走 `delete`。
- 这为后续 `restoreNoteFromTrash` 与 `deleteNotePermanently` 的接入提供了统一入口。

### 3. 删除任务时间戳事实源已明确绑定到删除事实时间

- `moveNoteToTrash` 的同步任务时间戳优先取自 `deletedAt`。
- 该决策避免继续使用普通 `updatedAt` 混淆“正文变更”与“删除变更”的事件时间，为后续回放与冲突分类保留更清晰的操作事实。

### 4. 工作区合同主链已覆盖三条真实写路径

- `workspace-sync-write-path.contract.test.mjs` 现已同时覆盖：
  - `createNote -> queued sync task`
  - `persistActiveNote -> queued sync task`
  - `moveNoteToTrash -> queued delete sync task`
- `CP08-3` 的验证证据已从“最小可复用写链集合”进一步升级为“创建 + 更新 + 删除”三类主链集合。

## 对后续波次的影响

- `restoreNoteFromTrash` 可以沿用当前 helper 模式扩展为恢复类 operation 映射。
- `deleteNotePermanently` 可以在不引入 worker 的前提下，继续先完成主写入 -> queue 的接线闭环。
- `CP08-4` 的 worker / 冲突恢复实现将建立在“高频保存 + 删除恢复类写链都能稳定产出 queue task”的前提上。

## 剩余阻塞

- 恢复、永久删除、移动等其余写路径仍未接入 queue。
- 仍未形成后台消费 queue、执行远端写入、应用回执与冲突分类的执行链。
- UI 侧尚未暴露同步状态、失败提示和冲突恢复入口。
