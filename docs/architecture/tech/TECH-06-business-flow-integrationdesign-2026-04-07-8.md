> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-对话框运行时补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 对话框运行时补充设计

- 日期: 2026-04-07
- 所属 Step: 04
- 主题: destructive dialog runtime coordinator

## 1. 背景

在笔记工作区中，destructive dialog 的完整闭环包含三类职责：

1. 打开对应 dialog。
2. 用户确认后关闭 dialog 并执行实际命令。
3. 某些相关操作需要在成功后继续切换视图或选中笔记，例如 restore note。

如果这些逻辑全部直接堆叠在页面中，页面会长期演变成 UI 事件分发器，造成如下问题：

- 页面函数数量持续膨胀
- destructive action 流程难以复用和回归
- 后续新增批量删除、冲突覆盖确认时，只能继续在页面堆分支

## 2. 当前设计

### 2.1 运行时服务边界

文件: `packages/sdkwork-notes-notes/src/services/noteWorkspaceDialogRuntime.ts`

职责:

- 打开 destructive dialog
- 关闭 dialog
- 在确认后先关闭 dialog，再转发执行命令
- 协调 restore note 成功后的视图切换和笔记选中

### 2.2 依赖注入

运行时服务不直接依赖 Store、Router 或 React Hook，而是通过依赖注入消费以下能力：

- `setPendingDialog`
- `executeDialogCommand`
- `restoreNoteFromTrash`
- `runTransition`
- `setActiveView`
- `selectNote`

这种设计保证了 runtime service 可以独立测试，并且不会把页面内部实现细节带入服务层。

## 3. 架构价值

### 3.1 高内聚

dialog runtime 的打开、关闭、确认和恢复相关行为集中在一个服务中，不再散落在多个页面处理函数内。

### 3.2 低耦合

页面只负责：

1. 保存 `pendingDialog`
2. 将 UI 事件交给 runtime service
3. 渲染 `Dialog`

### 3.3 易扩展

未来新增以下能力时，可以沿用同一模式：

- 批量删除确认
- 覆盖冲突确认
- 彻底清理本地草稿确认
- 同步失败后的重试确认

## 4. 评估标准

| 维度 | 标准 | 当前状态 |
| --- | --- | --- |
| 边界收敛 | destructive dialog runtime 必须集中到单一 service | 达成 |
| 依赖纯度 | service 不得直接依赖 React/DOM/Router 实例 | 达成 |
| 失败安全 | restore 失败时不得误触发视图切换和选中 | 达成 |
| 可测试性 | dialog runtime 必须能通过 Node contract 独立验证 | 达成 |
| 扩展性 | 新 dialog 类型应能在 service 内局部扩展 | 基本达成 |

## 5. 对标行业先进标准

行业领先应用在 destructive action 流程上通常要求：

1. 用户确认链路一致、可预测。
2. 成功与失败后的后续行为稳定可审计。
3. UI 组件不承担完整业务副作用编排。

当前实现已达到“运行时边界显式化”的第一阶段目标，但距离更高成熟度还需要继续把 autosave runtime 和 create note runtime 也拉出页面。

