# Step 08 / app-sdk远程apply目标合同冻结 - 2026-04-14

## 本轮目标

在上一轮已经确认“上游真实 remote apply 合同不存在”的基础上，进一步把 future `app-sdk / app-api` 目标合同冻结为本地可审计 spec，避免后续上游实现时出现 method、route、request、response 各自漂移。

## 实际完成

1. `sdkwork-notes-pc-react/contracts/notes-remote-apply-app-sdk-target.contract.json`
   - 新增本地 target contract spec。
   - 冻结 future semantic SDK surface：
     - `client.note.remoteApply(noteId, body)`
   - 冻结 future controller owner 与 route aliases：
     - `NotesAppApiController`
     - `POST /app/v3/api/notes/{noteId}:remoteApply`
     - `POST /app/v3/api/notes/{noteId}/remote-apply`
   - 冻结 future request / response 最小语义：
     - request 显式对齐 `NotesSyncRemoteApplyRequest`
     - response 通过 `outcome = applied | conflict` 区分 typed result
     - transport failure 继续 `throw`
2. `sdkwork-notes-pc-react/scripts/workspace-sync-app-sdk-target-contract.test.mjs`
   - 新增 Node contract，锁定 target spec 的 method、route、request、response 冻结事实。
   - 同时校验该 spec 与 `packages/sdkwork-notes-sync/src/index.ts` 里的 `NotesSyncRemoteApplyRequest` 字段映射保持一致。
3. `sdkwork-notes-pc-react/package.json`
4. `sdkwork-notes-pc-react/scripts/package-scripts-contract.test.mjs`
   - 已把新 contract 纳入根级 `test:workspace:contracts` 与脚本门禁。

## 风险控制

1. 本轮只冻结 target contract，不实现任何本地 placeholder SDK method。
2. 本轮不改变 `notes-sync` runtime、bootstrap、worker 的真实执行路径。
3. 本轮不宣称上游 `app-api`、OpenAPI、generator 已完成。
4. 本轮仍然禁止把当前 `createNote / updateNote / updateNoteContent / move / restore / deleteNote / batchUpdate` 这类 direct-write API 当作 replay handler。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply目标合同冻结 = L3`

## 下一轮入口

1. 按该 spec 在 `legacy-java-plus-app-api` / OpenAPI / generator 闭合真实 `remoteApply(noteId, body)`。
2. 生成真实 SDK method 后，在 shared wrapper 添加最薄 adapter。
3. 最后再把 bootstrap `apply(request)` 接到真实 `client.note.remoteApply(noteId, body)`。
