> Migrated from `docs/release/Step08-主写入路径接入-moveNoteToTrash-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 发布说明 - 主写入路径接入 moveNoteToTrash - 2026-04-13

## 本轮范围

- Step：`Step 08 / 同步队列与冲突恢复一期`
- 检查点：`CP08-3 / 主写入路径接入`
- 本轮仅覆盖：`moveNoteToTrash`

## 本轮发布事实

- `notes-notes` 已在 `moveNoteToTrash` 成功后把移入废纸篓结果写入 `notes-sync` 队列。
- 入队语义已从单一 `upsert` helper 收敛为通用 note task helper，为后续 `restore` / `delete` 写路径继续接线提供统一入口。
- 新增 `workspace-sync-write-path.contract.test.mjs` 的第三条合同，冻结 `moveNoteToTrash -> note/delete/queued` 语义。
- 根级类型检查已重新验证 `notes-notes` 与 `notes-sync` 的现有接线保持可编译。

## 不包含内容

- 不包含 `restoreNoteFromTrash`、`deleteNotePermanently`、`moveNote` 等其他写路径接入。
- 不包含后台同步 worker、冲突恢复 UI、离在线切换验证。
- 不包含 Step 08 的候选发布或 go/no-go 判定。

## 当前发布判断

- `CP08-3` 已形成第三条真实主写入证据，但当前仍只是增量切片。
- 当前不具备 `Step 08` 候选发布放行条件。
- 下一轮应继续留在 `CP08-3`，优先接入 `restoreNoteFromTrash`。

