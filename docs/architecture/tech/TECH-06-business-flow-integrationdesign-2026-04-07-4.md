> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-创建文件夹写路径补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06-业务流程-应用接口与集成设计-创建文件夹写路径补充

- 日期：`2026-04-07`
- 关联 Step：`Step 04`
- 增量主题：`createFolder 写路径编排从 Store 下沉至 write coordinator`

## 1. 背景

在本轮之前，`useNotesWorkspaceStore.ts` 的 `createFolder()` 仍同时负责：

1. 远程创建调用。
2. 创建失败处理。
3. `planCreatedFolderState()` 状态计划拼装。

这意味着 Store 继续承担流程编排职责，不符合 Step 04 对“写路径边界显式化”的要求。

## 2. 本轮边界调整

继续扩展 `noteWorkspaceWriteCoordinator.ts`，新增：

- `NoteWorkspaceCreateFolderStateResult`
- `createFolderState()`

新的调用关系：

```text
UI / Store
  -> useNotesWorkspaceStore.createFolder()
    -> createNotesWorkspaceWriteCoordinator.createFolderState()
      -> workspaceService.createFolder()
      -> planCreatedFolderState()
    -> store 写回结果
```

## 3. 设计收益

### 3.1 Store 继续瘦身

Store 只负责：

1. 调用 coordinator。
2. 写回 `folders / expandedFolderIds / errorMessage`。
3. 对外暴露结果。

### 3.2 Create 系列边界统一

在本轮之后：

1. `createNote`
2. `createFolder`

都通过 `createNotesWorkspaceWriteCoordinator()` 统一编排，为后续 `renameFolder / moveNote` 下沉打样。

### 3.3 契约覆盖升级

`workspace-write-path.contract.test.mjs` 不再只覆盖状态计划函数，也开始稳定覆盖 `createFolder` 的远程调用协作边界。

## 4. 评估标准

本轮增量达标的判断标准：

1. Store 不再直接调用 `workspaceService.createFolder()`。
2. Store 不再直接内联 `planCreatedFolderState()`。
3. `createFolderState()` 成功时必须返回：
   - `createdFolderId`
   - `folders`
   - `expandedFolderIds`
4. Node contract 与 TypeScript typecheck 必须通过。

## 5. 当前结论

本轮后，Step 04 的 create 系列写路径边界更加统一，但 Step 04 仍停留在 `L3`。接下来最合理的继续顺序是：

1. `renameFolder`
2. `moveNote`
3. repository 策略边界补强

