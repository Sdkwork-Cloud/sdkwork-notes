> Migrated from `docs/review/step-06-恢复入口与本地草稿消费审计-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 06 恢复入口与本地草稿消费审计

- 日期：`2026-04-13`
- 阶段：`Step 06 / L2`
- 波次：`Wave-B / 第三十一轮推进`
- 本轮主题：`本地恢复草稿读侧接入 + 恢复入口 UI + 主链回放`

## 1. 审计目标

在不提前把 `Step 06` 扩张为“完整本地优先”的前提下，先把 `Step 05` 已冻结的恢复检查点真正消费起来，形成一条用户可见、可验证、可继续迭代的最小恢复主路径：

1. 初始化时读取 `NotesLocalStore.loadWorkspace().drafts`。
2. 仅对当前工作区内仍然存在的 live note 暴露恢复候选，不把 trash / missing note 混入恢复面。
3. 页面能看到恢复提示，并可执行“打开 / 恢复 / 放弃”动作。
4. 恢复动作必须回放到既有 `save queue + save feedback + retry policy + exit recovery capture` 主链，而不是新开一套本地写入链路。

## 2. 本轮实际完成

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceRecovery.ts`
   - 新增纯函数恢复服务，冻结以下边界：
     - `resolveNotesWorkspaceRecoveredDrafts()`
     - `resolveActiveNotesWorkspaceRecoveredDraft()`
     - `removeNotesWorkspaceRecoveredDraft()`
     - `restoreNotesWorkspaceRecoveredDraft()`
   - 只允许 `NotesLocalStore.loadWorkspace().drafts` 中与当前 live note 匹配的恢复候选进入页面恢复面。
2. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
   - 初始化时读取本地草稿恢复检查点，并映射为 `recoveredDrafts / activeRecoveredDraft`。
   - 新增 `restoreRecoveredDraft()` 与 `dismissRecoveredDraft()`。
   - 恢复动作会把本地草稿回放到当前 `activeNote`，并把状态重新置为 `dirty`。
   - 放弃动作会清理本地恢复检查点，不再继续暴露伪恢复候选。
   - 草稿一旦继续编辑、保存成功、移入回收站或永久删除，对应恢复候选会从当前会话恢复面退出。
3. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceRecoveryBanner.tsx`
   - 新增独立恢复提示横幅组件。
4. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx`
   - 页面层正式接入恢复提示 UI。
   - 若当前选中的笔记就是恢复候选，则提供“恢复草稿 / 放弃草稿”。
   - 若恢复候选属于其它笔记，则提供“打开笔记 / 放弃草稿”。
5. `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/zh-CN.ts`
   - 补齐恢复提示与动作文案。
6. `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/en-US.ts`
   - 补齐英文恢复提示与动作文案。
7. `sdkwork-notes-pc-react/scripts/workspace-local-recovery.contract.test.mjs`
   - 新增 Node contract，冻结恢复候选过滤、恢复回放，以及 store/page 接线事实。
8. `sdkwork-notes-pc-react/package.json`
   - 已把 `workspace-local-recovery.contract.test.mjs` 接入 `test:workspace:contracts`。

## 3. 验证证据

本轮 fresh verification：

```powershell
node --test --experimental-test-isolation=none scripts/workspace-local-recovery.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

验证结论：

1. 恢复纯函数已经证明：
   - 只暴露 live note 恢复候选。
   - `trash / missing note` 不进入恢复面。
   - 恢复动作保留 note identity，只回放本地草稿字段。
2. 页面与 store 接线已进入合同：
   - `recoveredDrafts / activeRecoveredDraft`
   - `restoreRecoveredDraft / dismissRecoveredDraft`
   - `NotesWorkspaceRecoveryBanner`
3. 根级 `pnpm.cmd typecheck` 已重新执行 `test:workspace:contracts`，本轮新增合同已进入主门禁。

## 4. 闭环判断

### 4.1 已闭环项

1. `CP06-2 / 草稿日志与恢复入口` 已形成最小闭环：
   - 本地恢复候选可读
   - 恢复入口可见
   - 恢复回放可执行
   - 放弃动作可清理
2. 设计闭环：
   - 恢复面继续以远端为权威源，不把本地一期伪装成离线主源。
   - 恢复候选只能消费 `NotesLocalStore.loadWorkspace().drafts`。
3. 实现闭环：
   - service、store、component、page、i18n、contract 已全部落地。
4. 测试闭环：
   - 新合同已证明恢复过滤、恢复回放与页面接线。
5. 文档闭环：
   - review / 架构 / release / step 已同步回写。

### 4.2 当前等级结论

1. `CP06-2 / 草稿日志与恢复入口 = L4`
2. `Step 06` 整体当前提升为 `L2`

当前仍不能把 `Step 06` 判定为 `L4`，因为以下关键能力尚未兑现：

1. `CP06-1 / schema 与迁移策略冻结`
2. `CP06-3 / 面向搜索与同步的标准化本地快照接口`
3. `CP06-4 / 启动恢复 smoke test` 的更完整证据矩阵

## 5. 剩余差距与下一轮输入

当前最大剩余差距已经收敛为：

1. 本地 workspace snapshot 仍只有 `drafts` 真正被消费，`notes / folders` 还没有稳定的本地副本与迁移策略。
2. 搜索与同步尚未获得可消费的标准化本地快照接口。
3. 恢复体验当前仅覆盖单条候选的打开 / 恢复 / 放弃，不含多候选管理、冲突副本或 startup smoke 级验证。

下一轮最优入口：

1. 先补 `CP06-1`：schema version / migration / key model 冻结。
2. 再补 `CP06-3`：为搜索和同步暴露 `notes / folders / drafts` 的标准化本地快照接口。

