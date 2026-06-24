> Migrated from `docs/step/07-性能与验证基线-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 07 性能与验证基线

- 日期: `2026-04-13`
- 轮次: `Wave-B / 第三十八轮推进`
- 关联能力: `CP07-4 / 性能与验证基线`

## 目标

为 `Step 07` 建立可重复的 10k 级搜索基线，确认索引构建、统一查询、顶部搜索和命令面板搜索都具备可量化、可回归的验证入口，而不是停留在“体感可用”。

## 本次改动

### 合同测试

- `sdkwork-notes-pc-react/scripts/workspace-search-performance.contract.test.mjs`

### 门禁接入

- `sdkwork-notes-pc-react/package.json`
- `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`

## 基线范围

本轮基线使用固定数据集：

1. `10,000` 条正常 note
2. `1,000` 条 trash note
3. `200` 个 folder

在同一数据集上冻结以下 P95 指标：

1. `buildNotesSearchDocuments(...) < 250ms`
2. `searchNotesSearchDocuments(...) < 150ms`
3. `getVisibleNotes(...) < 150ms`
4. `buildNoteWorkspaceCommandPaletteItems(...) + getCommandPaletteMatches(...) < 100ms`

## 当前测量

基于本轮同口径临时测量，当前 P95 结果为：

1. `buildMsP95 = 19.90ms`
2. `queryMsP95 = 11.18ms`
3. `visibleMsP95 = 20.72ms`
4. `commandPaletteMsP95 = 31.03ms`

## 当前状态

1. `CP07-1 = L4`
2. `CP07-2 = L4`
3. `CP07-3 = L4`
4. `CP07-4 = L4`
5. `Step 07 = L4`

## 验证命令

```powershell
node --test --experimental-test-isolation=none scripts/workspace-search-performance.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd typecheck
```

