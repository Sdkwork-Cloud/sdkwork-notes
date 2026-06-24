> Migrated from `docs/架构/10-实施进度-认证宿主边界纠偏-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度-认证宿主边界纠偏

## 1. 本轮结论

本轮没有继续扩展 `Step 05` 功能面，而是先执行止损修复：根级 `pnpm.cmd typecheck` 被旧版认证宿主边界合同阻断，必须优先恢复工程门禁。

最终结论是：

- `Step 03` 保持 `L4`
- `Step 05` 保持 `L2`
- 根级 `pnpm.cmd typecheck` 已恢复通过
- notes 仓库的认证宿主边界重新冻结为 `@sdkwork/notes-auth`

## 2. 代码与合同落地

- 更新 `sdkwork-notes-pc-react/scripts/workspace-boundary-contract.test.mjs`
  - 将 shared auth 的边界校验收口到 `packages/sdkwork-notes-auth`
  - 冻结 `sdkworkAuthBridge.ts` 对 `notes-core` 的 runtime 绑定
  - 冻结除 `notes-auth` 外其它 TypeScript 包不得直连 `@sdkwork/auth-pc-react`

## 3. 验证结果

已通过：

```powershell
node --test --experimental-test-isolation=none scripts/workspace-boundary-contract.test.mjs
pnpm.cmd typecheck
```

说明：

- 本轮根级 `typecheck` 已重新串起 `test:workspace:contracts -> prepare:shared-sdk -> turbo typecheck -> root tsc` 全链。
- 包内 Vitest 仍受 `spawn EPERM` 环境限制，本轮不以其作为主结论依据。

## 4. 当前阶段判断

- 当前波次：`Wave-B`
- 当前执行 Step：`05-编辑器与自动保存可靠性升级`
- 当前 Step 等级：`L2`
- 当前最大差距：
  - `save queue`
  - 自动退避与重试上限
  - 高风险 flush 证据的正式文档闭环

## 5. 下一轮建议

1. 回到 `Step 05`，优先补齐 `save queue` 串行编排。
2. 建立保存链退避、重试上限和观测事件。
3. 将已存在的高风险 flush 合同证据补齐到 `docs/review/`、`docs/架构/`、`docs/release/`。

