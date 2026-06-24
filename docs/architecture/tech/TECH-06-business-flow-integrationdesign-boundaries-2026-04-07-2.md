> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-命令面板适配边界补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06. 业务流程 / 应用接口与集成设计补充
## 命令面板适配边界补充 - 2026-04-07

## 1. 本次补充目的

补充工作区页面在命令面板链路上的最终适配边界设计，明确以下职责不再停留在页面容器中：

1. descriptor 到最终 `NoteCommandPaletteItem` 的 UI item 组装。
2. `iconKey -> LucideIcon` 的命令面板视图绑定。
3. descriptor 到点击 `onSelect` 闭包的最终视图绑定。

## 2. 边界收敛后的链路

### 2.1 模型层

- `noteWorkspaceCommandPaletteModel.ts`
  - 负责输出 `NoteWorkspaceCommandPaletteItem` descriptor。
  - 只描述 title / subtitle / keywords / badge / iconKey / action。
  - 不依赖 React 组件。

### 2.2 页面命令运行时

- `noteWorkspacePageCommandRuntime.ts`
  - 负责把命令面板 action 解释为页面命令执行。
  - 负责处理 `open-note / open-folder / change-view / create-note / clear-search` 等语义动作。
  - 不承担最终 UI item 渲染职责。

### 2.3 组件适配边界

- `NotesWorkspaceCommandPalette.tsx`
  - 负责消费 descriptor。
  - 负责把 `iconKey` 解析为真实图标。
  - 负责把 `onSelectDescriptor(descriptor)` 绑定为最终点击闭包。
  - 负责把最终 `items` 传递给 `NoteCommandPalette`。

### 2.4 页面容器

- `NotesWorkspacePage.tsx`
  - 仅负责生成 descriptor。
  - 仅负责提供命令执行入口 `handleCommandPaletteDescriptorSelect`。
  - 不再在页面内执行 `commandPaletteDescriptors.map(...)`。

## 3. 评估标准

满足以下条件，才视为命令面板适配边界合格：

1. 页面容器中不再出现 `NoteCommandPaletteItem[]` 的组装逻辑。
2. 页面容器中不再出现 `commandPaletteDescriptors.map(...)` 的最终 UI item 映射。
3. 命令面板组件边界中必须显式完成 `resolveNotesWorkspaceChromeIcon()` 调用。
4. 命令面板组件边界中必须显式完成 `onSelectDescriptor(descriptor)` 绑定。
5. 该边界必须进入 `test:workspace:contracts` 总门禁。

## 4. 当前结论

本次补充完成后：

- `command palette` 已从页面容器残留阻塞列表中移除。
- Step 04 页面层唯一明确的 UI 装配阻塞继续收敛为 `header action` 的最终 button/link 绑定。
- 工作区页面已经进一步接近“模型 / 运行时 / 组件适配 / 页面装配”四层分离目标。

