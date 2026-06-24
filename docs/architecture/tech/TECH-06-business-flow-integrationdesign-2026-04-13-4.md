> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-退出恢复检查点补充-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06-业务流程-应用接口与集成设计-退出恢复检查点补充

- 日期：`2026-04-13`
- 所属 Step：`Step 05`
- 所属波次：`Wave-B / 第三十轮推进`
- 本轮主题：`退出恢复检查点主链与 Step 06 接口冻结`

## 1. 设计目标

在不引入第二套本地草稿保存主链的前提下，为当前保存链补齐“异常退出前的最后保底恢复层”。该层必须满足：

1. 跟随现有 `save queue` 主链，而不是平行实现一套本地保存调度器。
2. 可以覆盖三类高风险场景：
   - 正常页面关闭
   - 页面进入隐藏状态
   - 未触发退出事件的异常退出 / 崩溃
3. 为 `Step 06` 提供稳定消费边界，而不是把恢复逻辑继续散落到页面组件内。

## 2. 边界划分

### 2.1 `@sdkwork/notes-local`

职责：

1. 作为本地恢复检查点的唯一存储边界。
2. 冻结 `NotesLocalStore` 与 `LocalDraftSnapshot` 契约。
3. 当前实现使用浏览器存储 + memory fallback，仅承担紧急恢复保底，不承担完整离线权威副本职责。

本轮冻结的存储键：

- `sdkwork-notes-local-workspace`

本轮冻结的恢复快照字段：

1. `noteId`
2. `capturedAt`
3. `revision`
4. `trigger`
5. `saveState`
6. `draft.title / content / type / parentId / tags / isFavorite / publishStatus`

### 2.2 `noteWorkspaceExitRecovery.ts`

职责：

1. 根据 `activeNote + saveState + trigger` 生成标准 `LocalDraftSnapshot`。
2. 限制只允许以下保存运行时状态进入恢复面：
   - `dirty`
   - `saving`
   - `error`
   - `retrying`
3. 排除：
   - `idle`
   - `saved`
   - `recovered`
   - 已删除笔记

### 2.3 `useNotesWorkspaceStore.ts`

职责：

1. 当草稿进入 `dirty` 时，立即记录 `draft-change` 恢复检查点。
2. 当远端保存成功或确认没有真实差异时，清理对应 `noteId` 的本地检查点。
3. 对页面退出触发器暴露 `captureActiveNoteExitRecovery()`，保证退出恢复仍然经过 store 主链，而不是页面直连本地存储。

### 2.4 `noteWorkspaceAutosaveRuntime.ts`

职责：

1. `pagehide`
2. `visibilitychange(hidden)`

二者的执行顺序都被冻结为：

```text
captureRecoverySnapshot -> flushDraft
```

这条顺序规则不可被 `Step 06` 改写。

## 3. 退出恢复证据矩阵

| 场景 | 当前证据 | 说明 |
|---|---|---|
| 页面关闭 | `pagehide -> capture -> flush` | 退出前先记录恢复检查点，再尝试远端刷盘 |
| 页面隐藏 | `visibilitychange(hidden) -> capture -> flush` | 最小化后台切换时的丢稿窗口 |
| 异常退出 / 崩溃 | `draft-change -> local checkpoint` | 即使没有触发退出事件，也已有最近草稿检查点 |
| 远端保存成功 | `clearDraft(noteId)` | 防止已确认保存后仍残留伪恢复草稿 |

## 4. Step 06 接入约束

`Step 06` 只能建立在本轮已冻结的接口之上：

1. 只能消费 `NotesLocalStore.loadWorkspace().drafts`。
2. 不得让页面组件、编辑器组件直接操作浏览器存储键。
3. 不得绕过现有 `save queue + retry policy + save feedback + clearDraft` 主链。
4. 恢复 UI 的确认/放弃流程必须建立在当前 `LocalDraftSnapshot` 事实之上，而不是重新定义另一套草稿结构。

## 5. 非目标

本轮明确不做：

1. 启动恢复提示 UI
2. 手工恢复 / 放弃恢复交互
3. 完整离线权威副本
4. 同步队列或冲突恢复

这些能力仍归属 `Step 06+`。

