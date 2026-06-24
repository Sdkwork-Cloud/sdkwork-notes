> Migrated from `docs/step/08-主写入路径接入-createNote增量-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 - 主写入路径接入 createNote 增量

- 日期：`2026-04-13`
- 波次：`Wave-C / 第四十一轮推进`
- 检查点：`CP08-3 / 主写入路径接入`
- 本轮增量：`createNote -> sync queue`

## 交付范围

- 仅接入 `notes-notes` 的 `createNote` 主写入路径。
- 在 `createNote` 成功创建并应用工作区状态后，显式追加一条 `note / upsert / queued` 同步任务到 `@sdkwork/notes-sync` 队列边界。
- 不在本轮提前接入 `persistActiveNote`、`moveToTrash`、`restoreFromTrash`、`deleteById`、`moveNote` 等其他写路径。
- 不在本轮提前接入后台同步 worker、冲突 UI 或断网恢复 smoke。

## 变更摘要

### 新增

- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
  - 冻结 `createNote` 成功后必须落一条 `queued` 同步任务到 queue store 的合同
  - 冻结任务实体类型、操作类型、状态、时间戳与初始 retry 元数据

### 修改

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - 新增 `syncQueueStore` 依赖注入
  - 默认消费 `createBrowserNotesSyncQueueStore()`
  - 在 `createNote()` 成功路径调用 `createNotesSyncTask()` 生成 `note/upsert` 任务并持久化到队列
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/package.json`
  - 新增 `@sdkwork/notes-sync` workspace 依赖
- `sdkwork-notes-pc-react/tsconfig.base.json`
  - 新增 `@sdkwork/notes-sync` monorepo path alias
- `sdkwork-notes-pc-react/scripts/workspace-startup-recovery-smoke.contract.test.mjs`
  - 同步升级 store loader，允许新的 `@sdkwork/notes-sync` 包依赖进入现有工作区 smoke 合同
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
  - 已把 `workspace-sync-write-path.contract.test.mjs` 纳入根级 `test:workspace:contracts`

## 兑现结果

- `createNote` 不再只是“远端创建成功 + store 本地切换选中”，而是已经开始产出可追踪的同步任务。
- `notes-notes` 与 `notes-sync` 之间形成第一条真实主写入集成边界，后续其他写路径可以复用相同 queue 接口继续推进。
- `test:workspace:contracts` 已正式守住这条边界，避免后续回退成“创建成功但没有同步任务”的假接入状态。

## 当前状态

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = 进行中`
- `CP08-3 / createNote 增量 = L3`
- `CP08-4 / 冲突与失败恢复验证 = 未开始`
- `Step 08` 当前整体仍为 `L2`

## 仍缺失项

- `persistActiveNote` 尚未把正文更新映射为同步任务，真正高频写路径仍未接入。
- 删除、恢复、移动、清空废纸篓等写路径尚未进入 queue。
- 当前仍是“主写入成功后补队列”的过渡方案，不是最终的“本地事务 + 入队 + 后台同步”完整双层确认模型。
- 冲突提示、失败恢复 UI、离在线切换验证仍未落地，因此 Step 08 不能宣称 `L4`。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-queue.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-startup-recovery-smoke.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

