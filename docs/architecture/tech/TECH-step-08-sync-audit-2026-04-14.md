> Migrated from `docs/review/step-08-工作区同步阻塞问题恢复动作语义审计-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 工作区同步阻塞问题恢复动作语义审计 - 2026-04-14

## 审计范围

- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceSelectors.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspacePagePresentationModel.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/en-US.ts`
- `sdkwork-notes-pc-react/packages/sdkwork-notes-i18n/src/resources/zh-CN.ts`
- `sdkwork-notes-pc-react/scripts/workspace-view-model.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-page-presentation-model.contract.test.mjs`
- `sdkwork-notes-pc-react/scripts/workspace-page-container-boundary.contract.test.mjs`

## 审计结论

- 本轮没有发现新的 P0 / P1 缺陷。
- 当前实现把“同步阻塞问题如何引导用户恢复”从单一 drain 按钮推进为有区分的动作语义，这是正确方向。
- 当前实现没有把“查看受影响笔记”包装成“问题已恢复”，这一点保持了 Step 08 当前阶段所需的诚实边界。
- 当前实现把 selector、presentation 和页面动作分流串成了单一事实链，避免页面层自行猜测同步恢复策略。

## 已确认成立的约束

1. `syncSummary` 现在会产出主问题关联的：
   - `primaryEntityId`
   - `primaryMessage`
2. 同步卡片的“最新问题”明细现在优先使用 `primaryMessage`，只有消息缺失时才回退到 `primaryCode`。
3. 同步卡片当前 action 语义已冻结为：
   - `failed / conflict + primaryEntityId -> review-note`
   - 否则 `pendingCount > 0 -> retry-sync`
4. 页面容器当前已按 `actionKind` 正确分流：
   - `retry-sync -> requestSyncDrain()`
   - `review-note -> selectNote(actionTargetNoteId)`
5. `notes.actions.reviewSyncIssue` 已进入中英文资源，避免页面继续复用“重试同步”文案误导用户。

## 残余风险

- `review-note` 只是人工恢复入口，不会自动：
  - 合并冲突
  - 重放任务
  - 更新 `remoteCursor`
- 若阻塞任务缺少 `entityId`，当前页面仍无法把用户直接带到受影响笔记。
- 当前 `requestSyncDrain()` 只能继续推进已有 runtime 下的可执行队列，不能解决终态 `failed / conflict`。
- 当前仍没有：
  - 真实 `remoteApply`
  - ack apply / `remoteCursor` 闭环
  - 真实 conflict recovery UI
  - 离线/在线切换 smoke

## 证据

```powershell
node --test --experimental-test-isolation=none scripts/workspace-view-model.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-page-presentation-model.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-page-container-boundary.contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 审计建议

1. 继续保持 `Step 08 / CP08-4 = L2`，不要把“动作更诚实”误写成“恢复已闭环”。
2. 下一轮若继续做 UI，应优先补：
   - 真实 conflict recovery 交互
   - 真实远端回执闭环
   而不是继续增加更多只读状态包装。
3. 在上游 `remoteApply` 未闭环前，仍应继续禁止把当前 direct-write note API 当作 replay handler。

