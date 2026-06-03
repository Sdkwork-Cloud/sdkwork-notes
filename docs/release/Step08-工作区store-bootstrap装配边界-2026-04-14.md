# Step 08 - 工作区 store bootstrap 装配边界 - 2026-04-14

## 本次更新

- `notes-notes` 工作区 store 现在支持在 bootstrap 期重新装配。
- 导出的 `notesWorkspaceStore` 不再是模块加载时冻结的唯一实例。
- 页面层继续使用原有的 `useNotesWorkspaceStore((state) => ...)` 选择器写法，不需要改调用面。

## 技术变更

- 新增 store 运行时装配 API：
  - `getNotesWorkspaceStore()`
  - `setNotesWorkspaceStore(store)`
  - `configureNotesWorkspaceStore(overrides?)`
  - `resetNotesWorkspaceStore()`
- `useNotesWorkspaceStore(...)` 改为读取当前导出的 store 绑定。
- Node contract 环境同步补齐 `zustand/useStore` stub。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 状态

- `Step 08 = L2`
- `CP08-4 = L2`
- `CP08-4 / notes-notes 工作区 store bootstrap 装配边界 = L3`

## 仍然未做

- 未实现真实远端 handler。
- 未实现 ack apply 与 `remoteCursor` 回写。
- 未把 runtime bootstrap 正式接到 app shell 或 desktop/background。
