> Migrated from `docs/架构/10-实施进度-Step08主写入路径接入收口-2026-04-13.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 10. 实施进度 - Step 08 主写入路径接入收口 - 2026-04-13

## 本轮结论

- `CP08-3 / 主写入路径接入` 已从“只剩永久删除语义待决”的状态，推进为 note 级主写入链完整收口。
- 当前收口覆盖：`createNote / persistActiveNote / toggleFavorite / moveNoteToTrash / restoreNoteFromTrash / moveNote / deleteNotePermanently / clearTrash`。
- `Step 08` 整体仍未闭环，但可以把推进入口从 `CP08-3` 切换到 `CP08-4`。

## 本轮新增架构事实

### 1. Step 08 一期 note operation 已补齐永久删除

- `notes-sync` operation 集已扩展为：
  - `upsert`
  - `delete`
  - `restore`
  - `move`
  - `permanent-delete`
- 这消除了此前“软删除 / 永久删除语义混叠”的架构歧义。

### 2. note 级关键元数据变更已真正进入 queue

- `toggleFavorite()` 不再只是一次直接远端保存，而是已被映射为 `note/upsert` 事实。
- 这使 Step 08 文档里“一期先覆盖关键元数据变更”的要求首次真正落地。

### 3. bulk clear-trash 已在一期内收敛为 per-note task 批量持久化

- `clearTrash()` 当前不引入新的 batch operation。
- 一次清空废纸篓会被展开为多条 `note/permanent-delete` 任务，并在一次 queue snapshot 中落盘。
- 这保持了 worker 后续仍以单 note 任务为最小处理单元。

### 4. `CP08-3` 的验证主链已形成完整证据集

- 状态机合同：operation 事实冻结
- 队列合同：`permanent-delete` 持久化可用
- 写路径合同：8 条 note 级真实写路径全部覆盖
- 包级与根级 typecheck：已证明与 monorepo 现有链路可集成

## 对后续波次的影响

- `CP08-4` 可以不再纠结 operation 语义，而是直接围绕已冻结的五类 operation 实现 worker、回执和失败恢复。
- `clearTrash` 已提前按“多条单 note task”建模，后续 worker 不需要额外引入专用批处理状态机。
- 后续冲突恢复和离在线验证会更聚焦于执行链，而不是继续消耗在主写入映射边界上。

## 剩余阻塞

- 缺少真正消费 queue 的 worker。
- 缺少远端回执应用、失败分类回写和冲突提示入口。
- 缺少离在线切换验证、冲突演练记录与 smoke 证据。

