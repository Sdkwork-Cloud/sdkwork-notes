> Migrated from `docs/review/step-08-应用壳与桌面bootstrap远程apply顶层注入边界审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 / 应用壳与桌面bootstrap远程apply顶层注入边界审计 - 2026-04-14

## 审计范围

- `packages/sdkwork-notes-shell/src/application/providers/AppProviders.tsx`
- `packages/sdkwork-notes-shell/src/application/AppRoot.tsx`
- `packages/sdkwork-notes-shell/src/index.ts`
- `packages/sdkwork-notes-desktop/src/desktop/bootstrap/DesktopBootstrapApp.tsx`
- `packages/sdkwork-notes-desktop/src/desktop/bootstrap/createDesktopApp.tsx`
- `packages/sdkwork-notes-desktop/src/desktop/bootstrap/DesktopBootstrapApp.test.tsx`
- `packages/sdkwork-notes-desktop/src/desktop/bootstrap/createDesktopApp.test.tsx`
- `scripts/workspace-store-bootstrap.contract.test.mjs`

## 审计结论

- 本轮已经把 `apply(request)` 的 bootstrap 选项提升为 shell / desktop 可消费的单一顶层注入路径。
- Node contract 成功发现并阻断了一个真实缺口：`AppProviders` 之前只声明了 `notesWorkspaceBootstrapOptions`，但没有真正透传到 `AppProvidersContent`。
- 修正后，顶层 caller wiring、契约验证与全量 `pnpm.cmd typecheck` 证据已经一致，不存在“测试绿但实现没接上”的假闭环。

## 通过项

1. `AppProviders` 现在会真实透传 `notesWorkspaceBootstrapOptions`，使 bootstrap options 参与真实去重语义，而不是停留在类型层。
2. `AppRoot`、`DesktopBootstrapApp`、`createDesktopApp` 已保持纯 caller wiring，不把 transport 拼装逻辑下沉到页面层或桌面容器层。
3. `workspace-store-bootstrap.contract.test.mjs` 已冻结：
   - `bootstrapNotesWorkspaceStore(notesWorkspaceBootstrapOptions ?? {})`
   - `AppProviders -> AppProvidersContent` 的真实 props 透传
   - shell / desktop 顶层单一路径存在
4. `DesktopBootstrapApp.test.tsx` 与 `createDesktopApp.test.tsx` 的 mock 签名已收敛为显式接收 props，`pnpm.cmd typecheck` 已不再被 supplemental tests 阻断。

## 残余风险

1. 顶层注入路径虽然存在，但默认 caller 仍未提供真实 `apply(request)` 实现。
2. 当前已接入 note 任务仍全部为 `replayable: false` 的 `direct-write` 同步影子，不能据此宣称真实 replay 可用。
3. 远端 ack apply、`remoteCursor` 合并、冲突恢复 UI、手动 replay 与离在线 smoke 仍未闭环。

## 建议

1. 下一轮优先在 app/bootstrap 或 desktop/background 层提供真实 `apply(request)`。
2. 真实 handler 接通后，再定义 ack apply 与 `remoteCursor` 合并事实，不要提前虚报 `CP08-4` 状态。
3. 在进入 Step 09 前，继续把 `Step 08 / CP08-4` 保持在 `L2`，直到真实远端执行链与恢复证据都成立。

