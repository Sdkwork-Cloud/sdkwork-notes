> Migrated from `docs/step/08-应用壳与桌面bootstrap远程apply顶层注入边界-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 / 应用壳与桌面bootstrap远程apply顶层注入边界 - 2026-04-14

## 本轮目标

把上一轮已经进入 `notes-notes` workspace bootstrap 的 `apply(request)` 装配能力继续抬升到 shell / desktop 顶层调用边界，冻结单一 caller wiring；本轮不接真实 transport，也不宣称远端 replay 已打通。

## 实际完成

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-shell/src/application/providers/AppProviders.tsx`
   - `AppProviders` 现在会真实接收并透传 `notesWorkspaceBootstrapOptions` 到 `AppProvidersContent`。
   - 这让 `ensureNotesWorkspaceStoreBootstrapped(...)` 的“用户 key + bootstrap options 引用”去重语义真正落到运行时，而不只是停留在类型声明。
2. `sdkwork-notes-pc-react/packages/sdkwork-notes-shell/src/application/AppRoot.tsx`
   - 继续作为 shell 顶层入口透传 `notesWorkspaceBootstrapOptions`。
3. `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop/src/desktop/bootstrap/DesktopBootstrapApp.tsx`
4. `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop/src/desktop/bootstrap/createDesktopApp.tsx`
   - 继续把 `appRootProps` 提升到桌面 bootstrap 顶层，形成单一路径：
     - `createDesktopApp({ appRootProps })`
     - `DesktopBootstrapApp({ appRootProps })`
     - `AppRoot({ notesWorkspaceBootstrapOptions })`
     - `AppProviders({ notesWorkspaceBootstrapOptions })`
     - `bootstrapNotesWorkspaceStore(notesWorkspaceBootstrapOptions ?? {})`
5. `sdkwork-notes-pc-react/scripts/workspace-store-bootstrap.contract.test.mjs`
   - 修正旧的 `bootstrapNotesWorkspaceStore()` 无参断言，改为冻结真实调用形态。
   - 新增 `AppProviders -> AppProvidersContent` 的真实透传 contract。
6. `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop/src/desktop/bootstrap/DesktopBootstrapApp.test.tsx`
7. `sdkwork-notes-pc-react/packages/sdkwork-notes-desktop/src/desktop/bootstrap/createDesktopApp.test.tsx`
   - 把 mock 签名收敛为显式接收 props，避免 supplemental test 在 `pnpm.cmd typecheck` 中出现类型越界。

## 风险控制

1. 当前默认 caller 仍未提供真实 `apply(request)` 实现。
2. 当前 note 主写路径仍然是 `direct-write`，现有已接入任务仍然全部是 `replayable: false`。
3. 当前仍未实现 ack apply、`remoteCursor` 合并、冲突恢复 UI、手动 replay 入口与离在线切换 smoke。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 应用壳与桌面bootstrap远程apply顶层注入边界 = L3`

## 下一轮入口

1. 在 app/bootstrap 或 desktop/background 层提供真实 `apply(request)` 实现。
2. 让该实现返回真实 ack / `remoteCursor`，把当前顶层注入路径接到真实远端回执合并链。
3. 在此之前，不要把当前 `direct-write` note 写接口直接作为 raw replay handler 暴露给 worker。

