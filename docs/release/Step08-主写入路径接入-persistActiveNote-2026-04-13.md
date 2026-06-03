# Step 08 发布说明 - 主写入路径接入 persistActiveNote - 2026-04-13

## 本轮范围

- Step：`Step 08 / 同步队列与冲突恢复一期`
- 检查点：`CP08-3 / 主写入路径接入`
- 本轮仅覆盖：`persistActiveNote`

## 本轮发布事实

- `notes-notes` 已在 `persistActiveNote` 成功后把提交草稿写入 `notes-sync` 队列。
- 入队语义已与 `createNote` 共用统一 helper，减少后续写路径扩展时的重复实现。
- 新增 `workspace-sync-write-path.contract.test.mjs` 的第二条合同，冻结 `persistActiveNote -> queued sync task` 语义。
- 根级类型检查已重新验证 `notes-notes` 与 `notes-sync` 的现有接线保持可编译。

## 不包含内容

- 不包含 `moveNoteToTrash`、`restoreNoteFromTrash`、`deleteNotePermanently`、`moveNote` 等其他写路径接入。
- 不包含后台同步 worker、冲突恢复 UI、离在线切换验证。
- 不包含 Step 08 的候选发布或 go/no-go 判定。

## 当前发布判断

- `CP08-3` 已形成第二条真实主写入证据，但当前仍只是增量切片。
- 当前不具备 `Step 08` 候选发布放行条件。
- 下一轮应继续留在 `CP08-3`，优先接入 `moveNoteToTrash`。
