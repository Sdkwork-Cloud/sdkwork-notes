> Migrated from `docs/step/08-工作区sync-runtime边界接线-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 - 工作区 sync runtime 边界接线 - 2026-04-14

## 本轮目标

- 把 `@sdkwork/notes-sync` 的 worker runtime 通过 `notes-notes` 的 package-local 边界接到真实 workspace store。
- 形成 `入队 -> requestDrain()` 与 `initialize() -> queued/retrying replay` 的最小运行时接线闭环。
- 保持范围收敛，不在没有真实 handler 的前提下默认启用生产 runtime。

## 本轮非目标

- 不接入真实远端 SDK / transport。
- 不在 app/bootstrap 或 desktop background 中默认创建 runtime。
- 不在本轮交付 remote ack apply、冲突提示 UI、手动 replay 入口或离在线切换 smoke。

## 实际落地

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSyncRuntime.ts`
   - 新增 `NotesWorkspaceSyncRuntime` 接口与 `createNotesWorkspaceSyncRuntime(...)` 工厂。
   - `notes-notes` 包现在拥有自己的 workspace-side runtime 边界，但仍复用 `createNotesSyncWorkerRuntime(...)`，没有复制第二套调度逻辑。
2. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts`
   - `NotesWorkspaceStoreDependencies` 新增可选 `syncRuntime`。
   - 新增统一的 `requestSyncDrain()` helper。
   - sync queue 写入 helper 在 `saveQueue()` 成功后会请求 drain，形成 “queue -> runtime” 最小主链。
   - `initialize()` 成功后会请求 queued/retrying replay；若 drain 请求失败，只回写错误信息，不把工作区初始化判成失败。
   - `createNotesWorkspaceStore(...)` 只透传 `syncRuntime`，默认 store 仍不自动创建 runtime。
3. `sdkwork-notes-pc-react/scripts/workspace-sync-runtime-boundary.contract.test.mjs`
   - 新增 3 条 Node contract：
   - `createNotesWorkspaceSyncRuntime(...)` 必须把 queue drain 到完成。
   - `createNote()` 在提供 `syncRuntime` 时，入队后必须触发 `requestDrain()`。
   - `initialize()` 在提供 `syncRuntime` 时，工作区加载后必须触发 `requestDrain()` 以回放既有任务。
4. `sdkwork-notes-pc-react/package.json`
   - 根级 `test:workspace:contracts` 已接入 `workspace-sync-runtime-boundary.contract.test.mjs`。
5. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 已同步冻结新的根级合同脚本编排。

## 验证基线

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 当前等级判断

- `Step 08`：`L2`
- `CP08-4 / 冲突与失败恢复验证`：`L2`
- `CP08-4 / notes-notes 工作区 sync runtime 边界接线`：`L3`

## 仍缺失项

- 仍缺真实 `execute(task)` handler 与鉴权/幂等保护。
- 仍缺远端回执应用链，`remoteCursor` 仍未进入真实业务收口。
- 仍缺默认 app/bootstrap 或 desktop/background runtime 实例化。
- 仍缺冲突提示、手动 replay 与离在线切换 smoke。

## 下一轮最优入口

- 继续停留在 `Step 08 / CP08-4`。
- 优先定义真实远端 handler，并基于 `createNotesWorkspaceSyncRuntime(...)` 在 app 或 desktop 的安全边界上实例化 runtime。
- 在真实 handler 与 ack apply 接好之后，再决定先补冲突恢复入口还是离在线切换 smoke，以最小风险推动 `CP08-4` 进入下一阶段。

