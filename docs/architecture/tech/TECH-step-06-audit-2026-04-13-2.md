> Migrated from `docs/review/step-06-本地快照接口审计-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 06 标准化本地快照接口审计
- 日期：`2026-04-13`
- 阶段：`Step 06 / L3`
- 波次：`Wave-B / 第三十三轮推进`
- 本轮主题：`CP06-3 / 标准化本地快照接口`

## 1. 审计目标

在不提前实现真实搜索索引和同步状态机的前提下，先把 `@sdkwork/notes-local` 暴露成稳定、只读、可标准化的本地快照边界，确保后续 `Step 07 / Step 08` 不再直接依赖 `localStorage` envelope 或历史 raw shape。

本轮必须冻结以下事实：

1. 下游只消费统一的 `NotesLocalWorkspaceSnapshot`，而不是自己解析 `{ version, workspace }`。
2. `@sdkwork/notes-local` 必须显式暴露空快照工厂、快照标准化 resolver 和只读 reader 边界。
3. legacy raw snapshot、当前 versioned envelope、加载失败和未知版本都必须收敛到同一条标准化快照路径。
4. reader 只暴露 `notes / folders / drafts` 读侧语义，不把 `saveDraft / clearDraft` 之类写侧职责带给后续搜索与同步包。

## 2. 本轮实际完成

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-local/src/index.ts`
   - 新增 `NotesLocalWorkspaceSnapshotLoader`
   - 新增 `NotesLocalWorkspaceSnapshotReader`
   - 显式导出 `createEmptyNotesLocalWorkspaceSnapshot()`
   - 显式导出 `resolveNotesLocalWorkspaceSnapshot()`
   - 新增 `createNotesLocalWorkspaceSnapshotReader()`
   - 新增默认读侧边界 `notesLocalWorkspaceSnapshotReader`
   - reader 统一把 loader 输出标准化为 `NotesLocalWorkspaceSnapshot`，并在 loader 抛错时安全降级为空快照
2. `sdkwork-notes-pc-react/scripts/workspace-local-snapshot.contract.test.mjs`
   - 新增标准化本地快照 contract
   - 冻结以下行为：
     - `NotesLocalWorkspaceSnapshotReader` 为显式导出接口
     - reader 默认只暴露 `readWorkspaceSnapshot()`
     - 当前 envelope 可以被 reader 正确标准化
     - legacy raw snapshot 可以被 resolver 兼容解析
     - unknown version / loader failure 会降级为空快照
3. `sdkwork-notes-pc-react/package.json`
   - 已把 `workspace-local-snapshot.contract.test.mjs` 接入根级 `test:workspace:contracts`
4. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 已同步冻结新的 contract 聚合命令，防止根门禁回退

## 3. 验证证据

本轮 fresh verification：

```powershell
node --test --experimental-test-isolation=none scripts/workspace-local-snapshot.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-local-schema.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-local-recovery.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-local typecheck
pnpm.cmd typecheck
```

验证结论：

1. `workspace-local-snapshot.contract.test.mjs` 已证明本地快照 reader / resolver / empty snapshot factory 全部进入真实代码边界。
2. `workspace-local-schema.contract.test.mjs` 重新通过，说明 `CP06-3` 没有破坏此前冻结的 schema envelope / migration 约束。
3. `workspace-local-recovery.contract.test.mjs` 重新通过，说明恢复入口仍然消费同一份 `drafts` 语义，没有被新的读侧抽象冲掉。
4. 根级脚本 contract 与 `pnpm.cmd typecheck` fresh pass，说明本轮 contract 已正式进入真实主门禁。

## 4. 闭环判断

### 4.1 已闭环项

1. `CP06-1 / 本地 schema 与迁移策略 = L4`
2. `CP06-2 / 草稿日志与恢复入口 = L4`
3. `CP06-3 / 标准化本地快照接口 = L4`

`CP06-3` 判定为 `L4` 的原因是：

1. 标准化快照 shape 已被显式导出，而不是继续依赖包内隐式函数。
2. 下游现在有独立 reader 边界可消费，不再需要依赖 `NotesLocalStore` 的写侧职责。
3. legacy / current / failure 三种输入分支都已经被 contract 固定。
4. 根级门禁已经覆盖这条新增 contract。

### 4.2 当前阶段结论

1. `Step 06` 整体保持 `L3`
2. 当前唯一剩余核心缺口收敛为：`CP06-4 / 启动恢复 smoke test`

本轮不把 `Step 06` 提升到 `L4`，原因是：

1. 读侧边界已经冻结，但“启动恢复 smoke matrix”还没有形成完整启动级证据。
2. 当前仍缺针对启动恢复路径、异常载荷矩阵和回放入口的更高层 smoke 覆盖。

## 5. 下一轮最优入口

下一轮执行入口切换为：

1. `CP06-4 / 启动恢复 smoke test`

下一轮应聚焦：

1. 把启动恢复链条从“contract + 页面恢复入口”提升为“启动级 smoke matrix”。
2. 补齐正常 payload、legacy payload、corrupted payload、unknown version 等启动恢复矩阵证据。
3. 以 `CP06-4` 收尾 `Step 06`，再决定是否正式切入 `Step 07 / Step 08`。

