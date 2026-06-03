# Step 08 / 工作区 store bootstrap 调用接线审计 - 2026-04-14

## 审计范围

- `packages/sdkwork-notes-notes/src/bootstrap/notesWorkspaceStoreBootstrap.ts`
- `packages/sdkwork-notes-notes/src/bootstrap/index.ts`
- `packages/sdkwork-notes-notes/src/index.ts`
- `packages/sdkwork-notes-shell/src/application/providers/AppProviders.tsx`
- `packages/sdkwork-notes-shell/src/application/providers/AppProviders.test.tsx`
- `scripts/workspace-store-bootstrap.contract.test.mjs`

## 审计结论

- 本轮实现守住了 session caller wiring 边界，没有把 shell 写成 runtime 细节装配器。
- 本轮没有伪造 `execute(task)` 成功路径，也没有把 `CP08-4` 状态虚报为已闭环。
- reset 路径会在 session 退出或切换时释放旧 runtime，并重置 store 绑定，方向正确。

## 通过项

1. `notes-notes` 通过 facade 暴露 bootstrap 能力，shell 依赖方向正确。
2. `bootstrapNotesWorkspaceStore()` 在未提供 handler 时只显式接 `syncQueueStore`，不会伪造 runtime。
3. `resetNotesWorkspaceStoreBootstrap()` 会 dispose 旧 runtime，再 reset store。
4. `AppProviders` 以认证用户 key 做去重，避免 StrictMode 下重复接线。
5. Node contract 已覆盖 bootstrap 行为和 shell caller boundary。

## 残余风险

1. 真正的 `execute(task)` handler 仍未存在，当前只能证明 caller wiring 到位，不能证明远端执行闭环。
2. 远端 ack 成功后的 `remoteCursor` 与本地状态合并语义仍未定义。
3. desktop/background 若后续接管 runtime 创建，需要与当前 facade 复用同一 queue ownership 语义。

## 建议

1. 下一轮优先把真实 handler 接到 `bootstrapNotesWorkspaceStore({ execute })`。
2. handler 接通后，再定义 remote ack apply 和冲突/失败的 UI 呈现，不要反向先做 UI。
3. 在进入 Step 09 前，继续把 `CP08-4` 保持在 `L2`，直到 runtime caller 与真实执行闭环都具备。
