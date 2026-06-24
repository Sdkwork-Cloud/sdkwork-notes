> Migrated from `docs/release/Step08-工作区同步队列状态可视化与手动drain入口-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step08-工作区同步队列状态可视化与手动drain入口 - 2026-04-14

## 本轮发布内容

- `notes-sync` 的 browser queue store 已支持订阅最新 queue snapshot。
- `notes-notes` 工作区 store 已新增 `syncQueueSnapshot` 与 `requestSyncDrain()`。
- 工作区 selector / presentation model / insights panel 已串起同步卡片：
  - 状态
  - 徽章
  - 明细
  - 可选手动 drain 入口
- 国际化资源已补齐 `notes.sync.*` 与 `notes.actions.retrySync`。

## 风险与限制

- 当前同步卡片反映的是本地 queue state，不是远端 ack state。
- 当前手动 drain 入口只是请求已有 runtime 继续 drain；如果没有注入 runtime，它不会伪造成功。
- 当前仍没有：
  - 真实 `remoteApply`
  - ack apply / `remoteCursor` 合并闭环
  - 真实 conflict recovery UI
  - 离线/在线切换 smoke

## 验证基线

```powershell
node --test --experimental-test-isolation=none scripts/workspace-view-model.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-page-presentation-model.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 当前状态

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / 工作区同步队列状态可视化与手动drain入口 = L3`

## 下一轮发布入口

- 优先补真实恢复语义与真实 transport 闭环。
- 在那之前，本轮同步卡片只应被视为用户可见状态护栏，不应被视为 `CP08-4` 完成。

