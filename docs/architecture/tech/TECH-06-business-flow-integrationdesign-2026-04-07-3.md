> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-写路径协调补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06 补充 - 写路径即时状态协调 - 2026-04-07

## 1. 补充背景

基于当前笔记应用工作区实现，Step 04 新增一层“写路径即时状态协调”服务边界，用于降低工作区 store 对写后状态拼装的直接耦合。该补充文档用于对齐主架构文档 `06-业务流程-应用接口与集成设计.md`，描述本轮新增的真实实现。

## 2. 新增架构边界

新增服务：

- `packages/sdkwork-notes-notes/src/services/noteWorkspaceWriteCoordinator.ts`

职责限定为：

- 输入：当前工作区状态切片 + 后端写入成功结果
- 输出：下一工作区状态切片
- 不负责：API 调用、页面交互、Zustand 管理、副作用调度

## 3. 对应业务流程

### 3.1 创建笔记

```text
UI createNote
  -> store.createNote()
  -> workspaceService.save()
  -> workspaceService.findById()
  -> planCreatedNoteState()
  -> store.set(nextState)
```

### 3.2 创建文件夹

```text
UI createFolder
  -> store.createFolder()
  -> workspaceService.createFolder()
  -> planCreatedFolderState()
  -> store.set(nextState)
```

### 3.3 重命名文件夹

```text
UI renameFolder
  -> store.renameFolder()
  -> workspaceService.renameFolder()
  -> planRenamedFolderState()
  -> store.set(nextState)
```

### 3.4 移动笔记

```text
UI moveNote
  -> store.moveNote()
  -> workspaceService.moveNote()
  -> planMovedNoteState()
  -> store.set(nextState)
```

## 4. 已覆盖的状态规则

- `activeNote / activeNoteId`
- `notes / trashedNotes`
- `selectedFolderId`
- `expandedFolderIds`
- `activeView`
- 关联 `parentId / updatedAt`

## 5. 评估标准

本层能力是否达标，以以下标准判断：

- 规则集中度：同类写路径状态规则是否集中到单一服务中
- 可验证性：是否存在独立 Node contract 覆盖核心路径
- 可替换性：store 替换为其他状态管理时，该层是否仍可复用
- 可扩展性：新增写路径动作时，是否可沿用同一模式扩展
- 回归风险：写路径状态变更是否能在不依赖 UI 的前提下被门禁发现

## 6. 当前结论

该层已达到“稳定纯服务边界 + 独立合同门禁”的要求，是工作区状态流继续收敛的重要中间层，但当前仍不足以关闭 Step 04。后续必须继续完成：

1. 页面 action dispatch 服务化
2. repository 读策略抽象化

