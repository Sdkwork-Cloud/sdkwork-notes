> Migrated from `docs/review/step-03-认证宿主边界纠偏-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 03 认证宿主边界纠偏

- 日期：`2026-04-13`
- Step：`03-会话安全与配置治理升级`
- 波次：`Wave-A`
- 本轮性质：`回归止损 / 合同纠偏`
- 当前总体执行入口：`Step 05-编辑器与自动保存可靠性升级`

## 1. 本轮目标

- 修复根级 `pnpm.cmd typecheck` 因认证宿主边界合同失效而失败的问题。
- 将 notes 仓库当前真实的认证宿主边界重新冻结为 `@sdkwork/notes-auth`，而不是继续假设上游 `@sdkwork/auth-pc-react` 必须保持“零 `core-pc-react` 依赖”。

## 2. 本轮实际改动

### 2.1 合同修正

- 更新 `sdkwork-notes-pc-react/scripts/workspace-boundary-contract.test.mjs`：
  - 不再直接读取仓库外 `sdkwork-auth-pc-react/package.json` 作为 notes 仓库边界判断依据。
  - 改为冻结 `packages/sdkwork-notes-auth/package.json` 的宿主约束：
    - 允许依赖 `@sdkwork/auth-pc-react`
    - 禁止直接依赖 `@sdkwork/core-pc-react`
  - 新增 `sdkworkAuthBridge.ts` 必须通过 `notes-core` 绑定 `getClient / persistSession / readSession / clearSession / resolveAccessToken` 的源码约束。
  - 新增工作区扫描规则：除 `packages/sdkwork-notes-auth` 外，其它 TypeScript 源文件不得直接导入 `@sdkwork/auth-pc-react`。

### 2.2 现实约束显式化

- 上游共享认证包 `@sdkwork/auth-pc-react` 已把 `@sdkwork/core-pc-react` 作为默认运行时依赖，这一事实已经存在于当前真实源码中。
- notes 仓库当前可控、可验证、可维护的边界不再是“要求上游 shared auth 零 core 依赖”，而是“要求本仓库只通过 `@sdkwork/notes-auth` 宿主层接入 shared auth，并由宿主桥接到 `notes-core` 会话体系”。

## 3. 风险与问题

- 仓库外 `sdkwork-auth-pc-react` 已演进为带默认 runtime 的共享能力包，notes 仓库无法也不应继续把其内部依赖结构当作本仓库的唯一质量门禁。
- 如果后续其它包绕过 `@sdkwork/notes-auth` 直接依赖 `@sdkwork/auth-pc-react`，则会重新引入认证运行时边界漂移，必须视为回退。
- 当前环境下基于 Vite 的 Vitest 仍受 `spawn EPERM` 限制；本轮结论继续建立在 Node contract 与 `tsc` 验证上。

## 4. 测试与验证结果

已通过：

```powershell
node --test --experimental-test-isolation=none scripts/workspace-boundary-contract.test.mjs
pnpm.cmd typecheck
```

验证结论：

- 根级 `test:workspace:contracts` 已重新放行。
- 根级 `pnpm.cmd typecheck` 已重新恢复为可执行通过状态。
- 认证宿主边界当前可由本仓库内合同直接审计，不再被仓库外包结构漂移直接阻断。

## 5. 当前能力判断

- `Step 03`：保持 `L4`
  - 设计闭环：是
  - 实现闭环：是
  - 测试闭环：是
  - 验证闭环：是
  - 文档闭环：本轮补齐
  - 集成闭环：是
- `Step 05`：保持 `L2`
  - 本轮未新增保存链能力，仅完成了基础合同回退修复。

## 6. 未完成项

- `Step 05` 仍未完成 `save queue`、自动退避、重试上限与保存链观测事件。
- `Step 05` 虽已有 `workspace-high-risk-flush-boundary.contract.test.mjs` 进入门禁，但尚未形成完整的 `review / 架构 / release` 闭环说明。

## 7. 下一轮输入

- 回到 `Step 05-编辑器与自动保存可靠性升级`。
- 优先顺序：
  1. 明确 `save queue` 串行编排与去重语义。
  2. 补齐退避、重试上限与观测事件。
  3. 将已存在的高风险 flush 证据纳入 `docs/review/`、`docs/架构/`、`docs/release/` 的正式闭环。

