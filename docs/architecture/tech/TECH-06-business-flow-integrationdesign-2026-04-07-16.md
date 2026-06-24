> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-重命名文件夹写路径补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06-业务流程-应用接口与集成设计-重命名文件夹写路径补充-2026-04-07

## 1. 变更背景

在本轮增量之前，`renameFolder()` 仍由 store 直接承担以下职责：

1. 调用 `workspaceService.renameFolder()`。
2. 处理返回 id 与原始 id 的归一化。
3. 调用 `planRenamedFolderState()` 拼装 folders、notes、trashedNotes、activeNote、selectedFolderId、expandedFolderIds。

该模式的问题在于：状态容器直接承接远程 mutation 编排，导致 Step 04 的边界收敛不完整，也不利于后续继续将 `moveNote` 等写路径按统一模式下沉。

## 2. 新的接口设计

本轮在 `noteWorkspaceWriteCoordinator.ts` 中为 `createNotesWorkspaceWriteCoordinator()` 增加以下能力：

### 2.1 依赖注入

新增依赖：

```ts
renameFolder: (id: string, newName: string) => Promise<ServiceResult<string>>;
```

### 2.2 返回类型

新增结果类型：

```ts
type NoteWorkspaceRenameFolderStateResult =
  | ({ resolvedFolderId: string; errorMessage: null } & NoteWorkspaceRenameFolderPlan)
  | { status: 'error'; resolvedFolderId: string; errorMessage: string };
```

设计意图：

1. `apply / missing` 继续复用 `planRenamedFolderState()` 的业务语义。
2. `error` 显式表达远程调用失败。
3. `resolvedFolderId` 统一暴露给 store，避免 store 自己重复处理“接口返回 id 为空时回退原 id”的逻辑。

### 2.3 写路径编排入口

新增入口：

```ts
renameFolderState(options)
```

输入职责：

1. 接收当前 folders、notes、trashedNotes、activeNote、expandedFolderIds、selectedFolderId 的快照。
2. 接收 `folderId` 与 `requestedName`。

输出职责：

1. 远程重命名成功时，返回可直接消费的 rename plan。
2. 远程失败时，返回 `status: 'error'` 与统一错误消息。

## 3. 集成流程

新的调用时序如下：

1. `useNotesWorkspaceStore.renameFolder()` 收集当前状态快照。
2. Store 调用 `workspaceWriteCoordinator.renameFolderState()`。
3. Coordinator 内部调用 `workspaceService.renameFolder()`。
4. Coordinator 对返回 id 做归一化。
5. Coordinator 调用 `planRenamedFolderState()` 生成目标状态计划。
6. Store 仅根据 `apply / error / missing` 结果执行状态应用或错误透出。

## 4. 设计收益

### 4.1 高内聚

与 rename mutation 直接相关的远程调用、返回值归一化和状态计划拼装都收敛在 write coordinator 中。

### 4.2 低耦合

Store 不再依赖“rename service 的返回规则 + rename plan 的拼装细节”的组合知识，只依赖一个显式结果对象。

### 4.3 易扩展

`renameFolderState()` 为后续 `moveNote` 下沉提供了直接模板，写路径编排能力开始形成一致的接口族。

### 4.4 易测试

通过 `workspace-write-path.contract.test.mjs`，可以在不启动 Vitest 页面环境的情况下独立验证写路径协作链。

## 5. 评估标准

本轮架构补充的验收标准如下：

1. `renameFolder()` 的服务调用和状态拼装不再直接留在 store。
2. `resolvedFolderId`、`selectedFolderId`、`expandedFolderIds`、folder descendant、note parent、trash note parent、active note parent 的一致性必须被合同锁定。
3. coordinator 的引入不能破坏现有 `pnpm.cmd --filter @sdkwork/notes-notes typecheck` 与 `pnpm.cmd typecheck`。
4. 本轮不能虚报 Step 完成度，必须在文档中明确 Step 04 仍然停留在 `L3`。

## 6. 当前结论

本轮后，write coordinator 已覆盖：

1. `createNote`
2. `createFolder`
3. `renameFolder`

因此 Step 04 的写路径收口已经进入最后一段明显残留阶段，当前下一优先级明确为 `moveNote`。

