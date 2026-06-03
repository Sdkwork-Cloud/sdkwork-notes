# Step 08 同步任务 payload 冻结审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/packages/sdkwork-notes-sync/src/index.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
- `sdkwork-notes-pc-react/scripts/workspace-sync-state-machine.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-queue.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-write-path.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-worker.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-worker-runtime.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`

## 审计结论

- 本轮未发现新的 P0/P1 级问题。
- `NotesSyncTask` 现在已经不再依赖 `entityId + operation + at` 的弱事实组合，而是带有最小可执行意图。
- schema 1 队列显式失效是可接受的，因为当前队列仍是“远端成功后的同步阴影”，不是本地唯一写入来源。
- 本轮仍然没有把当前 App SDK note 写接口伪装成 replay handler，这一点是正确的风险控制，而不是能力缺失。

## 已确认成立的约束

1. `upsert` 必须携带显式 `patch`。
2. `move` 必须携带显式 `targetParentId`。
3. `delete / restore / permanent-delete` 必须携带显式 `intent`。
4. schema 1 envelope 现在会被视为 legacy 数据并降级为空队列。
5. 所有已接入的 note 主写入路径都会把 `mutation` 写入 queue snapshot。
6. worker、worker runtime、workspace runtime boundary 在新任务合同下仍保持通过。

## 残余风险

- 现在只是“任务足够可执行”，还不是“系统已经可以安全执行这些任务”。
- 若直接把当前 App SDK `save / move / delete / restore / permanentlyDelete` 作为默认 replay handler，仍会重复远端写入。
- `remoteCursor` 仍只具备字段和成功回写入口，不具备真正的 ack apply 合并闭环。
- schema 1 队列失效后，旧的失败/冲突元数据不会被迁移，只会被清空；这在当前 direct-write 模式下是可接受的，但要在文档里保留说明。

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-state-machine.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-queue.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-write-path.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-worker.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-worker-runtime.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

- 下一轮不要跳到 Step 09。
- 下一轮应先补“回放安全性”边界，再谈默认 handler、ack apply 和 conflict/manual replay UI。
