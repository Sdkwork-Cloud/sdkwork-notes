> Migrated from `docs/review/step-06-本地schema与迁移审计-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 06 本地 schema 与迁移审计

- 日期：`2026-04-13`
- 阶段：`Step 06 / L3`
- 波次：`Wave-B / 第三十二轮推进`
- 本轮主题：`本地 workspace schema version + 兼容迁移 + 版本化写回`

## 1. 审计目标

在不把 `Step 06` 提前扩张为“完整本地优先”的前提下，先把 `CP06-1` 的关键决策正式冻结，确保后续搜索、同步和恢复能力都建立在同一条可验证的本地快照契约之上：

1. 本地 workspace snapshot 必须具备显式 schema version。
2. 读取链必须兼容历史原始 shape：`{ notes, folders, drafts }`。
3. 写入链必须只写当前版本信封，而不是继续扩散历史 raw shape。
4. 未知版本或损坏 payload 必须安全降级为空快照，而不是把脏数据继续带入主链。
5. `drafts` 的现有消费语义必须保持不变，避免回归 `CP06-2` 已闭环的恢复入口。

## 2. 本轮实际完成

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-local/src/index.ts`
   - 新增 `NOTES_LOCAL_WORKSPACE_SCHEMA_VERSION = 1`。
   - 新增 `NotesLocalWorkspaceEnvelope`，冻结当前写入格式：
     ```json
     {
       "version": 1,
       "workspace": {
         "notes": [],
         "folders": [],
         "drafts": []
       }
     }
     ```
   - 读取链同时兼容：
     - 历史 raw snapshot：`{ notes, folders, drafts }`
     - 当前 envelope：`{ version, workspace }`
   - 未知版本或损坏 JSON 统一降级为 `createEmptyNotesLocalWorkspaceSnapshot()`。
   - `saveDraft()` 与 `clearDraft()` 只回写当前 envelope，不再写历史 raw 顶层结构。
2. `sdkwork-notes-pc-react/scripts/workspace-local-schema.contract.test.mjs`
   - 新增 schema/migration contract。
   - 冻结以下事实：
     - legacy raw snapshot 可被正确读取。
     - 当前 envelope 可被正确读取。
     - 写回时必定升级为版本化 envelope。
     - unknown version / corrupted payload 走安全空快照分支。
3. `sdkwork-notes-pc-react/package.json`
   - 已把 `workspace-local-schema.contract.test.mjs` 接入根级 `test:workspace:contracts`。
4. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 已同步冻结新的 contract 聚合命令，防止脚本门禁回退。

## 3. 验证证据

本轮 fresh verification：

```powershell
node --test --experimental-test-isolation=none scripts/workspace-local-schema.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-local-recovery.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-local typecheck
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

验证结论：

1. schema contract 已证明“兼容读旧格式 + 只写新格式 + 未知版本安全降级”三条核心边界真实存在。
2. recovery contract 重新通过，说明 `CP06-1` 没有冲掉 `CP06-2` 已冻结的恢复入口。
3. 根级 `pnpm.cmd typecheck` 会重新串起 `test:workspace:contracts`，本轮 contract 已进入真实主门禁。

## 4. 闭环判断

### 4.1 已闭环项

1. `CP06-1 / 本地 schema 与迁移策略 = L4`
   - schema version 已冻结。
   - compatibility read 行为已冻结。
   - 写入格式已冻结。
   - 安全降级策略已冻结。
2. `CP06-2 / 草稿日志与恢复入口 = L4`
   - 本地恢复草稿可读。
   - 恢复入口可见。
   - 恢复回放与放弃动作可执行。

### 4.2 当前等级结论

1. `CP06-1 / 本地 schema 与迁移策略 = L4`
2. `CP06-2 / 草稿日志与恢复入口 = L4`
3. `Step 06` 整体当前提升为 `L3`

当前可以把 `Step 06` 提升到 `L3`，原因是：

1. 本地 schema 与恢复入口这两条基础主链已经都进入 contract 和根门禁。
2. 后续 `CP06-3` 与 `CP06-4` 的实现不再需要重新讨论本地存储格式，可以直接建立在已冻结快照接口之上。

## 5. 剩余差距与下一轮输入

当前最大剩余差距已经收敛为：

1. `CP06-3 / 标准化本地快照接口`
   - 搜索与同步还没有正式消费 `notes / folders / drafts` 的统一本地快照接口。
2. `CP06-4 / 启动恢复 smoke test`
   - 启动恢复、多候选、异常数据矩阵还缺更完整的启动级验证证据。

下一轮最优入口：

1. 先补 `CP06-3`：把 `notes / folders / drafts` 统一暴露为可供搜索和同步消费的标准化本地快照接口。
2. 再补 `CP06-4`：补齐启动恢复 smoke test 与异常矩阵。

