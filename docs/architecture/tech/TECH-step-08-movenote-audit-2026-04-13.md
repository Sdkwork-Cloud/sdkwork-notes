> Migrated from `docs/review/step-08-主写入路径moveNote接入审计-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 主写入路径 moveNote 接入审计

- 日期：`2026-04-13`
- 审计对象：`CP08-3 / 主写入路径接入（moveNote 增量）`

## 审计结论

- `moveNote` 主写入路径已经接入 `@sdkwork/notes-sync` 队列边界。
- 本轮已形成 `代码 + 合同测试 + 类型检查 + 文档` 四类证据，因此 `CP08-3` 的第五个增量切片可记为 `L3`。
- 本轮不宣称 `CP08-3 = L4`，也不宣称 `Step 08 = L4`。

## 当前等级判定

- `Step 08`：`L2`
- `CP08-3 / 主写入路径接入`：`进行中`
- `CP08-3 / moveNote 增量`：`L3`

## 证据

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - `moveNote()` 的 `apply` 成功路径已显式调用 `enqueueNoteSyncTask(noteId, 'move', atValue)`，把父文件夹变更结果映射为 `queued` 移动任务。
  - 同步任务时间戳优先取自移动后 summary 的 `updatedAt`。
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
  - 已新增 `moveNote -> queued move sync task` 的真实合同。
  - 现有 `createNote`、`persistActiveNote`、`moveNoteToTrash` 与 `restoreNoteFromTrash` 合同继续保留，主写入合同覆盖面从 4 条路径扩展到 5 条路径。
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`
  - 已证明新的移动任务接线与现有 `upsert` / `delete` / `restore` 路径、整仓合同链和类型链可共存。

## 策略切换记录

- 原计划下一切片是 `deleteNotePermanently`。
- 重新核对 `noteRepository.ts` 后确认：该路径调用的是远端 `permanentlyDelete`，而当前 `notes-sync` operation 模型只冻结了 `upsert / delete / restore / move`，没有显式 `permanent-delete`。
- 若在本轮继续盲接 `deleteNotePermanently`，会把“移入废纸篓”和“永久删除”压成同一个队列事实类型，削弱后续 worker / 回放 / 冲突处理的可解释性。
- 因此本轮显式切换到 `moveNote`，把 `deleteNotePermanently` 退回为后续语义决策项。

## 风险与剩余缺口

- 当前已覆盖 `createNote + persistActiveNote + moveNoteToTrash + restoreNoteFromTrash + moveNote`，但 `deleteNotePermanently` 的同步语义尚未冻结。
- 当前仍是“写成功后再入队”的过渡式集成，不是最终目标中的本地优先事务模型。
- 尚未交付后台同步 worker、远端回执应用、冲突提示和失败恢复 UI。
- `docs/step/95` 的同步能力要求中，“冲突演练记录”和“离在线切换验证”仍然缺失，因此整体能力还不能提升到 `L3/L4`。

## `91` 审计结论 / 预估变化

- 本轮未单独执行 `docs/step/91` 正式审计。
- 按能力缺口估算，`Step 08` 的关键元数据变更主链可追溯性继续上升，预估总分可再上升 `3-5` 分。
- 当前仍不满足放行标准，主要缺口仍集中在：
  - `deleteNotePermanently` 语义待冻结
  - worker / 回执 / 冲突恢复未落地
  - UI 与离在线切换验证缺证据

## 下一步建议

1. 先显式冻结 `deleteNotePermanently` 的同步语义：扩 `notes-sync` operation 模型，或沉淀为后续 backlog。
2. 在该语义决策完成后，再决定是否继续留在 `CP08-3` 补永久删除，还是进入 `CP08-4` 的 worker、冲突和恢复验证。

