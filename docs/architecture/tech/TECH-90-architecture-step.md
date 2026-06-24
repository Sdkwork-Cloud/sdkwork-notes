> Migrated from `docs/step/90-架构能力-Step-代码目录-证据映射矩阵.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 90. 架构能力 - Step - 代码目录 - 证据映射矩阵

## 1. 文档定位

本文件用于把 `docs/架构/` 中已经冻结的能力目标，映射到：

- 具体由哪个 `Step` 承担主责任
- 预计会落到哪些代码目录或工程边界
- 实施时必须沉淀什么证据
- 完成后应该回写哪些架构文档

本文件不是重新定义架构，而是作为执行前的“能力落点校验表”。任何 Step 开始前，都必须先用本表确认该 Step 是否真的承接了目标能力，而不是凭感觉开工。

## 2. 使用规则

### 2.1 使用时机

- Step 开始前：确认本轮能力边界、代码写入范围、验证口径
- Step 实施中：防止能力漂移、职责重复、跨包越界
- Step 结束后：检查是否形成了完整闭环证据

### 2.2 使用方式

1. 先定位本轮要交付的能力项
2. 再核对该能力项对应的主 Step、协同 Step
3. 再核对允许主写入的目录
4. 最后确认本轮必须补齐的验证证据和回写文档

### 2.3 一票否决项

- 能力没有对应 Step Owner，不允许启动
- 能力落点不清晰，直接跨页组件临时拼装，不允许启动
- 无法定义测试证据和结果验证，不允许宣称完成
- 已经改了代码但没有回写 `docs/架构/`，视为能力未闭环

## 3. 能力映射矩阵

| 能力编号 | 架构能力 | 对齐架构文档 | 主 Step | 协同 Step | 主代码目录/模块 | 必备设计产物 | 必备测试/验证证据 | 完成后必须回写 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CAP-01` | 共享壳层单一事实来源 | `02` `03` `04` | `02` | `03` `04` | `sdkwork-notes-pc-react/src` `sdkwork-notes-pc-react/packages/sdkwork-notes-shell` `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop` | 壳层职责矩阵、Provider 边界、路由归属表 | workspace contract test、typecheck、Web/Desktop 启动冒烟 | `docs/架构/02` `03` `09` |
| `CAP-02` | 会话安全与配置治理 | `04` `08` | `03` | `09` `10` | `sdkwork-notes-pc-react/packages/sdkwork-notes-auth` `sdkwork-notes-pc-react/packages/sdkwork-notes-core` `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop` `sdkwork-notes-pc-react/scripts` | 会话存储迁移方案、配置分层清单、敏感项治理规则 | token 迁移验证、配置 contract test、安全回归清单 | `docs/架构/04` `08` `09` |
| `CAP-03` | 工作区初始化编排与数据访问边界 | `03` `05` `06` | `04` | `05` `06` | `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` `sdkwork-notes-pc-react/packages/sdkwork-notes-core` | 初始化时序图、repository/store 边界表、首屏策略 | 首屏加载基准、集成测试、异常恢复冒烟 | `docs/架构/03` `05` `06` `09` |
| `CAP-04` | 编辑器可靠性与自动保存闭环 | `05` `06` `07` | `05` | `04` `06` `10` | `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` | 编辑器事件流设计、保存状态机、失败恢复图 | 编辑保存回归、崩溃恢复测试、草稿一致性检查 | `docs/架构/05` `06` `07` `09` |
| `CAP-05` | 本地存储层与离线草稿能力 | `05` `07` | `06` | `04` `05` `08` `12` | `sdkwork-notes-pc-react/packages/sdkwork-notes-local` `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop` | 本地数据模型、存储权威源定义、迁移策略 | schema 测试、离线冒烟、崩溃恢复、兼容性测试 | `docs/架构/05` `07` `09` |
| `CAP-06` | 搜索索引与统一检索入口 | `06` `07` | `07` | `06` `10` `11` | `sdkwork-notes-pc-react/packages/sdkwork-notes-search` `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` | 索引模型、构建/更新策略、命令面板统一语义 | 搜索准确性测试、索引构建基准、10k 笔记查询性能 | `docs/架构/06` `07` `09` |
| `CAP-07` | 同步队列、冲突恢复与最终一致性 | `05` `06` `07` | `08` | `06` `07` `12` | `sdkwork-notes-pc-react/packages/sdkwork-notes-sync` `sdkwork-notes-pc-react/packages/sdkwork-notes-local` `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` | 同步状态机、冲突分类、重试/回放规则 | 同步集成测试、冲突场景脚本、离在线切换验证 | `docs/架构/05` `06` `07` `09` |
| `CAP-08` | 桌面壳能力与可信发布链 | `04` `08` | `09` | `03` `10` `13` | `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop` `.github/workflows` `sdkwork-notes-pc-react/scripts` | 桌面能力矩阵、发布链设计、签名/校验流程 | 桌面 contract test、bundle 验证、release dry-run | `docs/架构/04` `08` `09` |
| `CAP-09` | 测试体系与质量门禁 | `08` `09` | `10` | `03` `05` `07` `08` `09` `11` `12` | `sdkwork-notes-pc-react` 全仓测试目录 `.github/workflows` `sdkwork-notes-pc-react/scripts` | 测试矩阵、质量门禁清单、基准脚本 | 单测/集成/E2E/视觉/性能/安全适用项 | `docs/架构/08` `09` `10` |
| `CAP-10` | 大规模工作区性能治理 | `07` `09` | `11` | `04` `05` `07` `10` | `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` `sdkwork-notes-pc-react/packages/sdkwork-notes-search` `sdkwork-notes-pc-react/packages/sdkwork-notes-shell` | 性能画像、热点列表、优化路线图 | 性能基准、10k+ 数据集回归、启动/搜索/滚动指标 | `docs/架构/07` `09` `10` |
| `CAP-11` | 版本历史与恢复能力 | `05` `06` `07` | `12` | `06` `08` `10` | `sdkwork-notes-pc-react/packages/sdkwork-notes-history` `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` `sdkwork-notes-pc-react/packages/sdkwork-notes-local` | revision 模型、保留策略、恢复交互设计 | 历史恢复测试、diff 正确性验证、回滚演练 | `docs/架构/05` `06` `07` `09` |
| `CAP-12` | 发布就绪与持续迭代闭环 | `08` `09` `10` | `13` | `00-12` | `docs/架构` `docs/step` `docs/review` `.github/workflows` `sdkwork-notes-pc-react/scripts` | 总体验收结论、能力兑现清单、下一轮 backlog | 波次验收记录、发布候选清单、回写审计结果 | `docs/架构/README` `09` `10` |

### 3.1 Step 完成时必须兑现的能力切片

该表用于回答一个更严格的问题：不是“这个 Step 涉及哪些能力”，而是“这个 Step 完成时，必须把哪一段能力真正做成闭环”。

| Step | 必须兑现的能力切片 | 闭环判定口径 |
| --- | --- | --- |
| `00` | 执行门禁、证据、回滚、检查点统一口径 | 后续 Step 是否已无法绕开统一门禁 |
| `01` | 现状基线和差距矩阵 | 后续实施是否已不再基于猜测 |
| `02` | 共享壳层和能力包落点 | 新能力是否已有稳定目录归属 |
| `03` | 会话安全和配置治理 | 敏感会话与配置边界是否已冻结 |
| `04` | 初始化链与数据访问边界 | 本地/搜索/同步是否可在不重写页面的前提下接入 |
| `05` | 编辑器保存可靠性 | 是否具备失败恢复和状态可见性 |
| `06` | 本地存储与离线草稿 | 是否具备权威源、schema 和恢复闭环 |
| `07` | 搜索索引与统一检索 | 搜索、命令面板是否已共享同一索引与查询语义 |
| `08` | 同步队列与冲突恢复 | 本地写入与远端同步是否已解耦为状态机 |
| `09` | 桌面壳与可信发布链 | 是否具备 runtime 治理与可审计交付能力 |
| `10` | 高层自动化门禁 | 主验证责任是否已转交给自动化门禁 |
| `11` | 10k+ 性能治理 | 是否具备量化基线、热点治理和回归机制 |
| `12` | 版本历史与恢复 | revision 和恢复是否都可真实使用 |
| `13` | 发布结论与下一轮输入 | 是否具备 go/no-go 和能力兑现全景结论 |

## 4. Step 到代码目录主责矩阵

| Step | 主写入目录 | 严禁直接主写入的区域 | 说明 |
| --- | --- | --- | --- |
| `00` | `docs/step` `docs/review` | 业务代码 | 只做执行口径冻结，不改实现 |
| `01` | `docs/step` `docs/review` | 业务代码 | 允许补审计脚本，不允许顺手重构 |
| `02` | `sdkwork-notes-pc-react/packages/sdkwork-notes-shell` `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop` `sdkwork-notes-pc-react/package.json` `pnpm-workspace` 相关配置 | `notes-notes` 内具体业务行为 | 先收敛骨架，再允许后续能力进入 |
| `03` | `sdkwork-notes-pc-react/packages/sdkwork-notes-auth` `sdkwork-notes-pc-react/packages/sdkwork-notes-core` `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop` `sdkwork-notes-pc-react/scripts` | 编辑器/搜索/同步逻辑 | 安全与配置是基础设施，不应夹带业务重构 |
| `04` | `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` `sdkwork-notes-pc-react/packages/sdkwork-notes-core` | 发布链、视觉规范 | 只处理工作区初始化与数据边界 |
| `05` | `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` | 发布链、安全存储实现 | 只处理编辑可靠性 |
| `06` | `sdkwork-notes-pc-react/packages/sdkwork-notes-local` `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` | 远端接口契约定义 | 本地层先完成权威源治理 |
| `07` | `sdkwork-notes-pc-react/packages/sdkwork-notes-search` `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` | 同步冲突恢复实现 | 搜索先建立索引与查询语义 |
| `08` | `sdkwork-notes-pc-react/packages/sdkwork-notes-sync` `sdkwork-notes-pc-react/packages/sdkwork-notes-local` | 发布链、签名工具 | 同步只解决队列、重试、冲突 |
| `09` | `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop` `.github/workflows` `sdkwork-notes-pc-react/scripts` | 编辑器与本地数据模型 | 桌面壳与发布链应独立推进 |
| `10` | 测试目录、脚本、workflow、`docs/review` | 大规模业务改造 | 测试是门禁，不是顺手改功能 |
| `11` | `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` `sdkwork-notes-pc-react/packages/sdkwork-notes-search` | 会话安全基础设施 | 优化围绕性能热点，不重开安全工程 |
| `12` | `sdkwork-notes-pc-react/packages/sdkwork-notes-history` `sdkwork-notes-pc-react/packages/sdkwork-notes-local` `sdkwork-notes-pc-react/packages/sdkwork-notes-notes` | 发布链/鉴权实现 | 聚焦版本与恢复，不扩散范围 |
| `13` | `docs/架构` `docs/step` `docs/review` `.github/workflows` | 任何新的主功能 | 只做发布就绪、验收闭环、下一轮输入 |

## 5. 证据分层标准

### 5.1 设计类证据

- 方案文档或章节回写
- 模块边界表
- 状态机、时序图、数据流图
- 风险与回滚策略

### 5.2 实施类证据

- 改动目录清单
- 关键 PR/变更记录
- 脚本或 workflow 更新
- 迁移脚本、兼容适配或 facade 方案

### 5.3 测试类证据

- 单元测试
- 集成测试
- E2E / 桌面冒烟
- 性能基准
- 安全回归清单

### 5.4 结果验证类证据

- 指标快照
- 关键场景录屏/截图说明
- 验证命令与输出摘要
- `docs/review/` 审计与复盘结论

## 6. 能力归属冲突处理规则

出现以下情况时，必须先回到本表修正归属，再继续推进：

- 两个 Step 同时声称“拥有”同一个能力的最终解释权
- 一个能力被拆散到多个模块，但没有统一 Owner
- 协同 Step 直接改写主 Step 已冻结的权威模型
- 测试证据只覆盖局部实现，无法证明能力真正落地

冲突处理顺序：

1. 以 `docs/架构/` 为第一权威
2. 以本表的主 Step 归属为执行权威
3. 若仍冲突，先在 `docs/review/` 输出决策记录再开工

## 7. 执行前快速核对清单

- 本轮目标能力是否能在本表中找到
- 本轮 Step 是否是该能力的主责 Step 或经授权协同 Step
- 主写入目录是否明确且可控
- 设计、实施、测试、验证四类证据是否已定义
- 完成后要回写的架构文档是否已明确

## 8. 结论

本矩阵的作用不是增加流程负担，而是避免以下三类高成本错误：

- 做了很多代码，却没有兑现任何架构能力
- 看似完成了一个 Step，实际没有形成可验证闭环
- 多个并行执行车道互相覆盖、重复建设或责任不清

后续所有 Step 的启动、复盘和验收，都应先经过本矩阵校验。

