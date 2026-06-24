> Migrated from `docs/release/Step08-应用壳与桌面bootstrap远程apply顶层注入边界-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step08-应用壳与桌面bootstrap远程apply顶层注入边界 - 2026-04-14

## 发布摘要

- shell / desktop 当前已具备单一顶层注入路径，可把 `notesWorkspaceBootstrapOptions` 从 `createDesktopApp(...)` 一路传到 `bootstrapNotesWorkspaceStore(...)`。
- `AppProviders` 当前已真实透传该 bootstrap 选项，不再只是类型层声明。
- 本轮交付的是 caller wiring 与 contract 收口，不是真实远端同步落地。

## 风险控制

- 默认 caller 仍未提供真实 `apply(request)`。
- 当前已接入 note 任务仍然全部是 `replayable: false` 的 `direct-write` 影子任务。
- 当前不宣称 ack apply、`remoteCursor` 合并、冲突恢复 UI 与离在线 smoke 已完成。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 发布结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 应用壳与桌面bootstrap远程apply顶层注入边界 = L3`

下一轮仍需停留在 `CP08-4`，把这条顶层注入路径接到真实 replay-safe transport / ack apply 实现上。

