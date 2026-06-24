> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-页面动作编排补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06 补充 - 页面动作编排 - 2026-04-07

## 1. 补充背景

当前工作区页面在 Step 04 中新增一层“页面动作解析服务”，用于统一快捷键、命令面板、确认框的动作归一化逻辑，降低 `NotesWorkspacePage.tsx` 对分支判断的直接承担。

## 2. 新增服务边界

新增服务：

- `packages/sdkwork-notes-notes/src/services/noteWorkspacePageActions.ts`

能力范围：

- hotkey -> page command
- command palette action -> page command
- pending dialog -> page command

## 3. 页面动作流

```text
Keyboard / CommandPalette / DialogConfirm
  -> resolveNotesWorkspace*Command()
  -> NotesWorkspacePageCommand
  -> NotesWorkspacePage 执行命令
```

## 4. 当前架构价值

- 页面动作判断规则统一
- 页面组件的条件分支减少
- 后续可以围绕统一命令模型继续抽出 executor 层

## 5. 评估标准

- 是否存在统一命令模型
- 是否能够通过独立 Node contract 验证
- 是否保留原有交互语义，不发生行为回归
- 是否为后续 executor 下沉创造接口条件

## 6. 当前结论

该补充已完成“动作解析服务化”，但“动作执行服务化”尚未完成，因此属于 Step 04 的有效收敛增量，不足以单独关闭 Step 04。

