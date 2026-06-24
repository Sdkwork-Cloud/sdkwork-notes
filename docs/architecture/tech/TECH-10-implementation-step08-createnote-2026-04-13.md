> Migrated from `docs/架构/10-实施进度-Step08主写入路径接入createNote-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10. 实施进度 - Step 08 主写入路径接入 createNote - 2026-04-13

## 本轮结论

- `CP08-3 / 主写入路径接入` 已从“纯计划”进入“真实接线”阶段。
- 当前已完成的最小增量为：`createNote -> sync queue`。
- `Step 08` 整体仍未闭环，继续保持进行中。

## 本轮新增架构事实

### 1. `notes-notes` 已建立对 `notes-sync` 的第一条主写入集成边界

- `useNotesWorkspaceStore.ts` 不再只负责工作区本地状态切换。
- `createNote()` 成功后，现在会把创建结果映射为一条 `note / upsert / queued` 同步任务。
- 这意味着 `notes-sync` 已经从“独立基础设施包”进入真实业务写路径。

### 2. 集成点暂时保持在 store 层，而不是提前下沉到 repository

- 这是有意识的阶段性决策，而不是遗漏。
- 当前范围只要求验证 `CP08-3` 首条主链，不提前重构到“本地事务 + 后台 worker”最终形态。
- 这样可以用最小改动先验证 `notes-sync` 的队列边界在主写入场景中是可消费、可验证的。

### 3. 工作区 contract 主链已纳入同步写路径门禁

- 新增 `workspace-sync-write-path.contract.test.mjs`
- 根级 `test:workspace:contracts` 已正式覆盖这条新边界
- 现有 `workspace-startup-recovery-smoke.contract.test.mjs` loader 也已同步适配 `@sdkwork/notes-sync` 依赖

### 4. Monorepo 类型解析已正式承认 `@sdkwork/notes-sync`

- `tsconfig.base.json` 已新增 `@sdkwork/notes-sync` path alias
- 这避免后续 `notes-notes`、worker、UI 或 desktop 边界接入时再次出现包解析漂移

## 对后续波次的影响

- `persistActiveNote` 可以直接复用当前 queue store 注入模式与 `createNotesSyncTask()` 生成逻辑。
- 其他写路径若沿用相同边界，后续可以逐步把 `delete / restore / move` 映射为独立 operation type。
- `CP08-4` 的 worker / 冲突恢复实现将建立在“真实主写入路径已经能稳定产出 queue task”的前提上。

## 剩余阻塞

- `createNote` 之外的主写入链仍未接入 queue。
- 仍未形成后台消费 queue、执行远端写入、应用回执与冲突分类的执行链。
- UI 侧尚未暴露同步状态、失败提示和冲突恢复入口。

