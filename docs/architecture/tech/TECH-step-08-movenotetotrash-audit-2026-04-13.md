> Migrated from `docs/review/step-08-主写入路径moveNoteToTrash接入审计-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 主写入路径 moveNoteToTrash 接入审计

- 日期：`2026-04-13`
- 审计对象：`CP08-3 / 主写入路径接入（moveNoteToTrash 增量）`

## 审计结论

- `moveNoteToTrash` 主写入路径已经接入 `@sdkwork/notes-sync` 队列边界。
- 本轮已形成 `代码 + 合同测试 + 类型检查 + 文档` 四类证据，因此 `CP08-3` 的第三个增量切片可记为 `L3`。
- 本轮不宣称 `CP08-3 = L4`，也不宣称 `Step 08 = L4`。

## 当前等级判定

- `Step 08`：`L2`
- `CP08-3 / 主写入路径接入`：`进行中`
- `CP08-3 / moveNoteToTrash 增量`：`L3`

## 证据

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - 已将入队逻辑收敛为 `enqueueNoteSyncTask(noteId, operation, atValue)` helper。
  - `moveNoteToTrash()` 成功路径已显式调用该 helper，把移入废纸篓结果映射为 `queued` 删除任务。
  - 同步任务时间戳优先取自 `result.data.deletedAt`，保证删除事实与队列时间保持一致。
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
  - 已新增 `moveNoteToTrash -> queued delete sync task` 的真实合同。
  - 现有 `createNote` 与 `persistActiveNote` 合同继续保留，主写入合同覆盖面从 2 条路径扩展到 3 条路径。
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`
  - 已证明新的删除任务接线与现有 `upsert` 路径、整仓合同链和类型链可共存。

## 风险与剩余缺口

- 当前只覆盖 `createNote + persistActiveNote + moveNoteToTrash`，恢复、永久删除、移动等主写入路径仍未产出同步任务。
- 当前仍是“写成功后再入队”的过渡式集成，不是最终目标中的本地优先事务模型。
- 尚未交付后台同步 worker、远端回执应用、冲突提示和失败恢复 UI。
- `docs/step/95` 的同步能力要求中，“冲突演练记录”和“离在线切换验证”仍然缺失，因此整体能力还不能提升到 `L3/L4`。

## `91` 审计结论 / 预估变化

- 本轮未单独执行 `docs/step/91` 正式审计。
- 按能力缺口估算，`Step 08` 的删除类主链可追溯性继续上升，预估总分可再上升 `3-5` 分。
- 当前仍不满足放行标准，主要缺口仍集中在：
  - 其余主写入路径未接入
  - worker / 回执 / 冲突恢复未落地
  - UI 与离在线切换验证缺证据

## 下一步建议

1. 继续留在 `CP08-3`，优先接入 `restoreNoteFromTrash`，补齐 Step 08 一期范围内的恢复类主链。
2. 在 `restoreNoteFromTrash` 后继续覆盖 `deleteNotePermanently`。
3. 等主写入路径具备最小覆盖后，再进入 `CP08-4` 的 worker、冲突和恢复验证。

