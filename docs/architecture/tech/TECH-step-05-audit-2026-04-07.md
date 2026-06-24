> Migrated from `docs/review/step-05-保存链可靠性审计-2026-04-07.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 05 保存链可靠性审计

- 日期：`2026-04-07`
- 阶段：`Step 05 / L2`
- 波次：`Wave-B / 第二十六轮推进`
- 本轮主题：`统一刷盘入口收敛`

## 1. 本轮目标

本轮承接上一轮已经完成的“可见性刷盘边界”能力，继续解决保存链中的第二个关键结构问题：手动保存、快捷键保存、页面隐藏刷盘虽然都能触发 `persistActiveNote()`，但它们并没有共享同一条 flush 决策入口，导致保存链语义仍然分裂。

本轮聚焦的真实缺口如下：

1. `flushDraft` 仍以 `shouldFlushOnPageHide` 作为前置条件，手动保存和失败重试被错误地绑定到了“页面隐藏语义”。
2. `NoteEditorPane onSave`、页面命令 `persist-active-note`、`pagehide/visibilitychange(hidden)` 三条入口没有真正收敛为同一执行边界。
3. `saveState === 'error'` 虽然在 store 中已经可重试，但 autosave 计划层没有把它建模为“允许 flush，但不允许重新调度延迟 autosave”的独立状态。

## 2. 实际完成

1. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/services/noteWorkspaceAutosave.ts`
   - 新增 `shouldFlush` 字段，显式区分“允许调度 autosave”和“允许立即 flush”。
   - 将 live dirty note 定义为：`shouldSchedule = true`、`shouldFlush = true`。
   - 将 live error note 定义为：`shouldSchedule = false`、`shouldFlush = true`。
   - 继续约束 deleted / empty / clean note 为完全不可调度、不可 flush。
2. `sdkwork-notes-pc-react/packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx`
   - `flushDraft` 改为仅依赖 `autosavePlan.shouldFlush`。
   - 页面命令运行时的 `persistActiveNote` 改为直接指向 `flushDraft`。
   - `NoteEditorPane` 的 `onSave` 改为直接指向 `flushDraft`。
   - 保持 `pagehide` 与 `visibilitychange(hidden)` 仍经由共享 runtime service 调用同一 `flushDraft`。
3. `sdkwork-notes-pc-react/scripts/workspace-autosave.contract.test.mjs`
   - 新增 `shouldFlush` 断言。
   - 冻结 `saveState === 'error'` 的正确计划结果：允许 flush，不允许重新调度延迟 autosave。
4. `sdkwork-notes-pc-react/scripts/workspace-save-flush-boundary.contract.test.mjs`
   - 新增统一刷盘入口 contract。
   - 冻结“手动保存、快捷键保存、页面隐藏刷盘必须共享 `flushDraft`”这一架构事实。
5. `sdkwork-notes-pc-react/package.json`
   - 将 `workspace-save-flush-boundary.contract.test.mjs` 纳入 `test:workspace:contracts`。
6. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 同步冻结新的 contract 聚合链。

## 3. 先失败后通过的证据

本轮继续严格遵循 TDD 闭环：

1. 先补 `workspace-autosave.contract.test.mjs` 中关于 `shouldFlush` 与 `error` 状态的断言。
2. 再新增 `workspace-save-flush-boundary.contract.test.mjs`，明确要求：
   - `noteWorkspaceAutosave.ts` 必须声明 `shouldFlush`
   - `saveState === 'error'` 必须进入 flush 允许态
   - `flushDraft` 必须基于 `shouldFlush`
   - `persistActiveNote: flushDraft`
   - `onSave={flushDraft}`
3. 首次执行时，失败原因准确指向以下事实：
   - autosave 计划尚未定义 `shouldFlush`
   - 页面仍使用 `shouldFlushOnPageHide`
   - 手动保存和快捷键保存仍通过包装函数间接调用
4. 完成最小实现后，重新执行以下验证并全部通过：

```powershell
node --test --experimental-test-isolation=none scripts/workspace-autosave.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-save-flush-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-autosave-visibility-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-autosave-runtime.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd --filter @sdkwork/notes-notes typecheck
pnpm.cmd typecheck
```

## 4. 架构判断

本轮完成后，保存链的职责边界进一步稳定为：

1. `noteWorkspaceAutosave.ts`
   - 负责纯决策。
   - 明确区分“延迟 autosave 调度资格”和“立即 flush 执行资格”。
2. `noteWorkspaceAutosaveRuntime.ts`
   - 继续负责 timer、`pagehide`、`visibilitychange(hidden)` 三类运行时触发器装配。
   - 不承担保存状态机本身。
3. `NotesWorkspacePage.tsx`
   - 仅保留一个共享执行入口 `flushDraft`。
   - 手动保存、快捷键保存、页面隐藏刷盘都必须经过该入口。

这意味着 Step 05 已完成第二条主链事实：保存链的入口开始从“多个语义相似但判断条件不同的调用点”收敛为“单一 flush 入口 + 多触发器复用”。

## 5. 已控制风险

1. `saveState === 'error'` 不会再被误判为“既不能 schedule，也不能 flush”的死状态。
2. 手动保存与快捷键保存不再复用“页面隐藏专属条件”，减少未来改动时的语义串扰。
3. `pagehide` 与 `visibilitychange(hidden)` 仍保持在共享 runtime 边界，不会重新回灌到页面内联规则。
4. 新 contract 已进入 `test:workspace:contracts` 主链，后续一旦有人把 `onSave`、快捷键保存或页面命令重新改回多入口形式，会直接在总门禁中暴露。

## 6. 仍未完成项

1. `save queue` 尚未建立，当前只是收敛了 flush 入口，不代表已经具备真正的串行保存编排能力。
2. 失败重试、退避、恢复提示和用户可见状态机仍未形成闭环。
3. 切换笔记、危险操作、页面关闭前确认三类高风险场景的 flush 证据矩阵仍不完整。

## 7. 能力闭环判定

- Step 总体等级：`Step 05 / L2`
- 子能力编号：`CP05-2 / 统一刷盘入口`
- 子能力等级：`L4`
- 设计闭环：是
- 实现闭环：是
- 测试闭环：是
- 验证闭环：是
- 文档闭环：是
- 集成闭环：是
- 结论：
  - “统一刷盘入口”这一子能力已经具备 `L4` 级闭环证据。
  - 但 Step 05 的整体目标仍未完成，当前不能把 Step 05 整体从 `L2` 提前提升到完成态。

## 8. 下一轮输入

下一轮建议继续沿 Step 05 推进，优先顺序如下：

1. 在共享 `flushDraft` 入口之上引入真正的 `save queue`，保证并发保存不会重复入队或互相覆盖。
2. 为 `error -> retrying -> recovered` 建立显式状态机与界面反馈语义。
3. 为切换笔记、危险操作、页面关闭前三类高风险场景建立统一 flush 验证矩阵。

