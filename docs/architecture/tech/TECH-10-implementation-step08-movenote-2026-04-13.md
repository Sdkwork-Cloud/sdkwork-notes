> Migrated from `docs/架构/10-实施进度-Step08主写入路径接入moveNote-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10. 实施进度 - Step 08 主写入路径接入 moveNote - 2026-04-13

## 本轮结论

- `CP08-3 / 主写入路径接入` 已从“创建 + 正文保存 + 删除 + 恢复”四主链状态推进到“创建 + 正文保存 + 删除 + 恢复 + 移动”五主链状态。
- 当前已完成的最小增量为：`moveNote -> sync queue`。
- `Step 08` 整体仍未闭环，继续保持进行中。

## 本轮新增架构事实

### 1. `notes-notes` 已把 note 元数据移动链路接入 `notes-sync`

- `moveNote()` 成功后，现在会把父文件夹变更结果映射为一条 `note / move / queued` 同步任务。
- 这意味着 `notes-sync` 不再只承接创建、保存、删除和恢复场景，而是已经开始进入关键元数据变更场景。

### 2. note 级通用入队 helper 已覆盖四类 operation

- `useNotesWorkspaceStore.ts` 继续通过 `enqueueNoteSyncTask(noteId, operation, atValue)` 统一承接 note 级同步任务入队。
- 当前已覆盖：
  - `upsert`
  - `delete`
  - `restore`
  - `move`

### 3. 主写入策略发生了一次显式切换

- 重新核对 `deleteNotePermanently` 后确认：远端语义是 `permanentlyDelete`，但当前 `notes-sync` operation 集没有独立 `permanent-delete`。
- 为避免把“移入废纸篓”和“永久删除”混成同一事实类型，本轮没有继续盲接 `deleteNotePermanently`，而是先接入当前模型已经支持的 `moveNote`。
- 这使“永久删除语义是否要扩模”被显式暴露为一个架构决策点，而不是隐性混入实现。

### 4. 工作区合同主链已覆盖五条真实写路径

- `workspace-sync-write-path.contract.test.mjs` 现已同时覆盖：
  - `createNote -> queued sync task`
  - `persistActiveNote -> queued sync task`
  - `moveNoteToTrash -> queued delete sync task`
  - `restoreNoteFromTrash -> queued restore sync task`
  - `moveNote -> queued move sync task`
- `CP08-3` 的验证证据已从“创建 + 更新 + 删除 + 恢复”四类主链集合进一步升级为“五类主链集合”。

## 对后续波次的影响

- `deleteNotePermanently` 不应在没有语义决策的前提下直接复用当前 `delete` operation。
- 下一步要么扩展 `notes-sync` task model，要么将永久删除明确沉淀为后续 backlog，再进入 `CP08-4`。
- `CP08-4` 的 worker / 冲突恢复实现将建立在“当前 operation 集支持的主写入链都能稳定产出 queue task”的前提上。

## 剩余阻塞

- `deleteNotePermanently` 的同步语义尚未冻结。
- 仍未形成后台消费 queue、执行远端写入、应用回执与冲突分类的执行链。
- UI 侧尚未暴露同步状态、失败提示和冲突恢复入口。

