> Migrated from `docs/架构/10-实施进度-Step08同步任务payload冻结-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10 实施进度 - Step08 同步任务 payload 冻结 - 2026-04-14

## 变更摘要

- `NotesSyncTask` 新增 `mutation` 合同，并把同步队列 schema 升级到 `2`。
- `notes-notes` 已在所有已接入的 note 主写入路径中写入显式 `mutation`。
- worker、worker runtime、workspace runtime boundary 的现有合同已适配新任务结构并继续通过。

## 当前架构事实

1. `@sdkwork/notes-sync` 现在冻结的是“带可执行意图的任务模型”，不是只有 operation 名称的元数据记录。
2. queue schema 1 被视为 legacy envelope，会在读取时直接降级为空队列。
3. 该降级策略在当前 direct-write 前提下是安全的，因为旧任务并非未发送的本地权威写入。
4. `notes-notes` 当前只负责产出正确 `mutation`，仍不默认创建真实 replay handler。

## 影响范围

- `packages/sdkwork-notes-sync`
- `packages/sdkwork-notes-notes`
- `scripts/workspace-sync-*`
- `docs/step/08-*`

## 仍未完成

- replay-safe transport / idempotency 边界
- 真实远端 ack apply / `remoteCursor` 合并
- 默认 runtime 实例化策略
- conflict / manual replay 入口

## 状态判定

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 同步任务 payload 冻结 = L3`

