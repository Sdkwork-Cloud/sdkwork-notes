> Migrated from `docs/step/08-工作区store-bootstrap调用接线-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 - 工作区 store bootstrap 调用接线 - 2026-04-14

## 本轮目标

- 延续上一轮已经完成的 `notesWorkspaceStore` live binding 与 bootstrap API。
- 把真实调用点从“模块内可注入”推进到“shell session 边界可调用”。
- 保持边界保守，不伪造 `execute(task)` handler，不提前宣称远端同步已经跑通。

## 本轮实现

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/bootstrap/notesWorkspaceStoreBootstrap.ts`
   - 新增 `bootstrapNotesWorkspaceStore(options?)`。
   - 新增 `resetNotesWorkspaceStoreBootstrap()`。
   - 默认显式创建并复用 `syncQueueStore`。
   - 只有 caller 提供 `execute(task)` 或 `syncRuntime` 时才注入 runtime。
   - 在 rebootstrap / reset 时释放旧 runtime，避免 session 切换后遗留旧调度器。
2. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/bootstrap/index.ts`
   - 导出 bootstrap facade，供 shell 通过包根消费。
3. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/index.ts`
   - 暴露 bootstrap public API。
4. `sdkwork-notes-pc-react/packages/sdkwork-notes-shell/src/application/providers/AppProviders.tsx`
   - 在认证态下按用户 key 调用 `bootstrapNotesWorkspaceStore()`。
   - 在未认证或用户切换时调用 `resetNotesWorkspaceStoreBootstrap()`。
   - 通过 provider 级 bootstrap key 避免 StrictMode 重挂时重复接线。
5. `sdkwork-notes-pc-react/packages/sdkwork-notes-shell/src/application/providers/AppProviders.test.tsx`
   - 补充 `@sdkwork/notes-notes` mock，锁定 provider 对 bootstrap/reset facade 的调用边界。
6. `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs`
   - 增补“无 handler 不伪造 runtime”的契约。
   - 增补“注入 execute 后创建 runtime，reset 时 dispose”的契约。
   - 增补 `AppProviders` 持有 caller wiring 的 source boundary 契约。

## 关键决策

- 不在本轮实现 fake remote handler。
- 不在本轮实现 remote ack apply。
- 不在本轮把 desktop/background runtime wiring 写死到 shell 内部。
- shell 只消费 `notes-notes` 暴露出来的 bootstrap facade，不直接拼接 runtime 细节。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 状态结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / notes-notes 工作区 store bootstrap 调用接线 = L3`

## 剩余缺口

- 还没有真实 `execute(task)` handler。
- 还没有 remote ack apply / `remoteCursor` 落地语义。
- 还没有 desktop/background runtime caller。
- conflict/manual replay UI 仍未接入。

