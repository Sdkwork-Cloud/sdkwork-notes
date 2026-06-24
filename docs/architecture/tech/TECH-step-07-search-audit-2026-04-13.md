> Migrated from `docs/review/step-07-顶部搜索与命令面板接入审计-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 07 顶部搜索与命令面板接入审计 - 2026-04-13

## 结论

- `CP07-3 / 顶部搜索与命令面板接入 = L4`
- `Step 07` 继续推进，暂不宣称 `L4`

## 审计范围

本轮只审计 `Step 07` 的第三个缺口 `CP07-3`，目标不是继续扩展搜索 schema 或查询 API，而是确认 UI service/model 层已经真正消费共享搜索能力：

1. 顶部搜索不再停留在页面侧本地字符串过滤。
2. 命令面板 note/folder 候选不再与顶部搜索维持两套独立检索边界。
3. `notes-search` 已成为本轮工作区搜索接线的唯一事实来源。

## 本次交付

### 合同更新

- `sdkwork-notes-pc-react/scripts/workspace-view-model.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-command-palette.contract.test.mjs`

新增 contract 冻结以下事实：

1. 顶部搜索可以通过 folder path 命中 note。
2. 命令面板有查询词时只保留匹配的 note/folder 候选。
3. 命令面板 note 候选必须携带 folder path 关键词，并继承共享搜索分数加权。

### 服务层实现

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSelectors.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceCommandPaletteModel.ts`

本轮实现将 `notes-search` 接入到两个既有 service model：

1. `getVisibleNotes(...)`
2. `buildNoteWorkspaceCommandPaletteItems(...)`

### 运行时边界

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/package.json`
- `sdkwork-notes-pc-react/tsconfig.base.json`
- `sdkwork-notes-pc-react/vite.config.ts`

以上改动确保 `notes-notes` 能在当前 monorepo 下稳定解析并消费 `@sdkwork/notes-search`。

## 审计判断

### 通过项

1. 顶部搜索与命令面板已经共享同一套 `NotesSearchDocument` 输入边界。
2. folder path 已成为两个入口共同可见的检索信号，不再只存在于搜索包内部。
3. 命令面板保留静态 actions/views，本轮没有把无关 UI 结构调整混入搜索接线。
4. 现有视图语义被保留：`recent` 仍按更新时间排序，`trash` 仍只消费 trash 集合。

### 剩余风险

1. 当前仍是 in-memory search 接线，不代表已完成 `CP07-4` 的性能基线。
2. 本轮没有把 local draft 搜索体验直接暴露到 UI，只完成了共享搜索入口接线。
3. 命令面板 folder 候选仍保留少量本地补足逻辑，用于覆盖“无 note 但文件夹名命中”的情况。
4. 结果高亮、片段解释和更复杂的相关性模型不在本轮范围内。

## 验证记录

```powershell
node --test --experimental-test-isolation=none scripts/workspace-view-model.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-command-palette.contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-search typecheck
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

