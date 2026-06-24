> Migrated from `docs/review/step-05-保存重试退避与观测审计-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 05 保存重试退避与观测审计

- 日期：`2026-04-13`
- 阶段：`Step 05 / L3`
- 波次：`Wave-B / 第二十九轮后续增量`
- 本轮主题：`save queue 之上的自动退避、重试上限与保存观测`

## 1. 审计目标

在上一轮已经落地 `flushDraft + save feedback + save queue` 主脊柱的基础上，本轮继续收口 Step 05 剩余的第一优先级缺口：

1. 自动退避没有稳定规则。
2. 保存失败后的最大重试次数没有明确上限。
3. 保存链没有最小观测事件边界，后续 Step 10/11 无法平滑接入。

本轮不扩展页面层 UI，不引入新的并发控制路径，只在既有 `save queue` 之上补齐最小策略与证据。

## 2. 实际完成

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSaveRetryPolicy.ts`
   - 新增独立重试策略服务。
   - 冻结默认退避节奏：`500ms -> 1500ms -> terminal error`。
   - 冻结最大自动重试次数：`2` 次。
   - 冻结三类 telemetry 事件：
     - `notes.workspace.save.retry.scheduled`
     - `notes.workspace.save.retry.recovered`
     - `notes.workspace.save.retry.exhausted`
2. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
   - 新增 `activeNoteSaveRetryPolicy` 接缝，并继续复用现有 `activeNoteSaveQueue`。
   - 保存失败后改为：
     - 先记录 `scheduled`
     - 切换到 `retrying`
     - 按退避时长等待后重试
   - 若后续保存成功，则记录 `recovered`。
   - 若退避耗尽，则记录 `exhausted` 并回落到 `saveState = error`。
3. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/package.json`
   - `notes-notes` 正式声明对 `@sdkwork/notes-observability` 的工作区依赖。
4. `sdkwork-notes-pc-react/tsconfig.base.json`
   - 新增 `@sdkwork/notes-observability` 的 workspace source alias，修复 `tsc` 解析边界。
5. `sdkwork-notes-pc-react/scripts/workspace-save-retry-policy.contract.test.mjs`
   - 新增 Node contract，冻结重试策略服务、telemetry 事件与 store 消费边界。

## 3. 验证证据

本轮重新执行并确认通过：

```powershell
node .\scripts\workspace-save-retry-policy.contract.test.mjs
node .\scripts\workspace-save-queue.contract.test.mjs
node .\scripts\workspace-save-feedback.contract.test.mjs
node .\scripts\workspace-save-flush-boundary.contract.test.mjs
node .\scripts\workspace-high-risk-flush-boundary.contract.test.mjs
node .\scripts\package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

补充说明：

1. 本轮先出现过一次真实失败：`@sdkwork/notes-observability` 未进入 `tsconfig.base.json` 路径映射，导致 `tsc` 无法解析；问题已修复并重新验证。
2. `pnpm.cmd typecheck` 重新串起了 `test:workspace:contracts -> prepare:shared-sdk -> turbo typecheck -> root tsc` 全链，说明本轮新增 contract 与类型边界已经进入主门禁。
3. 包内 Vitest 仍受 `spawn EPERM` 限制，本轮结论继续以 Node contract 与 typecheck 为准。

## 4. 能力闭环判断

### 4.1 已闭环项

1. `save queue` 之上的自动退避规则已经稳定。
2. 最大自动重试次数已经冻结为显式上限，不再是隐式“无限立即重试”。
3. 保存链最小 telemetry sink 接口已经建立，后续可由 `@sdkwork/notes-observability` 提供真实实现。
4. 重试策略、store 集成、类型边界与验证门禁已经形成一条闭环。

### 4.2 未闭环项

1. 页面关闭、异常退出、崩溃恢复的正式证据矩阵仍未补齐。
2. Step 06 本地草稿恢复如何接入当前保存主链，仍未形成冻结约束。
3. 真实 observability 平台实现仍留待 Step 10/11，当前仅完成接口级观测闭环。

## 5. 结论

1. `自动退避 / 重试上限 / 保存观测接口` 这条增量能力可判定为 `L4`。
2. `Step 05` 总体仍维持 `L3`，当前主要阻塞已收敛到：
   - 页面关闭 / 异常退出 / 崩溃恢复证据矩阵
   - Step 06 本地草稿恢复接入约束
3. 下一轮仍应继续停留在 `Step 05`，不应提前切入 `Step 06` 实现。

