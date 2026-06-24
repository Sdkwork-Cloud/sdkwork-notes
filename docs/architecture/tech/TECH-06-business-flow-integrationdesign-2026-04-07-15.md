> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-读策略注册表补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06. 业务流程 / 应用接口与集成设计补充：读策略注册表

- 日期：2026-04-07
- 对应 Step：04
- 当前状态：已落地，保持 `L3`

## 1. 目标

将工作区读取路径从“默认单策略注入”演进为“显式策略注册 + 策略键选择 + 默认回退”模式，为未来本地副本、读穿缓存和同步队列快照提供统一切换入口。

## 2. 当前设计

### 2.1 读策略键域

当前在 `notesWorkspace.ts` 中显式定义 `NoteWorkspaceReadStrategyKey`：

- `workspace-snapshot`
- `read-through-cache`
- `replica-snapshot`
- `queued-sync-snapshot`

其中：

- `workspace-snapshot` 是当前已实现的远端快照策略
- 其余三个 key 是后续能力包接入时的稳定占位，不代表已经完成具体实现

### 2.2 注册表职责

`noteWorkspaceReadStrategyRegistry.ts` 负责三件事：

1. 将多个 `NoteWorkspaceReadStrategy` 注册为稳定映射
2. 暴露 `listKeys()` 与 `defaultKey`，让当前策略拓扑可被描述
3. 通过 `resolve(requestedKey)` 返回目标策略，未命中时回退默认策略

### 2.3 repository 集成流程

当前 `createNoteRepository()` 的读取策略装配顺序为：

1. 先构造默认策略
2. 再将 `workspaceReadStrategy + workspaceReadStrategies` 组装为注册表
3. 最后按 `workspaceReadStrategyKey` 解析实际使用策略

这意味着 repository 已具备以下能力：

- 不改主干逻辑即可注册额外未来策略
- 可以在构造时显式请求 `replica-snapshot` 等未来 key
- 当前默认路径仍然稳定保持 `workspace-snapshot`

## 3. 运行时行为

### 3.1 当前默认行为

当调用方未提供 `workspaceReadStrategyKey` 时：

- repository 继续使用默认 `workspace-snapshot`
- 工作区 `dataSource.readStrategy` 仍然输出 `workspace-snapshot`
- 现有业务流程零回归

### 3.2 未来行为

当后续能力包提供未来策略实现时：

- 本地副本优先读取可挂接为 `replica-snapshot`
- 读穿缓存可挂接为 `read-through-cache`
- 排队同步后的稳定快照可挂接为 `queued-sync-snapshot`

这三类能力不再需要直接改写 repository 主体，只需要提供新策略并注册到 registry。

## 4. 评估标准

### 4.1 设计标准

- 策略键必须显式、稳定、可枚举
- 注册表必须拒绝重复 key
- 默认 key 必须可验证，不允许隐式漂移

### 4.2 实现标准

- repository 不允许继续硬编码单一路径
- 未来策略接入必须通过注册表完成
- 任何未来策略都必须通过契约测试证明可被解析

### 4.3 测试标准

至少需要覆盖：

1. 已注册 key 的正常解析
2. 未注册未来 key 的默认回退
3. 重复 key 的创建失败
4. repository 对 `workspaceReadStrategyKey` 的真实消费

## 5. 当前结论

本补充说明对应的能力已经真实落地，repository 的未来读策略接缝已建立。当前唯一未完成的 Step 04 主阻塞已转移到页面容器剩余胶水，而不再是 repository 的策略扩展能力。

