# 10. 实施进度 - Step 08 工作区 sync runtime 边界接线 - 2026-04-14

## 本轮结论

- `Step 08` 继续停留在 `CP08-4 / 冲突与失败恢复验证`。
- `notes-sync` 的 worker runtime 已被 `notes-notes` workspace store 通过 package-local 边界真实消费。
- `CP08-4` 整体仍未闭环，但 “queue enqueue -> requestDrain -> bootstrap replay” 这条最小工作区接线主链已成立。

## 本轮新增架构事实

### 1. `notes-notes` 现在拥有 workspace-side sync runtime 边界

- 新增 `createNotesWorkspaceSyncRuntime(...)`。
- `notes-notes` 不再需要直接暴露 `notes-sync` 的内部 runtime 类型给更高层消费。
- runtime 边界仍完全复用 `notes-sync` 运行时，不复制状态机或调度器逻辑。

### 2. workspace store 已建立最小 queue -> runtime 调度链

- 所有 note 队列写入 helper 在 `saveQueue()` 成功后都会请求 drain。
- `initialize()` 成功后也会请求 queued/retrying replay。
- replay 请求失败只回写错误信息，不把工作区初始化整体判定为失败。

### 3. 默认产品实例仍然保持保守

- `createNotesWorkspaceStore(...)` 只透传 `syncRuntime`，默认全局 store 不自动创建 runtime。
- 当前显式避免在没有真实 handler 的前提下制造伪后台同步。
- 因此这仍然是“真实边界接线”，不是“默认生产同步已启用”。

## 对后续波次的影响

- 真实远端 handler 可以直接挂在 `createNotesWorkspaceSyncRuntime(...)` 上，而不必回到 store 内复制调度逻辑。
- app/bootstrap 或 desktop/background 后续只需要解决“在哪个安全边界实例化 runtime”，而不需要重新设计 store 的入队时机。
- 冲突恢复、远端 ack apply 与离在线 smoke 现在都可以围绕已存在的 workspace-side runtime 边界继续推进。

## 当前剩余阻塞

- 缺少真实远端 `execute(task)` handler。
- 缺少远端 ack apply 与 `remoteCursor` 收口。
- 缺少默认 app/bootstrap 或 desktop/background runtime 实例化。
- 缺少冲突提示、手动 replay 与离在线切换验证。
