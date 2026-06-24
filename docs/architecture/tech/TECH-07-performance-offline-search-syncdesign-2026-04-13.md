> Migrated from `docs/架构/07-性能-离线-搜索-同步设计-本地快照接口补充-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 07-性能-离线-搜索-同步设计-本地快照接口补充-2026-04-13

- 日期：`2026-04-13`
- 归属 Step：`Step 06 / CP06-3`

## 1. 目标

本轮不提前实现真实本地搜索或同步状态机，而是先把它们未来共同依赖的本地快照读边界冻结在 `@sdkwork/notes-local`。

## 2. 冻结的读边界

1. `createEmptyNotesLocalWorkspaceSnapshot()`
2. `resolveNotesLocalWorkspaceSnapshot()`
3. `createNotesLocalWorkspaceSnapshotReader()`
4. `notesLocalWorkspaceSnapshotReader`

## 3. 设计含义

1. 后续搜索与同步只需要消费标准化 `NotesLocalWorkspaceSnapshot`，避免重复解析 storage envelope。
2. legacy raw snapshot、current versioned envelope、loader failure 和 unknown version 都会在 reader / resolver 层统一收敛，避免把异常分支扩散到搜索与同步模块内部。
3. 本轮先冻结读侧 contract，不提前实现索引构建、增量同步或冲突恢复，保证 `Step 06` 仍然保持最小范围闭环。

## 4. 当前结论

1. `CP06-3 / 标准化本地快照接口 = L4`
2. `Step 06` 仍停留在 `L3`
3. 下一轮只剩 `CP06-4 / 启动恢复 smoke test` 作为 Step 06 收尾缺口

