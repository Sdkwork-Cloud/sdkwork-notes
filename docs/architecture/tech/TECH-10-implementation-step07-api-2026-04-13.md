> Migrated from `docs/架构/10-实施进度-Step07统一查询API-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10-实施进度-Step07统一查询API-2026-04-13

## 背景

在 `CP07-1 / 索引文档模型冻结 = L4` 之后，`Step 07` 的最佳下一步是补齐统一查询 API。否则：

1. `notes-search` 仍然只是 schema 定义，无法被 UI 真正消费。
2. 顶部搜索和命令面板仍需要各自保留本地过滤逻辑。
3. 后续 UI 接线会再次争论排序和过滤边界。

## 实施内容

1. 新增 `workspace-search-query.contract.test.mjs`
2. 在 `@sdkwork/notes-search` 中实现 `searchNotesSearchDocuments(...)`
3. 在 `@sdkwork/notes-search` 中实现 `createInMemoryNotesSearchService(...)`
4. 将新 contract 接入根级 `test:workspace:contracts`

## 当前状态

1. `CP07-1 / 索引文档模型冻结 = L4`
2. `CP07-2 / 统一查询 API = L4`
3. `CP07-3 / 顶部搜索与命令面板接入 = pending`
4. `CP07-4 / 性能与验证基线 = pending`
5. `Step 07` 暂不宣称 `L4`

## 本轮查询能力

### 统一过滤能力

当前查询 API 已支持：

1. 文本匹配
2. tag 过滤
3. folder 过滤
4. `includeTrashed`
5. `limit`

### 统一排序规则

当前最小排序规则已冻结为：

1. 标题命中优先
2. 正文命中次之
3. 收藏项轻量加权
4. 非 trash 优先
5. 同分按 `updatedAt` 排序

### 统一 service 边界

`createInMemoryNotesSearchService(...)` 使后续 UI 可以直接依赖统一 search service，而不是在页面层保留零散过滤逻辑。

## 对后续 Step 的价值

完成本轮后，`Step 07` 已具备：

1. 稳定的 search schema
2. 稳定的 query API
3. 可重建的最小 search service
4. 根级 contract 门禁

这意味着下一轮 `CP07-3` 可以专注于接入顶部搜索与命令面板，而不需要再改动搜索包的基础查询语义。

