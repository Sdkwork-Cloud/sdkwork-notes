> Migrated from `docs/review/step-04-顶部动作适配边界收敛-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 04 顶部动作适配边界收敛

- 日期：`2026-04-07`
- Step：`04-工作区边界收敛与数据访问抽象`
- 当前轮次：`Wave-B / 第二十一轮推进`
- 当前等级：`L3`
- 结论：`header action descriptor -> button/link 节点绑定已退出页面容器，但 Step 04 仍未完成`

## 1. 本轮目标

本轮目标不是增加新功能，而是继续压缩 `NotesWorkspacePage.tsx` 的页面容器职责，把顶部动作区从“页面内直接渲染最终按钮/链接节点”进一步收敛为“页面只提供 descriptor 与命令执行入口，组件边界负责最终 UI 绑定”。

## 2. 实际完成

1. 新增 `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/components/NotesWorkspaceHeaderActions.tsx`，建立顶部动作适配边界组件。
2. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx` 删除页面内的 `headerActions.map(...)`、`action.kind === 'link'` 分支和 `resolveNotesWorkspaceChromeIcon()` 调用，改为直接消费 `NotesWorkspaceHeaderActions`。
3. 新增 `sdkwork-notes-pc-react/scripts/workspace-page-header-actions-boundary.contract.test.mjs`，冻结“顶部动作最终 UI 绑定不得继续停留在页面层”的 source contract。
4. `sdkwork-notes-pc-react/package.json` 与 `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs` 已同步纳入新的 contract 聚合链，保证该边界进入总门禁。

## 3. 验证结果

已通过：

```powershell
node --test --experimental-test-isolation=none scripts/workspace-page-header-actions-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-page-command-palette-boundary.contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

补充说明：

- `pnpm.cmd typecheck` 已重新执行 `test:workspace:contracts` 全链，新的顶部动作边界 contract 已进入总验证链。
- 当前 PowerShell 环境仍会输出 conda/profile 噪音，但上述命令全部以退出码 `0` 完成，不影响验证结论。
- 包内 Vitest 在当前环境中的 `spawn EPERM` 限制仍然存在，本轮结论继续建立在 Node contract 与 TypeScript 双门禁上。

## 4. 架构判断

本轮完成后，页面层的收敛状态更新为：

1. `noteWorkspacePageChrome.ts` 继续负责输出 `NotesWorkspacePageHeaderAction` descriptor。
2. `NotesWorkspaceHeaderActions.tsx` 负责 descriptor -> `Link/Button`、`iconKey -> LucideIcon`、命令点击闭包的最终适配。
3. `NotesWorkspacePage.tsx` 退回到“提供 `headerActions` 与 `handleWorkspacePageCommand`”的薄装配职责。

因此：

- `header actions` 已不再是当前页面层主阻塞。
- `Step 04` 仍保持 `L3`。
- 下一轮需要重新评估 `shortcutHints`、顶部错误提示、对话框 footer 等剩余页面本地渲染胶水，判断哪些必须继续边界化，哪些可以接受为容器职责。

## 5. 下一轮建议

下一轮优先处理以下残留项：

1. 复核 `NotesWorkspacePage.tsx` 中剩余的本地渲染胶水，优先判断 `shortcutHints.map(...)` 是否仍应停留在页面层。
2. 复核顶部错误提示条与对话框 footer 是否需要进一步组件化或 runtime 化。
3. 在完成剩余胶水复核后，再重新评估 Step 04 是否具备冲击 `L4` 的条件；在此之前不推进 Step 05。

