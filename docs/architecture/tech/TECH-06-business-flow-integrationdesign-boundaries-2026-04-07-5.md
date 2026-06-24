> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-读取策略边界补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 读取策略边界补充设计

- 日期：2026-04-07
- 适用 Step：04
- 文档类型：业务流程 / 应用接口与集成设计补充

## 1. 设计背景

在此前实现中，`noteRepository.ts` 直接内联工作区快照的组装流程。这种实现虽然可用，但存在两个明显问题：

1. repository 同时承担“远端访问”和“快照组装策略”两类职责，边界过重
2. 当后续引入本地副本、读穿缓存、同步队列时，无法自然扩展为多策略结构

因此，本轮设计目标是在不改变现有远端能力的前提下，引入正式的读取策略边界。

## 2. 设计原则

### 2.1 repository 负责能力，strategy 负责编排

- repository 负责提供：
  - 活跃笔记读取
  - 回收站笔记读取
  - 文件夹读取
  - 默认远端数据源
- strategy 负责：
  - 读取顺序
  - 关键字透传
  - 快照组装
  - 失败回传策略

### 2.2 默认策略显式化

当前默认策略为：

- `key = workspace-snapshot`

该策略对应当前远端工作区的真实读取模型，但不再与 repository 主体硬编码绑死。

## 3. 边界定义

### 3.1 依赖输入

`NoteWorkspaceReadStrategyDependencies`

包含：

- `listActiveNoteSummaries()`
- `listDeletedNoteSummaries(keyword?)`
- `getFolders()`
- `createDataSource()`

### 3.2 策略输出

`NoteWorkspaceReadStrategy`

包含：

- `key`
- `loadWorkspaceSnapshot(pageRequest?)`

### 3.3 默认实现

`createWorkspaceSnapshotReadStrategy()`

该实现满足当前远端应用的要求：

- 活跃笔记由远端实时读取
- 回收站笔记支持关键字透传
- 文件夹失败会中断快照生成
- 默认输出远端 `app-sdk` 数据源描述

## 4. 集成方式

repository 当前通过如下方式接入：

1. `AppSdkNoteRepository` 初始化时创建默认读取策略
2. `queryWorkspaceSnapshot()` 直接委托给 `workspaceReadStrategy`
3. 对外暴露 `createNoteRepository()`，允许未来注入替代策略

形成如下结构：

`Repository runtime -> ReadStrategy -> WorkspaceSnapshot`

## 5. 评估标准

### 5.1 可扩展标准

- 新增读取策略时，不得要求复制整份 repository
- 新策略应可通过工厂或注入方式接入
- `queryWorkspaceSnapshot()` 不应重新退化为内联快照组装

### 5.2 设计标准

- 策略依赖接口必须最小化
- 文件夹失败必须阻断快照成功返回
- 关键字透传规则必须明确，避免搜索语义漂移

### 5.3 测试标准

- 策略模块必须有独立 Node 契约测试
- 策略契约必须纳入工作区总门禁
- 包级和根级类型检查必须通过

## 6. 当前结论

读取策略边界已形成，repository 已具备面向未来多读取模型的正式扩展点。这一设计满足 Step 04 对“低耦合、可扩展”的核心要求，但由于页面装配层尚未完全收敛，Step 04 整体仍保持 `L3`。

