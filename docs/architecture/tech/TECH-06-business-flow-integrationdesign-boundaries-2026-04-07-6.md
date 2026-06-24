> Migrated from `docs/架构/06-业务流程-应用接口与集成设计-错误提示适配边界补充-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 06. 业务流程 / 应用接口与集成设计补充
## 错误提示适配边界补充 - 2026-04-07

## 1. 本次补充目的

补充工作区页面在顶部错误提示链路上的最终适配边界设计，明确以下职责不再停留在页面容器中：

1. `errorMessage` 到错误提示条视图的最终 JSX 绑定。
2. `dismissLabel` 到关闭按钮文案的最终适配。
3. `clearError()` 到错误提示关闭按钮点击闭包的最终绑定。

## 2. 收敛后的职责链路

### 2.1 状态与容器输入层

- `useNotesWorkspaceStore`
  - 负责输出 `errorMessage` 状态。
  - 负责输出 `clearError()` 行为。
- `NotesWorkspacePage.tsx`
  - 负责提供 `dismissLabel={t('notes.actions.dismissError')}`。
  - 负责向边界组件注入 `message` 与 `onDismiss`。

### 2.2 组件适配边界

- `NotesWorkspaceErrorBanner.tsx`
  - 负责消费 `message / dismissLabel / onDismiss`。
  - 负责在 `message === null` 时返回 `null`。
  - 负责错误提示条容器、文案和关闭按钮的最终视图绑定。

### 2.3 页面容器

- `NotesWorkspacePage.tsx`
  - 不再在页面层执行 `errorMessage ? (...) : null`。
  - 不再在页面层直接装配错误提示条容器样式。
  - 不再在页面层直接把 `clearError` 绑定到错误提示关闭按钮。

## 3. 评估标准

满足以下条件，才视为错误提示适配边界达标：

1. 页面容器中不再出现 `errorMessage ? (...) : null`。
2. 页面容器中不再出现错误提示条的最终样式与关闭按钮 JSX。
3. `NotesWorkspaceErrorBanner.tsx` 必须显式完成 `message` 判空、banner 样式和 `onDismiss` 绑定。
4. `components/index.ts` 必须导出 `NotesWorkspaceErrorBanner`，确保边界入口稳定。
5. `workspace-page-error-banner-boundary.contract.test.mjs` 必须纳入 `test:workspace:contracts` 总门禁。
6. 包级与根级 TypeScript 校验必须通过，避免边界抽离后出现类型回退。

## 4. 当前结论

本次补充完成后：

1. 顶部错误提示条已从页面容器残留阻塞列表中移除。
2. 工作区页面进一步接近“状态输入 / runtime / 组件适配 / 页面装配”四层分离目标。
3. Step 04 仍保持 `L3`，因为 `Dialog footer` 仍是页面层唯一高优先级本地装配残项，需在下一轮继续复核。

