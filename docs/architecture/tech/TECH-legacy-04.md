> Migrated from `docs/step/04-工作区数据访问与初始化链重构.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 04 - 工作区数据访问与初始化链重构

## 1. 目标与范围

本 step 用于把当前“远端分页扫描 + 客户端聚合 + 页面级编排偏重”的工作区访问模式，重构为更清晰的 repository / orchestration / selector 结构，为后续本地存储、搜索和同步打底。

### 1.1 执行输入

- Step 02、03 输出
- `docs/架构/05`、`06`、`07`
- `notes-notes` 的 repository、store、page、selector 现状

### 1.2 本步非目标

- 不在本 step 内实现真正本地优先
- 不在本 step 内实现全文索引

### 1.3 最小输出

- 工作区初始化链分层收敛
- 列表、详情、文件夹和视图计算的职责边界清晰
- 可承接本地副本和增量加载的接口面

## 2. 架构对齐

- `docs/架构/05-数据模型与存储设计.md`
- `docs/架构/06-业务流程-应用接口与集成设计.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`

## 3. 当前现状与问题

当前问题主要是：

- 初始化仍高度依赖远端扫描
- 工作区视图和页面编排耦合较重
- 搜索、命令面板、最近视图都建立在当前快照之上

## 4. 设计

### 4.1 目标分层

- `repository`：负责远端或未来本地数据读写
- `workspace orchestrator`：负责初始化、增量加载、默认选中逻辑
- `selectors`：负责视图过滤与派生结果
- `page`：只做事件编排与渲染

### 4.2 演进目标

- 为本地副本引入 read-through / write-through 接口预留
- 为搜索和同步提供稳定数据源

## 5. 实施落地规划

1. 收敛 `noteRepository` 的查询和写入接口
2. 将初始化流程从页面进一步下沉到 orchestration 层
3. 收敛最近、收藏、回收站、文件夹后代过滤等 selector 逻辑
4. 为后续增量加载、本地副本和索引源预留接口

## 6. 测试计划

- repository 单测
- store/init 单测
- workspace 页面 contract test
- 关键初始化链路 smoke test

## 7. 结果验证

完成后必须满足：

- 初始化链职责清楚
- 页面不再成为数据访问和视图计算的大杂烩
- 后续本地能力和搜索可以接入而不重写整条链路

## 8. 检查点

- `CP04-1`：repository / orchestration / selector 边界冻结
- `CP04-2`：工作区初始化链重构完成
- `CP04-3`：初始化、选择、切换相关测试通过
- `CP04-4`：后续本地副本与搜索接口面预留完成

### 8.1 推荐 review 产物

- `docs/review/step-04-初始化链设计审计-YYYY-MM-DD.md`
- `docs/review/step-04-数据访问边界决议-YYYY-MM-DD.md`

### 8.2 推荐并行车道

- `04-A`：repository 与 DTO/mapper 收敛
- `04-B`：workspace orchestration 与 store
- `04-C`：selector / contract test / 文档回写

### 8.3 架构能力闭环判定

若本地副本和搜索仍无法在不重写页面的前提下接入，本 step 不算闭环。

### 8.4 快速并行执行建议

- 先冻结仓储接口，再并行拆 orchestration 和 selector
- 页面整合留到最后收口

### 8.5 完成后必须回写的架构文档

- `docs/架构/05-数据模型与存储设计.md`
- `docs/架构/06-业务流程-应用接口与集成设计.md`
- `docs/架构/07-性能-离线-搜索-同步设计.md`

### 8.6 本 Step 完成后必须兑现的架构能力

- `repository / workspace orchestrator / selectors / page` 四层边界稳定
- 初始化链、默认选中、增量加载和视图派生形成可测试主链路
- 本地副本、搜索索引、同步队列都可以在不重写页面的前提下接入

### 8.7 最快完成的并行执行顺序

1. 先冻结仓储接口、初始化时序和 selector 输入输出
2. 再并行推进 repository 收敛与 orchestration 下沉
3. 然后并行清理 selector 与页面编排职责
4. 最后统一做页面接线、集成测试和文档回写

## 9. 风险与回滚

### 9.1 风险

- 初始化链重构若一步做太大，容易影响现有工作区可用性

### 9.2 回滚

- 保留旧初始化入口作为临时兼容分支，分阶段切换

## 10. 完成定义

- 数据访问边界清晰
- 初始化链可测试
- 页面层复杂度明显下降

## 11. 下一步准入条件

进入 step 05 前必须确认：

- 保存链已能够建立在清晰的工作区数据模型之上

