> Migrated from `docs/release/Step06-启动恢复smoke-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step06-启动恢复smoke-2026-04-13

## 发布摘要

`Step 06` 已完成最后一项缺口 `CP06-4 / 启动恢复 smoke test`，本轮重点是把现有启动恢复链路固化为可重复执行的 contract，而不是再引入新的离线功能。

## 本轮新增

1. `sdkwork-notes-pc-react/scripts/workspace-startup-recovery-smoke.contract.test.mjs`
2. `test:workspace:contracts` 挂接新的启动恢复 smoke contract

## 已验证场景

1. 当前版本 envelope 启动恢复
2. legacy raw snapshot 启动恢复
3. unknown version 降级为空恢复状态
4. corrupted payload 降级为空恢复状态
5. 本地读取失败降级为空恢复状态
6. trash / missing 草稿在启动时被过滤

## 当前完成度

1. `CP06-1 / 本地 schema 与迁移策略 = L4`
2. `CP06-2 / 草稿日志与恢复入口 = L4`
3. `CP06-3 / 标准化本地快照接口 = L4`
4. `CP06-4 / 启动恢复 smoke test = L4`
5. `Step 06 = L4`

