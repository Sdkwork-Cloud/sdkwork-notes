> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-创建笔记写路径补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06-业务流程-应用接口与集成设计-创建笔记写路径补充

- 日期：`2026-04-07`
- 关联 Step：`Step 04`
- 增量主题：`createNote 写路径编排从 Store 下沉至 service/coordinator`

## 1. 背景

在此前版本中，`useNotesWorkspaceStore.ts` 的 `createNote()` 同时承担以下职责：

1. 创建请求发起。
2. 创建后详情回填。
3. 状态计划生成。
4. 错误结果落盘。

这使得 Store 既是状态容器，又是写路径流程编排器，违背 Step 04 “高频运行时与主链路编排边界显式化”的目标。

## 2. 本轮边界调整

新增边界：

- `packages/sdkwork-notes-notes/src/services/noteWorkspaceWriteCoordinator.ts`
  - `createNotesWorkspaceWriteCoordinator()`
  - `createNoteState()`

Store 收敛后的职责：

1. 脏草稿前置守卫。
2. 调用 coordinator。
3. 将 coordinator 结果回写到 store state。
4. 维护 `saveState / errorMessage`。

Coordinator 新职责：

1. 执行 `saveNote`。
2. 执行 `findNoteDetail`。
3. 统一处理失败返回。
4. 统一拼装 `planCreatedNoteState()`。

## 3. 目标流程

```text
UI / Page Runtime
  -> useNotesWorkspaceStore.createNote()
    -> persistUnsavedActiveNoteIfNeeded()
    -> createNotesWorkspaceWriteCoordinator.createNoteState()
      -> workspaceService.save()
      -> workspaceService.findById()
      -> planCreatedNoteState()
    -> store 回写结果
```

## 4. 设计价值

### 4.1 高内聚

`createNote` 写路径的远程调用顺序与结果拼装聚拢到同一 coordinator 中，避免 Store 内部继续膨胀。

### 4.2 低耦合

Store 不再显式耦合“创建后一定再查详情”的协作细节，只消费抽象后的结果对象。

### 4.3 易扩展

后续可以沿用同一模式继续收敛：

1. `createFolder`
2. `renameFolder`
3. `moveNote`

从而把 Step 04 残余的写路径编排逐步迁入统一的 write coordinator。

### 4.4 可测试

`workspace-write-path.contract.test.mjs` 现在已覆盖：

1. 纯状态规划。
2. `createNote` 写路径的“持久化 -> 回填 -> 状态计划”协作链。

这意味着写路径测试从“静态状态规则”升级为“真实协作边界 contract”。

## 5. 评估标准

本增量是否达标，按以下标准判定：

### 5.1 边界清晰度

- Store 不再内联 `createNote` 的持久化与详情回填。
- 写路径协作入口统一为 `createNotesWorkspaceWriteCoordinator()`。

### 5.2 结果一致性

- 创建成功后必须返回正确的：
  - `createdNoteId`
  - `activeNoteId`
  - `activeNote`
  - `selectedFolderId`
  - `expandedFolderIds`
  - `notes`
  - `trashedNotes`

### 5.3 错误语义完整性

- 持久化失败必须返回明确错误信息。
- 详情回填缺失时必须存在回退路径，避免 UI 进入不完整态。

### 5.4 契约可验证性

- Node contract 必须能独立验证写路径编排。
- TypeScript typecheck 必须通过。

## 6. 当前结论

本轮后，`createNote` 已不再是 Step 04 的核心残留点之一，但 Step 04 仍未达到 `L4`。剩余重点转移为：

1. `createFolder / renameFolder / moveNote` 写路径继续下沉。
2. repository 策略边界补强。
3. 页面容器胶水继续压缩。

