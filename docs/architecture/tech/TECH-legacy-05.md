> Migrated from `docs/step/05-编辑器与自动保存可靠性升级.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 05 - 编辑器与自动保存可靠性升级

## 1. 目标与范围

本 step 用于强化编辑器和自动保存链的可靠性，确保后续本地草稿、同步队列、版本历史都建立在稳定的编辑与保存语义之上。

### 1.1 执行输入

- Step 04 的数据访问与初始化链
- `docs/架构/06`、`07`
- `NoteEditorPane`、`NotesWorkspacePage`、`useNotesWorkspaceStore`

### 1.2 本步非目标

- 不在本 step 内实现完整版历史版本
- 不在本 step 内实现同步队列

### 1.3 最小输出

- 更稳定的草稿、保存、失败反馈与切换一致性
- 编辑器事件与保存策略分层

## 2. 架构对齐

- `docs/架构/06-业务流程-应用接口与集成设计.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`

## 3. 当前现状与问题

当前已经具备 `debounce autosave`、`visibilitychange/pagehide` 刷盘、统一 `flushDraft` 入口、失败反馈状态机与串行 `save queue`，但还存在以下主缺口：

- 自动退避、重试上限和保存观测仍未形成稳定规则
- 页面关闭、异常退出与真正的本地恢复证据矩阵仍不足
- `CP05-1 / 编辑器输入层与草稿状态层边界` 还缺少独立的收口审计，不能把“已有实现”直接误判为整体 `L4`

## 4. 设计

### 4.1 目标分层

- 编辑器输入层
- 草稿状态层
- 保存编排层
- 错误恢复与用户反馈层

### 4.2 目标语义

- 任何切换、退出、隐藏、危险操作前都能明确 flush
- 保存失败有重试和状态提示
- 为未来本地日志和 revision 留接口

## 5. 实施落地规划

1. 收敛编辑器 onUpdate 与 draft state 的关系
2. 建立更清晰的 save queue / flush 入口
3. 强化 visibilitychange、快捷键、路由切换前保存行为
4. 明确失败、冲突和恢复提示语义

## 6. 测试计划

- store/save pipeline 单测
- 编辑器组件单测
- 切换、隐藏、快捷键保存的集成测试
- 保存失败与重试 smoke test

## 7. 结果验证

完成后必须满足：

- 保存链行为可预测
- 切换和危险操作前不会丢草稿
- 后续本地日志和同步队列可以平滑接入

## 8. 检查点

- `CP05-1`：编辑器输入层与草稿状态层边界冻结
- `CP05-2`：保存编排层统一入口完成
- `CP05-3`：失败反馈与重试策略测试通过
- `CP05-4`：切换与危险操作前 flush 证据齐全

### 8.1 推荐 review 产物

- `docs/review/step-05-保存链可靠性审计-YYYY-MM-DD.md`
- `docs/review/step-05-串行保存编排审计-YYYY-MM-DD.md`

### 8.2 推荐并行车道

- `05-A`：编辑器事件与草稿状态收敛
- `05-B`：保存编排与失败恢复
- `05-C`：集成测试与 UX 文案校验

### 8.3 架构能力闭环判定

如果保存失败、切换和隐藏场景仍无法稳定复现并验证，本 step 不算闭环。

### 8.4 快速并行执行建议

- 先固化保存状态机，再分别接组件事件和集成测试

### 8.5 完成后必须回写的架构文档

- `docs/架构/05-数据模型与存储设计.md`
- `docs/架构/06-业务流程-应用接口与集成设计.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`
- `docs/架构/09-实施计划.md`

### 8.6 本 Step 完成后必须兑现的架构能力

- 编辑状态、保存状态、同步状态三层语义不再混杂
- 自动保存具备失败可见、重试、恢复和切换一致性能力
- 断网、崩溃、切换笔记等高风险场景不再轻易导致丢稿

### 8.7 最快完成的并行执行顺序

1. 先冻结编辑事件流和保存状态机
2. 再并行推进保存链实现与失败恢复 UI
3. 然后并行补切换场景、崩溃场景和回归测试
4. 最后统一接入本地层与后续同步适配点

## 9. 风险与回滚

### 9.1 风险

- 保存链调整若缺少回归，容易引入隐藏丢稿问题

### 9.2 回滚

- 保留原保存入口一段时间，使用 feature flag 或配置开关灰度切换

## 10. 完成定义

- 自动保存、手动保存和切换前 flush 的行为已统一
- 保存失败场景有明确反馈和测试
- in-flight save 已串行化，连续保存不会直接并发覆盖
- 旧保存响应不会覆盖更新后的本地草稿

## 11. 下一步准入条件

进入 step 06 前必须确认：

- 本地草稿和恢复能力可以建立在稳定保存链之上

## 12. 当前执行状态（`2026-04-13`）

- 当前波次：`Wave-B`
- 当前 Step：`Step 05`
- 当前等级：`L4`
- 当前执行策略：`串行优先`

本轮后已确认的事实：

1. `visibilitychange(hidden)`、`pagehide`、快捷键保存和高风险动作前刷盘都已共享 `flushDraft`
2. 保存反馈已具备 `error -> retrying -> recovered` 显式状态机
3. 活跃笔记保存请求已进入串行 `save queue`，并支持 replay 合并
4. 高风险动作前已形成 `dirty / error -> flush`、`saving / retrying -> wait` 的 contract 证据
5. 旧保存响应返回时不会覆盖更新后的本地草稿

本轮后 Step 05 已确认闭环，下一执行入口切换为：`Step 06-本地草稿与恢复能力`

### 12.1 后续增量更新（`2026-04-13` / 第二十九轮后续）

本轮继续在 `save queue` 主链之上补齐了 Step 05 剩余缺口中的第一优先级项：

1. 自动退避已经冻结为 `500ms -> 1500ms -> terminal error`
2. 最大自动重试次数已经冻结为 `2`
3. 保存链最小 telemetry sink 接口已经建立：
   - `notes.workspace.save.retry.scheduled`
   - `notes.workspace.save.retry.recovered`
   - `notes.workspace.save.retry.exhausted`
4. `@sdkwork/notes-observability` 已正式通过 workspace type alias 接入 `notes-notes`

本轮后当前状态更新为：

1. `自动退避 / 重试上限 / 保存观测接口 = L4`
2. `Step 05` 总体仍保持 `L3`

当前剩余主要阻塞收敛为：

1. 页面关闭 / 异常退出 / 崩溃恢复证据矩阵
2. Step 06 本地草稿恢复对当前保存主链的接入约束

### 12.2 后续增量更新（`2026-04-13` / 第三十轮推进）

本轮继续沿 `save queue` 主链收口了 Step 05 剩余的最后一个高优先级缺口：

1. `@sdkwork/notes-local` 已补齐本地恢复检查点存储实现。
2. `noteWorkspaceExitRecovery.ts` 已冻结 `LocalDraftSnapshot` 构建、capture 与 clear 边界。
3. `useNotesWorkspaceStore.ts` 已形成：
   - `draft-change -> capture local checkpoint`
   - `save success / no-op -> clear local checkpoint`
4. `noteWorkspaceAutosaveRuntime.ts` 已正式冻结：
   - `pagehide -> capture -> flush`
   - `visibilitychange(hidden) -> capture -> flush`
5. `workspace-exit-recovery.contract.test.mjs` 已进入根级 `test:workspace:contracts`。

本轮 fresh verification：

```powershell
node --test --experimental-test-isolation=none scripts/workspace-exit-recovery.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

本轮后当前状态更新为：

1. `退出恢复检查点主链 = L4`
2. `Step 05 = L4`
3. 下一轮执行入口切换到 `Step 06-本地草稿与恢复能力`

