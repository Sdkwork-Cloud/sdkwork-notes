> Migrated from `docs/release/Step06-本地Schema与迁移-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step06-本地Schema与迁移-2026-04-13

## 版本定位

- 日期：`2026-04-13`
- 波次：`Wave-B / 第三十二轮推进`
- 影响范围：`Step 06 本地 workspace schema 与迁移策略`
- 关联能力：`CP06-1 / 本地 schema 与迁移策略`

## 变更摘要

本轮把 `@sdkwork/notes-local` 的本地 workspace 持久化格式正式冻结为版本化 envelope，并补齐历史 raw snapshot 的兼容读取能力。

当前落地事实：

1. 本地存储拥有显式 `version = 1`。
2. 历史 raw snapshot 仍可读取。
3. 新写入统一落为 `{ version, workspace }`。
4. 未知版本或损坏数据会安全降级为空快照。
5. 现有恢复入口继续消费同一份 `drafts` 语义，没有因为 schema 升级产生回归。

## 代码影响

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-local/src/index.ts`
   - 增加 schema version 常量、envelope 模型、兼容读取与版本化写回。
2. `sdkwork-notes-pc-react/scripts/workspace-local-schema.contract.test.mjs`
   - 新增 schema/migration contract。
3. `sdkwork-notes-pc-react/package.json`
   - 新增 `workspace-local-schema.contract.test.mjs` 到 `test:workspace:contracts`。
4. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 同步冻结脚本门禁。

## 风险控制

1. 通过 contract 明确 legacy read / current write / safe fallback 三条主边界。
2. 通过恢复入口 contract 回归验证，确认 schema 增量没有破坏 `CP06-2`。
3. 通过根级 `pnpm.cmd typecheck` 把新增 contract 纳入真实主门禁。

## 验证摘要

```powershell
node --test --experimental-test-isolation=none scripts/workspace-local-schema.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-local-recovery.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-local typecheck
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

## 发布结论

1. `CP06-1 / 本地 schema 与迁移策略 = L4`
2. `Step 06` 当前提升为 `L3`
3. 下一轮执行入口：继续留在 `Step 06-本地存储层与离线草稿能力一期`
4. 下一轮优先项：`CP06-3 / 标准化本地快照接口`

