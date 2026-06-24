> Migrated from `docs/review/step-08-主写入路径createNote接入审计-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 主写入路径 createNote 接入审计

- 日期：`2026-04-13`
- 审计对象：`CP08-3 / 主写入路径接入（createNote 增量）`

## 审计结论

- `createNote` 主写入路径已经接入 `@sdkwork/notes-sync` 队列边界。
- 本轮已形成 `代码 + 合同测试 + 类型检查 + 文档` 四类证据，因此 `CP08-3` 的首个增量切片可记为 `L3`。
- 本轮不宣称 `CP08-3 = L4`，也不宣称 `Step 08 = L4`。

## 当前等级判定

- `Step 08`：`L2`
- `CP08-3 / 主写入路径接入`：`进行中`
- `CP08-3 / createNote 增量`：`L3`

## 证据

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - 已新增 `syncQueueStore` 注入边界
  - `createNote()` 成功路径已显式调用 `createNotesSyncTask()` 并持久化 queue snapshot
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
  - 已冻结 `createNote -> queued sync task` 的真实合同
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已把新合同纳入 `test:workspace:contracts`
- `sdkwork-notes-pc-react/tsconfig.base.json`
  - 已补齐 `@sdkwork/notes-sync` monorepo path alias，避免包解析回退
- `pnpm.cmd typecheck`
  - 已证明新依赖、新合同和现有 contract 主链可整仓共存

## 风险与剩余缺口

- 当前只有 `createNote` 被接入，正文保存、删除、恢复、移动等主写路径仍未产出同步任务。
- 当前仍是“写成功后再入队”的过渡式集成，不是最终目标中的本地优先事务模型。
- 尚未交付后台同步 worker、远端回执应用、冲突提示和失败恢复 UI。
- `docs/step/95` 的同步能力要求中，“离在线切换验证”和“冲突演练记录”仍然缺失，因此整体能力还不能提升到 `L3/L4`。

## `91` 审计结论 / 预估变化

- 本轮未单独执行 `docs/step/91` 正式审计。
- 按能力缺口估算，`Step 08` 的实现完整度与集成可追溯性相较上一轮有实质提升，预估总分可上升 `4-6` 分。
- 当前仍不满足放行标准，主要缺口仍集中在：
  - 其余主写入路径未接入
  - worker / 回执 / 冲突恢复未落地
  - UI 与离在线切换验证缺证据

## 下一步建议

1. 继续留在 `CP08-3`，优先接入 `persistActiveNote`，让正文更新主链进入 queue。
2. 在 `persistActiveNote` 接入后，再覆盖删除、恢复、移动等写路径。
3. 等主写入路径具备最小覆盖后，再进入 `CP08-4` 的 worker、冲突和恢复验证。

