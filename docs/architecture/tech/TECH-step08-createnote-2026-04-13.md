> Migrated from `docs/release/Step08-主写入路径接入-createNote-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 发布说明 - 主写入路径接入 createNote - 2026-04-13

## 本轮范围

- Step：`Step 08 / 同步队列与冲突恢复一期`
- 检查点：`CP08-3 / 主写入路径接入`
- 本轮仅覆盖：`createNote`

## 本轮发布事实

- `notes-notes` 已在 `createNote` 成功后把创建结果写入 `notes-sync` 队列。
- 新增 `workspace-sync-write-path.contract.test.mjs`，冻结 `createNote -> queued sync task` 语义。
- 新合同已进入根级 `test:workspace:contracts`，并通过 `pnpm.cmd typecheck` 全链验证。

## 不包含内容

- 不包含正文保存链接入。
- 不包含删除、恢复、移动等写路径接入。
- 不包含后台同步 worker、冲突恢复 UI、离在线切换验证。

## 当前发布判断

- `CP08-3` 已开始形成真实可审计证据，但本轮仍只是首个增量切片。
- 当前不具备 `Step 08` 候选发布放行条件。
- 下一轮应继续留在 `CP08-3`，优先接入 `persistActiveNote`。

