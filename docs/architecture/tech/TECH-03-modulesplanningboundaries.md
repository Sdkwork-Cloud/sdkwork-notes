> Migrated from `docs/架构/03-模块规划与边界.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 03. 模块规划与边界

## 3.1 文档目标

本文用于把当前代码仓库中的模块边界明确下来，并为后续扩展出一套不会失控的模块规划标准。

核心问题是：

- 当前每个包负责什么。
- 包之间允许如何依赖。
- 组件和服务应该按什么层级拆分。
- 为了达到行业领先水平，还需要预留哪些新模块。

---

## 3.2 当前模块地图

当前主工程 `sdkwork-notes-pc-react` 采用 package workspace 的多包结构。

### 3.2.1 当前包职责矩阵

| 包名 | 角色 | 主要职责 | 当前评价 |
|---|---|---|---|
| `@sdkwork/notes-pc-shell` | 应用壳 | 路由、布局、Provider、主题/语言集成 | 设计清晰 |
| `@sdkwork/notes-pc-auth` | 认证域 | 认证页面、认证控制器、认证主题、OAuth/二维码登录编排、app-sdk 认证桥接 | 边界良好 |
| `@sdkwork/notes-pc-notes` | 笔记域 | 工作区页面、编辑器、侧栏、检视器、命令面板、仓储、选择器、布局状态 | 核心域，需持续拆细 |
| `@sdkwork/notes-pc-user` | 用户域 | 账户页、资料与设置 | 边界清楚 |
| `@sdkwork/notes-pc-core` | 共享核心 | app-sdk 客户端、会话编排、运行时配置解析、用户服务、应用状态 | 核心基础层 |
| `@sdkwork/notes-pc-commons` | 共享组件/工具 | Button、Dialog、SurfaceCard、文本规范化、服务适配器结果 | 合理 |
| `@sdkwork/notes-pc-i18n` | 国际化 | 语言资源、i18n 初始化 | 合理 |
| `@sdkwork/notes-pc-types` | 类型层 | Note、Folder、Result、App 类型定义 | 合理 |
| `@sdkwork/notes-pc-desktop` | 桌面壳 | Tauri 运行时、桥接、托盘、窗口控制、启动壳、启动外观快照、运行时信息投影、原生会话桥接 | 边界清楚 |
| `@sdkwork/notes-pc-local` | 本地能力骨架 | 本地权威副本、草稿恢复、未来本地数据库适配入口 | Step 02 已建骨架，待 Step 06 兑现能力 |
| `@sdkwork/notes-pc-search` | 搜索能力骨架 | 索引模型、统一查询语义、命令面板候选源入口 | Step 02 已建骨架，待 Step 07 兑现能力 |
| `@sdkwork/notes-pc-sync` | 同步能力骨架 | 同步队列、状态机、重试与冲突恢复入口 | Step 02 已建骨架，待 Step 08 兑现能力 |
| `@sdkwork/notes-pc-observability` | 观测能力骨架 | 日志、指标、事件封装入口 | Step 02 已建骨架，待 Step 10/11 继续深化 |
| `@sdkwork/notes-pc-updater` | 更新能力骨架 | 桌面更新渠道、版本清单与更新策略入口 | Step 02 已建骨架，待 Step 09 兑现能力 |

### 3.2.2 当前包边界判断

当前包边界已经满足“高内聚、低耦合”的基本要求：

- `shell` 不直接持有具体业务规则，只做编排。
- `notes` 是主要业务域，不应再让 `shell` 吞掉笔记逻辑。
- `desktop` 将平台细节封装成桥接 API，没有把 Tauri 细节暴露到业务组件。
- `core` 和 `commons` 分别承担“核心运行时能力”和“通用 UI/工具”的不同职责。
- `notes-notes` 当前已经把拖拽规则、工作区选择器、布局状态等从页面拆出，这是健康信号。

这套边界是正确的，应继续坚持。

### 3.2.3 Step 02 回写结论

截至 `2026-04-07`，当前包边界已不再只停留在“未来设想”：

- `notes-local / notes-search / notes-sync / notes-observability / notes-updater` 已经成为真实 workspace 包
- `notes-shell` 中新增了 `packageBoundaries.ts`，将共享壳、基础包、领域包与未来能力包的边界冻结为代码级事实
- 当前这些新包仍是“骨架包”，不应被误判为能力已实现

这意味着后续演进可以直接在既定包落点内推进，而不需要在实现时重新讨论命名和目录归属。

---

## 3.3 当前依赖方向

### 3.3.1 推荐的依赖方向

```text
web entry
  -> shell
    -> auth / notes / user
      -> core / commons / i18n / types

desktop entry
  -> desktop
    -> runtime / tauri bridge
    -> shell
      -> auth / notes / user
        -> core / commons / i18n / types
```

### 3.3.2 当前依赖规则

| 规则 | 当前情况 | 结论 |
|---|---|---|
| 业务域包不能互相绕过壳层直接耦合复杂内部实现 | 基本满足 | 正确 |
| 桌面包不能成为业务域的直接上帝模块 | 当前满足 | 正确 |
| 页面组件不应直接调用裸 SDK | 当前主要通过 `core/repository/service` 收敛 | 正确 |
| 类型与基础组件应保持无业务依赖 | 当前满足 | 正确 |
| Web 与 Desktop 不应分叉两套业务壳 | 当前通过共享 `AppRoot` 满足 | 正确 |

---

## 3.4 组件化设计层级

为提升可维护性，建议统一采用五级组件层次。

### L1 基础原子组件

- `Button`
- `Dialog`
- `SurfaceCard`

要求：

- 不含业务语义。
- 不依赖具体领域状态。
- 可以跨域复用。

### L2 组合型通用组件

- 搜索框、空状态骨架、统计卡、命令面板基础列表等。

要求：

- 允许封装通用交互模式。
- 仍不持有具体业务规则。

### L3 领域组件

- `NotesSidebar`
- `NoteEditorPane`
- `NoteInspectorPanel`
- `NoteCommandPalette`
- `AuthPage`
- `AccountPage`

要求：

- 服务于单一业务域。
- 不直接承担全局路由或平台职责。

### L4 页面级编排组件

- `NotesWorkspacePage`
- `MainLayout`

要求：

- 负责把多个领域组件编排成完整页面。
- 不应堆积过多底层规则。

### L5 平台壳组件

- `DesktopBootstrapApp`
- `DesktopProviders`
- `ShellLayout`
- `AppHeader`
- `DesktopWindowControls`

要求：

- 负责运行时环境、平台能力、应用骨架。
- 不承担细粒度领域判断。

---

## 3.5 当前组件化优缺点

### 优点

- 共享组件层已经形成独立包，方向正确。
- 笔记工作区拆成侧栏、编辑器、检视器三个主域组件，结构明确。
- 应用壳和桌面壳分别独立，避免了平台逻辑侵入业务。

### 短板

- `NotesWorkspacePage.tsx` 仍承担较多编排与交互职责，未来应继续下沉命令、选择器和交互控制器。
- `notes-notes` 包内虽然已经出现 `noteSidebarDragDrop.ts`、`NoteCommandPalette.tsx` 等拆分信号，但仍有继续细分为 `editor / navigation / workspace / search` 子域的空间。
- 当前缺少正式的组件资产目录、视觉规范和组件准入流程。

---

## 3.6 未来目标模块规划

若要达到行业领先水平，建议在现有结构基础上演进出以下模块。

| 目标模块 | 建议形态 | 主要职责 |
|---|---|---|
| `notes-sync` | 新包/新领域层 | 增量同步、队列、冲突合并、同步状态 |
| `notes-search` | 新包 | 全文索引、命令搜索、快速跳转、相关性排序 |
| `notes-editor-engine` | 新包 | 编辑器 schema、扩展、输入规则、版本兼容 |
| `notes-ai` | 新包 | AI 摘要、问答、结构整理、智能检索 |
| `notes-collab` | 新包 | 协作会话、评论、权限、共享链接 |
| `notes-observability` | 新包或 shared 基础能力 | 埋点、日志、错误、性能指标 |
| `notes-updater` | 桌面子模块 | 自动更新、渠道切换、版本治理 |
| `notes-plugin-runtime` | 平台能力 | 插件注册、隔离沙箱、扩展 API |

这些模块不要求一次性全部实现，但必须在当前文档中明确为“目标边界”，以避免未来继续把所有能力堆进 `notes-notes`。其中 `notes-local / notes-search / notes-sync / notes-observability / notes-updater` 已在 Step 02 中完成最小工程骨架预埋。

---

## 3.7 模块边界红线

以下是必须长期坚持的架构红线：

1. `notes-shell` 不直接实现笔记业务规则。
2. `notes-desktop` 不直接访问笔记仓储和用户仓储。
3. 页面组件不得直接依赖裸 `@sdkwork/app-sdk` 客户端。
4. 所有跨包公共能力必须通过 `index.ts` 明确导出。
5. 新增业务包必须定义职责、依赖方向、Owner 和测试边界。

---

## 3.8 模块设计评估标准

| 标准项 | 达标要求 |
|---|---|
| 单一职责 | 一个包/模块只承担一个主要领域责任 |
| 依赖清晰 | 依赖方向单向、可解释、可审查 |
| 可替换性 | 仓储、服务、平台适配器可通过适配层替换 |
| 复用性 | 通用能力下沉到 shared 层，而不是复制粘贴 |
| 可测试性 | 模块可单独测试，不依赖复杂外部环境 |
| 可演进性 | 新能力加入时无需改动大量历史模块 |

---

## 3.9 当前成熟度评估

| 维度 | 评分（10 分） | 说明 |
|---|---:|---|
| 模块职责清晰度 | 8.8 | 当前包职责区分较好 |
| 依赖方向健康度 | 8.6 | 总体健康，适合持续演进 |
| 组件层级清晰度 | 8.1 | 主层级明确，但规范还未制度化 |
| 未来可扩展性 | 8.4 | 具备继续演进的良好基础 |

**结论：模块规划已经达到“优秀可维护”的水平，但要成为行业领先，还需要把未来模块演进路径和组件治理制度显式化。**

