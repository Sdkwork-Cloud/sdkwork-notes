> Migrated from `docs/架构/10-实施进度-Step07性能与验证基线-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度-Step07性能与验证基线-2026-04-13

## 背景

在 `CP07-1` 到 `CP07-3` 完成后，`Step 07` 最后缺的不是更多搜索功能，而是“可量化地证明当前方案没有退化”。否则：

1. `notes-search` 只有能力，没有可重复的 10k 级证据。
2. 顶部搜索与命令面板虽然已接线，但无法回答性能是否达标。
3. `Step 07` 仍然只能停留在 `L3`。

## 实施内容

1. 新增 `workspace-search-performance.contract.test.mjs`
2. 冻结 `10k notes + 1k trash + 200 folders` 数据集
3. 冻结索引构建、统一查询、顶部搜索和命令面板搜索四个 P95 指标
4. 将新性能 contract 接入根级 `test:workspace:contracts`

## 当前测量

### 固定阈值

1. `buildNotesSearchDocuments(...) < 250ms`
2. `searchNotesSearchDocuments(...) < 150ms`
3. `getVisibleNotes(...) < 150ms`
4. `buildNoteWorkspaceCommandPaletteItems(...) + getCommandPaletteMatches(...) < 100ms`

### 本轮测量值

1. `buildMsP95 = 19.90ms`
2. `queryMsP95 = 11.18ms`
3. `visibleMsP95 = 20.72ms`
4. `commandPaletteMsP95 = 31.03ms`

## 当前状态

1. `CP07-1 / 索引文档模型冻结 = L4`
2. `CP07-2 / 统一查询 API = L4`
3. `CP07-3 / 顶部搜索与命令面板接入 = L4`
4. `CP07-4 / 性能与验证基线 = L4`
5. `Step 07 = L4`

## 对后续 Step 的价值

完成本轮后，搜索一期不再只是“能运行”，而是已经具备：

1. 冻结的数据模型
2. 冻结的统一查询语义
3. 已接线的 UI service/model
4. 冻结的 10k 级性能回归门禁

这意味着后续 `Step 08` 或 `Step 11` 若要继续扩展搜索、同步或大规模性能治理，可以直接在当前基线上量化收益与回退。

