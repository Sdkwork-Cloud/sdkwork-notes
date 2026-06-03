# Step 08 - 工作区 store bootstrap 装配边界 - 2026-04-14

## 背景

- 前一轮已经把 `notes-notes` 工作区侧的 `syncRuntime -> requestDrain()` 接口接到 store 写路径和 `initialize()` 启动路径。
- 但 `useNotesWorkspaceStore.ts` 仍然同时导出了一个模块加载时固定实例化的 store 和 hook。
- 这种“模块加载即冻结”的形态会卡住后续的 app/bootstrap、desktop/background runtime 注入，也会让真正的运行时装配只能继续堆在页面层或全局副作用里。

## 本轮目标

- 不推进到 Step 09。
- 不伪造远端 handler，也不伪造 ack apply。
- 只补齐一个更安全的边界：
  - `notes-notes` 工作区 store 可以在 bootstrap 期被重配置；
  - 页面继续通过 `useNotesWorkspaceStore((state) => ...)` 使用当前 store；
  - 默认生产行为仍然不自动注入自定义 runtime。

## 交付内容

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
   - 保留 `createNotesWorkspaceStore(...)` 工厂。
   - 将导出的 `notesWorkspaceStore` 改成可重绑定的 live binding。
   - 新增：
     - `getNotesWorkspaceStore()`
     - `setNotesWorkspaceStore(store)`
     - `configureNotesWorkspaceStore(overrides?)`
     - `resetNotesWorkspaceStore()`
   - `useNotesWorkspaceStore(...)` 改成基于 `zustand/useStore` 的 wrapper hook，使 selector 始终作用于当前导出的 store 绑定。
2. `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs`
   - 约束 bootstrap 期可以替换导出的 store 绑定。
   - 约束 selector hook 能读取重配置后的 store 状态。
   - 约束 reset 能恢复新的默认 store 绑定。
3. Node contract stub 对齐
   - `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`
   - `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
   - `sdkwork-notes-pc-react/scripts/workspace-startup-recovery-smoke.contract.test.mjs`
   - 以上转译 stub 均补齐 `useStore(...)` 导出，保证新源码导入 `zustand` 后仍可在 Node contract 环境执行。
4. 脚本接线
   - `sdkwork-notes-pc-react/package.json`
   - `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 保持 `workspace-store-bootstrap.contract.test.mjs` 进入 `test:workspace:contracts` 的证据链。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-startup-recovery-smoke.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 状态判定

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / notes-notes 工作区 store bootstrap 装配边界 = L3`

## 影响与约束

- 这轮只打开了“store 可装配”这条边界，没有引入默认生产 runtime，也没有把 handler 执行塞进 UI/store。
- 页面调用面保持不变，仍然使用 `useNotesWorkspaceStore((state) => state.xxx)`。
- 这为后续在 app/bootstrap 或 desktop/background 层显式装配真实 runtime 留出了安全入口。

## 剩余缺口

- 仍然没有真实的 `execute(task)` 远端执行 handler。
- 仍然没有远端 ack apply 与 `remoteCursor` 回写闭环。
- 仍然没有把 runtime bootstrap 真正接到 app shell 或 desktop/background 启动流程。

## 下一步建议

- 继续停留在 `Step 08 / CP08-4`。
- 优先做“谁来在 bootstrap 时配置 store/runtime”的运行时接线，而不是抢跑实现伪远端同步。
