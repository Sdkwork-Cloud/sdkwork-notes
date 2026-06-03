# Step 08 - 工作区 sync runtime 边界接线 - 2026-04-14

## 范围

- 当前 Step：`Step 08-同步队列与冲突恢复一期`
- 当前子阶段：`CP08-4 / 冲突与失败恢复验证`
- 当前结论：`CP08-4 已启动，但整体仍为 L2`

## 本轮发布事实

1. `@sdkwork/notes-notes` 新增 `createNotesWorkspaceSyncRuntime(...)`，把 `notes-sync` worker runtime 包装为 workspace-side 边界。
2. `useNotesWorkspaceStore.ts` 现在支持可选 `syncRuntime`，并在队列写入与 `initialize()` 成功后触发 `requestDrain()`。
3. 新增 `workspace-sync-runtime-boundary.contract.test.mjs`，覆盖 runtime 工厂委托、`createNote` drain、`initialize` replay 三条真实边界语义。
4. 根级 `test:workspace:contracts` 与 `package-scripts-contract.test.mjs` 已纳入新的 runtime boundary contract。

## 风险控制

- 本轮没有默认启用生产 runtime，因此不会在无真实 handler 时引入伪同步执行。
- 本轮没有接入真实远端 transport，因此没有新增鉴权、兼容性或远端协议面风险。
- 所有新增边界都由 Node contract 与根级 typecheck 冻结，避免后续接线漂移。

## 验证结果

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 当前状态

- `CP08-1 / 同步任务模型与状态机冻结 = L4`
- `CP08-2 / 待同步队列与重试机制落地 = L4`
- `CP08-3 / 主写入路径接入 = L4`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / notes-notes 工作区 sync runtime 边界接线 = L3`
- `Step 08` 总体仍为 `L2`

## 下一轮入口

- 定义真实远端 handler。
- 在 app/bootstrap 或 desktop/background 的安全边界实例化 runtime。
- 补远端 ack apply、冲突恢复入口与离在线切换 smoke。
