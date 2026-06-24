> Migrated from `docs/review/step-08-工作区sync-runtime边界接线审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 工作区 sync runtime 边界接线审计

- 日期：`2026-04-14`
- 审计对象：`CP08-4 / 冲突与失败恢复验证`
- 本轮范围：`notes-notes 工作区 sync runtime 边界接线`

## 审计结论

- `notes-sync` 的 worker runtime 现在已经被 `notes-notes` 的真实 workspace store 边界消费，不再只停留在 package-local runtime 本体。
- `createNote()` 和 `initialize()` 已具备真实的 `requestDrain()` 触发证据，`enqueue -> drain` 与 `bootstrap -> replay` 两条最小接线主链成立。
- 本轮子切片可评为 `L3`，但 `CP08-4` 整体仍只能维持 `L2`，因为真实 handler、远端回执应用、默认 runtime bootstrap、冲突恢复 UI 与离在线 smoke 仍未完成。

## 当前等级判断

- `Step 08`：`L2`
- `CP08-4 / 冲突与失败恢复验证`：`L2`
- `CP08-4 / notes-notes 工作区 sync runtime 边界接线`：`L3`

## 闭环判定

### `CP08-4 / notes-notes 工作区 sync runtime 边界接线`

- 设计闭环：是
- 实现闭环：是
- 测试闭环：是
- 验证闭环：是
- 文档闭环：是
- 集成闭环：否

结论：

- 边界本身已形成真实 store 接线，但 runtime 仍是可选注入，不是默认 app/bootstrap 或 desktop/background 主链的一部分。
- 按 `docs/step/95-架构能力闭环验收标准.md` 口径，本子切片达到 `L3`，不能上调到 `L4`。

## 关键证据

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSyncRuntime.ts`
  - 新增 workspace-side `NotesWorkspaceSyncRuntime` 接口与工厂，明确 `notes-notes` 对 `notes-sync` 的边界消费方式。
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
  - store 新增可选 `syncRuntime` 依赖。
  - 队列写入 helper 现在会在 `saveQueue()` 后请求 drain。
  - `initialize()` 成功后现在会请求 queued/retrying replay。
- `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`
  - 已覆盖 runtime 工厂委托、`createNote()` 触发 drain、`initialize()` 触发 replay 三类真实边界语义。
- `sdkwork-notes-pc-react/package.json`
  - `test:workspace:contracts` 已纳入新的 runtime boundary contract。

## 本轮验证结果

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 本轮已冻结的边界语义

1. `notes-notes` 现在拥有独立的 workspace-side `syncRuntime` 接口，不需要直接暴露 `notes-sync` 内部实现细节给页面层。
2. note 队列任务一旦持久化成功，store 就会立即触发 `requestDrain()`，避免“任务进队但无人消费”的空转状态。
3. 工作区初始化完成后，store 会主动请求 drain，允许既有 queued/retrying 任务进入 replay 路径。
4. 默认 store 仍不自动创建 runtime，避免在无真实 handler 时制造伪同步或无效后台执行。

## 风险与剩余缺口

- 当前 `requestDrain()` 只能证明边界接线成立，不能证明真实远端执行链有效。
- 当前没有远端回执应用、cursor 推进与冲突副本处理，失败恢复闭环仍不完整。
- 当前 runtime 没有进入默认 app/bootstrap 或 desktop/background 主链，发布态仍不会自动消费队列。
- 当前没有用户可见的冲突恢复入口，也没有离在线切换 smoke。

## 下一轮建议

1. 先定义真实 `execute(task)` handler，再决定在哪个 bootstrap 边界安全实例化 runtime。
2. 在 handler 接好后补远端 ack apply，明确 `remoteCursor` 与本地状态如何回写。
3. 之后再补冲突恢复入口或离在线切换 smoke，把 `CP08-4` 从“有边界接线”推进到“有真实恢复链”。

