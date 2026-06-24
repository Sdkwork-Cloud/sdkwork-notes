> Migrated from `docs/review/step-08-工作区store-bootstrap装配边界审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 工作区 store bootstrap 装配边界审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
- `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-startup-recovery-smoke.contract.test.mjs`
- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`

## 审计结论

- 本轮未发现新的 P0/P1 级问题。
- 改动集中在 store 导出形态与 contract stub 对齐，没有扩大到远端执行、ack apply、UI 行为改写。
- 页面消费面仍保持 `useNotesWorkspaceStore((state) => ...)`，因此不会因为 store bootstrap 改造被迫重写页面层。

## 已确认成立的约束

1. bootstrap 可以在页面消费前替换导出的 `notesWorkspaceStore` 绑定。
2. selector hook 会读取当前导出的 store 绑定，而不是模块加载期冻结的旧实例。
3. reset 会恢复一个全新的默认 store，而不是复用上一次定制状态。
4. 既有 sync runtime、sync write path、startup recovery smoke contract 在新导出形态下仍保持通过。
5. `test:workspace:contracts` 与 `typecheck` 全链路通过。

## 残余风险

- 这轮只解决“如何装配 store”，没有解决“谁来装配真实 runtime”。
- 如果未来在页面已经挂载之后再切换导出的 store 绑定，虽然 wrapper hook 会读取当前绑定，但仍应把真正的切换时机限制在 bootstrap 之前，避免运行中替换带来的订阅语义复杂化。
- Node contract stub 现在已经补齐 `useStore(...)`，后续若 store 源码继续引入新的 zustand API，仍需同步更新这些 stub。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-startup-recovery-smoke.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

- 下一轮继续在 `CP08-4` 内推进运行时装配，不要跳到 Step 09。
- 只有在真正具备远端执行与 ack apply 语义之后，才进入更高层的同步完成度判定。

