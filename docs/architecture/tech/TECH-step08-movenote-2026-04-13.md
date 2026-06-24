> Migrated from `docs/release/Step08-主写入路径接入-moveNote-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 发布说明 - 主写入路径接入 moveNote - 2026-04-13

## 本轮范围

- Step：`Step 08 / 同步队列与冲突恢复一期`
- 检查点：`CP08-3 / 主写入路径接入`
- 本轮仅覆盖：`moveNote`

## 本轮发布事实

- `notes-notes` 已在 `moveNote` 成功后把父文件夹变更结果写入 `notes-sync` 队列。
- 入队语义继续复用通用 note task helper，为当前 operation 集支持的主写入路径保持统一入口。
- 新增 `workspace-sync-write-path.contract.test.mjs` 的第五条合同，冻结 `moveNote -> note/move/queued` 语义。
- 根级类型检查已重新验证 `notes-notes` 与 `notes-sync` 的现有接线保持可编译。

## 策略切换说明

- 本轮原候选切片是 `deleteNotePermanently`。
- 重新核对后确认该路径对应远端 `permanentlyDelete`，而当前 `notes-sync` 没有独立 `permanent-delete` operation。
- 因此本轮未盲接永久删除，而是先接入当前任务模型已支持的 `moveNote`。

## 不包含内容

- 不包含 `deleteNotePermanently` 语义扩模或接入。
- 不包含后台同步 worker、冲突恢复 UI、离在线切换验证。
- 不包含 Step 08 的候选发布或 go/no-go 判定。

## 当前发布判断

- `CP08-3` 已形成第五条真实主写入证据，但当前仍只是增量切片。
- 当前不具备 `Step 08` 候选发布放行条件。
- 下一轮应先冻结 `deleteNotePermanently` 的同步语义，再决定是否继续留在 `CP08-3`。

