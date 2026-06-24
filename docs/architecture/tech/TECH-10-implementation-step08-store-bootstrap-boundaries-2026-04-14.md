> Migrated from `docs/架构/10-实施进度-Step08工作区store-bootstrap装配边界-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10. 实施进度 - Step 08 工作区 store bootstrap 装配边界 - 2026-04-14

## 本轮定位

- 所属 Step：`Step 08`
- 所属子能力：`CP08-4 / 冲突与失败恢复验证`
- 本轮切片：`CP08-4 / notes-notes 工作区 store bootstrap 装配边界`

## 为什么先做这一轮

- `syncRuntime` 边界已经接到 store 写路径和初始化路径，但 store 仍然是模块加载即固定实例。
- 如果不先打开 bootstrap 装配边界，后续所有 runtime 接线都会被迫塞到页面层或全局副作用里。
- 当前队列任务仍只携带 operation 事实，不具备安全的远端 replay 载荷，所以这轮不能冒进实现真实 handler。

## 本轮实现

1. 将 `notesWorkspaceStore` 从固定导出改成 live binding。
2. 保持 `createNotesWorkspaceStore(...)` 作为底层工厂。
3. 增加运行时装配 API：
   - `getNotesWorkspaceStore()`
   - `setNotesWorkspaceStore(store)`
   - `configureNotesWorkspaceStore(overrides?)`
   - `resetNotesWorkspaceStore()`
4. 将 `useNotesWorkspaceStore(...)` 改成 wrapper hook，始终指向当前导出的 store 绑定。
5. 对所有转译 `useNotesWorkspaceStore.ts` 的 Node contract stub 补齐 `useStore(...)`。

## 当前状态

- `Step 08 = L2`
- `CP08-4 = L2`
- `CP08-4 / notes-notes 工作区 store bootstrap 装配边界 = L3`

## 已验证证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 仍未完成

- app shell/bootstrap 还没有真正调用 `configureNotesWorkspaceStore(...)` 注入真实 runtime。
- desktop/background 也还没有独立装配工作区 store。
- 真实远端 handler、ack apply、`remoteCursor` 回写仍未进入实现。

## 结论

- 这轮把 Step 08 从“有 runtime 边界但无法装配”推进到“可在 bootstrap 期装配 store/runtime”。
- 它是后续真实运行时接线的前置条件，不是同步闭环的终点。

