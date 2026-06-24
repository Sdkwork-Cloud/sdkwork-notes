> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-页面依赖装配补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 页面依赖装配补充设计

- 日期：2026-04-07
- 适用 Step：04
- 文档类型：业务流程 / 应用接口与集成设计补充

## 1. 设计动机

在页面命令解析与执行已经抽离之后，`NotesWorkspacePage.tsx` 仍然直接内联构造命令依赖对象。该模式存在三个问题：

1. 页面文件仍需理解完整命令执行语义
2. 关键运行时映射缺少独立契约保护
3. 后续新增命令时，页面文件仍会持续膨胀

因此，本轮继续将“页面如何提供命令执行依赖”收敛为单独工厂。

## 2. 设计原则

### 2.1 页面只注入能力，不直接描述执行细节

页面层应只负责提供：

- 当前状态
- 路由能力
- store 能力
- DOM 能力
- transition 能力

命令依赖对象的具体组装语义，应由服务层统一完成。

### 2.2 运行时装配语义必须可测试

像 `changeView/openFolder/openNote` 这类行为虽然依赖运行时，但仍然应当具备纯契约校验能力。

## 3. 边界定义

### 3.1 输入边界

`NotesWorkspacePageCommandFactoryDependencies`

包含：

- `runTransition`
- `setCommandPaletteOpen`
- `createNote`
- `persistActiveNote`
- `focusSearch`
- `blurSearch`
- `setSearchQuery`
- `toggleSidebar`
- `setInspectorOpen`
- `navigateAccount`
- `setActiveView`
- `setSelectedFolderId`
- `selectNote`
- `clearTrash`
- `deleteNotePermanently`
- `deleteFolder`

### 3.2 输出边界

`NotesWorkspacePageCommandExecutorDependencies`

该输出直接供 `executeNotesWorkspacePageCommand()` 消费。

## 4. 集成价值

经过本轮收敛，页面命令链路形成如下结构：

`Page runtime -> Command dependency factory -> Page command executor -> Runtime callbacks`

这一结构的价值：

- 页面只保留运行时注入
- 工厂层统一定义命令依赖装配语义
- 执行器层统一定义命令分发语义

页面、工厂、执行器三层职责清晰。

## 5. 评估标准

### 5.1 设计标准

- 页面文件中不应继续出现大段命令依赖对象内联定义
- `changeView/openFolder/openNote` 的组合语义必须在工厂层唯一表达
- 页面命令工厂不得直接依赖 React Hook

### 5.2 测试标准

- 页面命令依赖工厂必须有独立 Node 契约
- 契约必须进入 `test:workspace:contracts`
- 包级与根级 typecheck 必须通过

### 5.3 扩展标准

- 新命令的依赖映射优先扩展工厂层
- 页面层不应再次承担执行依赖装配逻辑

## 6. 当前结论

页面依赖装配边界已经建立，Step 04 页面收敛质量继续提升。但页面仍保留多类运行时协调逻辑，尚未达到完全薄适配层状态，因此 Step 04 整体仍保持 `L3`。

