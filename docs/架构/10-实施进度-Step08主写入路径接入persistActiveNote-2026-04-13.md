# 10. 实施进度 - Step 08 主写入路径接入 persistActiveNote - 2026-04-13

## 本轮结论

- `CP08-3 / 主写入路径接入` 已从“只有 createNote 接入”的单点状态推进到“createNote + persistActiveNote”双主链状态。
- 当前已完成的最小增量为：`persistActiveNote -> sync queue`。
- `Step 08` 整体仍未闭环，继续保持进行中。

## 本轮新增架构事实

### 1. `notes-notes` 已把高频正文保存链路接入 `notes-sync`

- `persistActiveNote()` 成功后，现在会把已提交草稿映射为一条 `note / upsert / queued` 同步任务。
- 这意味着 `notes-sync` 不再只消费低频的“创建笔记”事件，而是已经开始承接高频正文保存场景。

### 2. 主写入入队逻辑已从单点实现收敛为可复用 helper

- `useNotesWorkspaceStore.ts` 现在通过 `enqueueNoteUpsertSyncTask(noteId, updatedAt)` 统一承接 `note/upsert` 任务入队。
- `createNote()` 与 `persistActiveNote()` 已共用同一条映射逻辑。
- 这为后续 `moveNoteToTrash / restoreNoteFromTrash / deleteNotePermanently` 的逐步接入提供了稳定入口。

### 3. 队列时间戳事实源已明确绑定到本地提交草稿时间

- `persistActiveNote` 的同步任务时间戳明确取自 `requestedActiveNote.updatedAt`。
- 该决策避免使用远端保存响应时间导致本地提交顺序漂移，为后续队列重放、冲突分类和回执比较保留一致事实源。

### 4. 工作区合同主链已覆盖两条真实写路径

- `workspace-sync-write-path.contract.test.mjs` 现已同时覆盖：
  - `createNote -> queued sync task`
  - `persistActiveNote -> queued sync task`
- `CP08-3` 的验证证据已从“首条真实主链”升级为“最小可复用写链集合”。

## 对后续波次的影响

- `moveNoteToTrash` 可以继续沿用当前 helper 模式扩展为删除类 operation 映射。
- `restoreNoteFromTrash` 与 `deleteNotePermanently` 可以在不引入 worker 的前提下，继续先完成主写入 -> queue 的接线闭环。
- `CP08-4` 的 worker / 冲突恢复实现将建立在“高频保存 + 删除恢复类写链都能稳定产出 queue task”的前提上。

## 剩余阻塞

- 删除、恢复、永久删除、移动等其余写路径仍未接入 queue。
- 仍未形成后台消费 queue、执行远端写入、应用回执与冲突分类的执行链。
- UI 侧尚未暴露同步状态、失败提示和冲突恢复入口。
