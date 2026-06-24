> Migrated from `docs/架构/10-实施进度-Step08应用壳与桌面bootstrap远程apply顶层注入边界-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度-Step08应用壳与桌面bootstrap远程apply顶层注入边界-2026-04-14

## 1. 本轮定位

本轮继续停留在 `Step 08 / CP08-4`，目标是把 `apply(request)` 的 bootstrap 选项从 workspace 边界继续提升到 shell / desktop 顶层 caller wiring，并确认该路径在实现上真实存在。

## 2. 已落地的实现事实

1. `AppProviders` 已真实透传 `notesWorkspaceBootstrapOptions` 到 `AppProvidersContent`。
2. `AppRoot` 继续作为 shell 顶层 props 转发边界。
3. `DesktopBootstrapApp` 与 `createDesktopApp` 已保持 `appRootProps` 顶层注入入口。
4. `workspace-store-bootstrap.contract.test.mjs` 已冻结单一路径：
   - `createDesktopApp({ appRootProps })`
   - `DesktopBootstrapApp({ appRootProps })`
   - `AppRoot({ notesWorkspaceBootstrapOptions })`
   - `AppProviders({ notesWorkspaceBootstrapOptions })`
   - `bootstrapNotesWorkspaceStore(notesWorkspaceBootstrapOptions ?? {})`
5. supplemental desktop tests 的 mock 签名已修正，`pnpm.cmd typecheck` 全量通过。

## 3. 这轮刻意不做的事情

1. 不默认注入真实 `apply(request)` 实现。
2. 不把当前 `direct-write` note 写接口直接当作 raw replay handler。
3. 不宣称 ack apply、`remoteCursor` 合并、冲突恢复 UI 或离在线 smoke 已完成。

## 4. 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 5. 阶段结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 应用壳与桌面bootstrap远程apply顶层注入边界 = L3`

本轮意义不是“桌面端已默认开启远端同步”，而是“真实 `apply(request)` 未来已经有了从顶层注入到 workspace bootstrap 的稳定单一路径”。

