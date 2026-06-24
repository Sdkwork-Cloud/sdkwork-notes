> Migrated from `docs/review/step-04-读取策略边界收敛-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 04 读取策略边界收敛评审

- 日期：2026-04-07
- Step：04
- 评审主题：repository 读取策略边界收敛
- 当前成熟度：`L3`

## 1. 评审目标

为 `noteRepository.ts` 建立真实的读取策略扩展点，避免工作区读取路径长期固化在 repository 内部，为后续 `read-through / replica / sync` 能力预留稳定边界。

## 2. 本轮变更

### 2.1 新增读取策略模块

- 新增 `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/repository/noteWorkspaceReadStrategy.ts`
- 建立 `createWorkspaceSnapshotReadStrategy()` 工厂
- 建立 `NoteWorkspaceReadStrategy` / `NoteWorkspaceReadStrategyDependencies` 边界

### 2.2 repository 接入策略边界

- `AppSdkNoteRepository` 新增 `workspaceReadStrategy`
- `queryWorkspaceSnapshot()` 不再直接内联：
  - 活跃笔记汇总
  - 回收站笔记汇总
  - 文件夹读取
  - 数据源拼装
- `queryWorkspaceSnapshot()` 改为统一委托给读取策略层

### 2.3 工厂化注入能力

- 新增 `createNoteRepository()` 工厂
- repository 支持注入自定义 `workspaceReadStrategy`
- 为未来接入本地副本、缓存前置、同步合并策略提供了真实技术入口

## 3. 契约与验证

### 3.1 新增契约

- `sdkwork-notes-pc-react/scripts/workspace-read-strategy.contract.test.mjs`

覆盖重点：

1. `workspace-snapshot` 策略键值存在
2. `pageRequest.keyword` 会透传给回收站读取
3. 读取成功时会输出远端数据源描述
4. 文件夹查询失败时不会伪造部分工作区快照

### 3.2 总门禁补齐

- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`

均已纳入 `workspace-read-strategy.contract.test.mjs`

### 3.3 已通过验证

- `node --test --experimental-test-isolation=none scripts/workspace-read-strategy.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd test:workspace:contracts`
- `pnpm.cmd typecheck`

### 3.4 环境限制说明

已补充 `noteRepository.test.ts` 的策略注入集成测试，但本机 `vitest` 仍受既有 Vite/Windows `spawn EPERM` 限制，无法完成定向执行。该限制不影响 Node 契约门禁、包级 typecheck 与根级 typecheck 的通过结论。

## 4. 质量评估

### 4.1 架构可扩展性

- 评估结论：显著提升
- 说明：工作区读取已从 repository 内联流程收敛为策略边界，未来可以新增更多读取策略而不强制改写 repository 主体

### 4.2 边界清晰度

- 评估结论：通过
- 说明：策略层只负责“如何组装工作区快照”，repository 只负责“提供读取能力与默认策略”

### 4.3 风险控制

- 评估结论：通过
- 说明：新增策略已进入总契约门禁，能够在后续迭代中持续防止边界回退

## 5. Step 04 复评

本轮完成后，Step 04 的两个主阻塞点中，repository 读取策略边界已建立，剩余主要阻塞点集中为：

1. `NotesWorkspacePage.tsx` 仍持有偏重的依赖装配与运行时绑定
2. 页面层尚未完全收敛为薄适配层

## 6. 结论

本轮增量真实降低了 Step 04 的架构风险，完成了从“单一远端读取实现”到“可扩展读取策略边界”的关键演进。但由于页面装配层仍偏重，Step 04 仍维持 `L3`，尚不能判定为 `L4` 完成。

