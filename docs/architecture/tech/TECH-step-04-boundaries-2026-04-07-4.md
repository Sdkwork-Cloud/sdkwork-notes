> Migrated from `docs/review/step-04-数据访问边界决议-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 04 数据访问边界决议

- 日期：`2026-04-07`
- Step：`04-工作区数据访问与初始化链重构`
- 当前阶段：`第二轮边界冻结`

## 1. 决议目标

将工作区主链路中的数据访问和视图派生职责，从“逻辑上分层”推进为“代码级可验证分层”，避免后续本地副本、搜索索引和同步状态机继续直接耦合到 store 或 page。

## 2. 当前冻结边界

### 2.1 Repository

- 责任：
  - 远端 SDK 调用
  - DTO 映射
  - 工作区快照聚合
  - 读写命令执行
- 当前文件：
  - `packages/sdkwork-notes-notes/src/repository/noteRepository.ts`
- 当前说明：
  - repository 仍以远端分页扫描为主
  - 目前尚未抽出本地副本 read-through / write-through 接口

### 2.2 Workspace Orchestrator

- 责任：
  - 工作区初始化排序
  - 初始 active note 决议
  - 详情补全
  - 回收站摘要回退
- 当前文件：
  - `packages/sdkwork-notes-notes/src/services/noteWorkspaceOrchestrator.ts`
- 当前说明：
  - 初始化链的第一批编排逻辑已从 store 中迁出
  - `refresh / list source / selection fallback` 仍未全部收口

### 2.3 Selectors

- 责任：
  - 列表过滤
  - 文件夹树平铺
  - 文档大纲、任务进度、字数、阅读时长等派生信息
  - 工作区页面视图模型组装
  - 命令面板条目模型组装
- 当前文件：
  - `packages/sdkwork-notes-notes/src/services/noteWorkspaceSelectors.ts`
  - `packages/sdkwork-notes-notes/src/services/noteWorkspaceCommandPaletteModel.ts`
- 当前说明：
  - Step 04 第二轮已新增 `buildNotesWorkspaceViewModel()`
  - Step 04 第三轮已新增 `buildNoteWorkspaceCommandPaletteItems()`
  - selector 现已统一产出：
    - `visibleNotes`
    - `counts`
    - `activeOutline`
    - `activeTaskProgress`
    - `activeWordCount`
    - `activeNoteFolderName`
    - `activeNoteUpdatedLabel`
    - 命令面板 actions / views / folders / notes descriptors

### 2.4 Store

- 责任：
  - UI 状态
  - 保存状态机
  - 交互命令编排
  - 应用 orchestration / selector 结果并更新本地状态
- 当前文件：
  - `packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
- 当前说明：
  - store 不再承担初始化链的完整决策
  - 但仍然承载大量写路径和刷新路径编排，尚未完全瘦身

### 2.5 Page

- 责任：
  - 事件绑定
  - 组件拼装
  - 命令面板与快捷键编排
  - 布局与交互渲染
- 当前文件：
  - `packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx`
- 当前说明：
  - 页面已不再直接组合工作区视图派生状态
  - 页面已不再直接装配命令面板条目模型
  - 页面当前消费单一 `workspaceViewModel`
  - 页面当前主要保留布局渲染、icon 映射与动作分发，后续仍需继续压缩快捷键与写路径编排复杂度

## 3. 评估标准

| 评估项 | 达标标准 | 当前结论 |
| --- | --- | --- |
| 远端访问集中 | page 不直接发起远端访问 | 达标 |
| 初始化编排独立 | 初始化链不再完全内嵌在 store | 达标 |
| 视图派生纯函数化 | 页面视图派生与命令面板条目模型通过纯函数统一产出 | 达标 |
| 状态编排可测试 | 边界规则具备合同测试或稳定验证入口 | 达标 |
| 后续可扩展性 | 本地副本 / 搜索 / 同步可找到清晰接入点 | 基本达标 |

## 4. 当前仍未冻结的边界

- `refresh / list source / selection fallback` 仍未全部进入 orchestrator。
- repository 还没有为离线副本和增量加载预留专门接口。
- page 层虽然已移出视图派生与命令面板条目组装，但快捷键编排和动作分发仍偏重。

## 5. 下一轮边界推进建议

- 把刷新策略、数据源选择策略继续从 store 下沉。
- 为 Step 06/07/08 设计显式 `workspace data source` 接口，承接本地副本和索引。
- 继续收敛 page 责任，优先抽离快捷键与主工作区写路径的事件编排边界。

