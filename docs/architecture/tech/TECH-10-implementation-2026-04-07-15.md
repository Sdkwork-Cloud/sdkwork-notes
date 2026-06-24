> Migrated from `docs/架构/10-实施进度-读策略注册表增量-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 04 实施进度增量：读策略注册表

- 日期：2026-04-07
- Step：04
- 增量主题：repository 未来读策略注册表
- 当前等级：`L3`

## 1. 本轮完成项

1. 新增 `noteWorkspaceReadStrategyRegistry.ts`
2. 建立 `defaultKey / listKeys / resolve` 统一边界
3. `noteRepository.ts` 接入 `workspaceReadStrategies + workspaceReadStrategyKey`
4. `notesWorkspace.ts` 显式引入 `NoteWorkspaceReadStrategyKey`
5. 新增 `workspace-read-strategy-registry.contract.test.mjs`
6. 将新 contract 纳入 `test:workspace:contracts`

## 2. 本轮收益

### 2.1 repository 扩展点从“注入一个策略”升级为“注册一组策略”

当前 repository 已经可以稳定承接未来 `read-through-cache / replica-snapshot / queued-sync-snapshot` 策略，而不需要再次改造构造主干。

### 2.2 默认行为保持稳定

即使新增了注册表与策略 key，当前实际业务路径依旧是 `workspace-snapshot`，因此没有引入当前远端工作区的行为漂移。

### 2.3 回归风险可被门禁拦截

策略 key 的重复注册、未知默认 key 与 repository 对策略 key 的忽略，都已经进入 Node contract 门禁。

## 3. 验证结论

### 已通过

- `node --test --experimental-test-isolation=none scripts/workspace-read-strategy-registry.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-read-strategy.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/workspace-data-source.contract.test.mjs`
- `node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs`
- `pnpm.cmd --filter @sdkwork/notes-notes typecheck`
- `pnpm.cmd typecheck`

### 已记录的环境限制

- `pnpm.cmd --filter @sdkwork/notes-notes test -- src/repository/noteRepository.test.ts`
- 该命令仍受当前 `vite/vitest -> spawn EPERM` 环境问题影响，不能作为本轮有效门禁

## 4. Step 状态复评

### 已解决

- repository 面向未来同步能力的策略接缝
- 读策略键域显式化
- repository 按 key 切换策略

### 未解决

1. 页面容器中剩余的 command palette icon 映射
2. 页面容器中少量 header action/layout 装配胶水

## 5. 下一步建议

下一轮优先抽离 `NotesWorkspacePage.tsx` 中剩余的页面 chrome 装配逻辑，建立页面级 view model 或 adapter factory。只有页面容器进一步收敛为薄适配层后，Step 04 才具备从 `L3` 向 `L4` 评估的条件。

