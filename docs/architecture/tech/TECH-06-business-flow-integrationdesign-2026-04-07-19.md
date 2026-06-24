> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-页面命令执行补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 页面命令执行补充设计

- 日期：2026-04-07
- 适用 Step：04
- 文档类型：业务流程 / 应用接口与集成设计补充

## 1. 设计目标

为笔记工作区建立统一的页面命令执行边界，解决以下问题：

1. 快捷键、命令面板、确认对话框三类入口共享同一套执行语义
2. 页面组件不再直接持有大段命令分支逻辑
3. 页面命令执行能够脱离 React 运行时，独立进行纯契约测试
4. 后续新增页面命令时，优先扩展服务层而不是继续增厚页面层

## 2. 边界定义

### 2.1 输入边界

输入统一收敛为 `NotesWorkspacePageCommand`，来源包括：

- `resolveNotesWorkspaceHotkeyCommand()`
- `resolveNotesWorkspaceCommandPaletteCommand()`
- `resolveNotesWorkspaceDialogConfirmCommand()`

### 2.2 执行边界

执行统一收敛为：

- `executeNotesWorkspacePageCommand(command, dependencies)`

其设计原则如下：

- 命令对象只表达“做什么”
- 依赖对象只表达“怎么做”
- 页面组件负责把 React/store/router/DOM 行为注入为依赖
- 执行器只做命令到依赖回调的映射，不直接感知页面实现细节

## 3. 职责分配

### 3.1 页面层职责

- 保存 `searchInputRef`
- 读取 store / app store 状态
- 注入 `navigate`、`startTransition`、`setState` 等运行时依赖
- 维持 UI 展示与事件绑定

### 3.2 服务层职责

- 标准化页面命令协议
- 标准化页面命令执行入口
- 对搜索、视图、删除、导航、打开等命令进行统一分发

### 3.3 不允许继续放回页面层的逻辑

- 快捷键命令执行分支
- 命令面板 action 执行分支
- 确认对话框命令执行分支

## 4. 集成关系

页面命令执行链路收敛后，形成如下结构：

`UI Event -> Command Resolver -> Page Command Executor -> Injected Dependency -> Store/App/Router`

这条链路的价值在于：

- resolver 负责“解释事件”
- executor 负责“执行命令”
- dependency 负责“连接实际运行时”

三者职责清晰，避免页面组件同时承担解释器、执行器、集成器三种角色。

## 5. 评估标准

### 5.1 架构标准

- 页面组件不得再出现新的命令执行分发分支
- 新页面命令必须先扩展命令类型与执行器，再接入 UI
- 命令执行器不得直接引用 React Hook、DOM、router 实例

### 5.2 设计标准

- 命令协议必须具备可判定的离散类型
- 依赖注入接口必须最小化，不暴露无关上下文
- 搜索、视图、删除、导航等跨入口行为必须语义一致

### 5.3 测试标准

- 页面命令执行必须有独立契约测试
- 脚本聚合门禁必须纳入该契约
- 包级 typecheck 与根级 typecheck 必须同时通过

### 5.4 可扩展标准

- 后续新增页面命令时，不得要求大规模修改 `NotesWorkspacePage.tsx`
- 新增命令应支持通过注入新依赖或复用现有依赖完成扩展

## 6. 当前结论

页面命令执行边界已经建立，Step 04 的页面编排收敛进入可持续演进状态。但页面层仍有较重依赖装配逻辑，且 repository 读取策略边界尚未建立，因此整个 Step 04 仍判定为 `L3`，不能视为完成。

