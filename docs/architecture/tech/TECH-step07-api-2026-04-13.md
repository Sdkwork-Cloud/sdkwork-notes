> Migrated from `docs/release/Step07-统一查询API-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step07-统一查询API-2026-04-13

## 发布摘要

`Step 07` 已完成第二个缺口 `CP07-2 / 统一查询 API`。本轮在已冻结的 search schema 之上，补齐了真正可执行的查询函数、排序规则与最小 in-memory search service。

## 本轮新增

1. `sdkwork-notes-pc-react/scripts/workspace-search-query.contract.test.mjs`
2. `sdkwork-notes-pc-react/packages/sdkwork-notes-search/src/index.ts` 中的统一查询 API 与 in-memory service
3. `test:workspace:contracts` 挂接新的 search query contract

## 已冻结能力

1. 文本查询
2. tag / folder 复合过滤
3. `includeTrashed`
4. limit
5. 标题优先的最小排序规则
6. `rebuild()` 可重建的 in-memory search service

## 当前完成度

1. `CP07-1 / 索引文档模型冻结 = L4`
2. `CP07-2 / 统一查询 API = L4`
3. `Step 07` 继续推进，未达 `L4`

## 验证命令

```powershell
node --test --experimental-test-isolation=none scripts/workspace-search-schema.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-search-query.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-search typecheck
pnpm.cmd typecheck
```

