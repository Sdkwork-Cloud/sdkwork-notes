> Migrated from `docs/架构/10-实施进度-Step08队列worker运行时调度闭环-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10. 实施进度 - Step 08 队列 worker 运行时调度闭环 - 2026-04-14

## 本轮结论

- `Step 08` 继续停留在 `CP08-4 / 冲突与失败恢复验证`。
- `@sdkwork/notes-sync` 已从“可执行一次任务的 executor”推进到“可驱动的 package-local worker runtime”。
- `CP08-4` 整体仍未闭环，但“队列执行 -> 调度重放 -> 合同验证”这条最小运行时主链已成立。

## 本轮新增架构事实

### 1. `notes-sync` 已从 executor 推进到 runtime

- 新增 `createNotesSyncWorkerRuntime(...)`。
- runtime 仍然复用 `executeNextNotesSyncTask(...)`，不复制状态机。
- runtime 默认使用 `setTimeout / clearTimeout`，但允许注入自定义 scheduler，便于测试与后续 desktop/background 集成。

### 2. Step 08 一期的最小运行时调度语义已冻结

- `requestDrain()` 会串行 drain 队列，直到没有 runnable task。
- 重叠的 drain 请求会合并到同一个 active run。
- runtime 会为最早到期的 `retrying` 任务挂起 timer，并在到期后自动回放。
- `dispose()` 会取消未到期 timer，避免释放后的幽灵执行。

### 3. 根级合同门禁已覆盖运行时边界

- 新增 `workspace-sync-worker-runtime.contract.test.mjs`。
- `test:workspace:contracts` 已纳入 runtime contract。
- 根级 `typecheck` 现在会自动经过这条运行时边界，不再依赖人工单独补跑。

## 对后续波次的影响

- `CP08-4` 后续可以直接围绕真实 handler、远端回执应用与冲突恢复入口推进。
- `notes-notes` 或 desktop runtime 后续接线时，可以直接复用当前 runtime，而不是重新写一套 queue 消费器。
- 当前仍然不能宣称 Step 08 已闭环，因为调度边界尚未落到真实运行时，用户可感知恢复能力也尚未完成。

## 当前剩余阻塞

- 缺少真实远端 transport / handler。
- 缺少 runtime 到 `notes-notes` 或 desktop 的接线。
- 缺少冲突提示、手动 replay 与失败恢复入口。
- 缺少离在线切换与冲突演练验证。

