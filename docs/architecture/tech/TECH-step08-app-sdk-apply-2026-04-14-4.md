> Migrated from `docs/release/Step08-app-sdk远程apply目标合同冻结-2026-04-14.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step08-app-sdk远程apply目标合同冻结 - 2026-04-14

## 发布摘要

- 当前上游真实 remote apply 合同仍未实现，但本地已经把 future `app-sdk / app-api` 目标合同冻结为机器可验证的 spec。
- 本轮新增的是 target contract 与 guardrail，不是真实远端执行能力。
- future semantic SDK method 现已明确收敛为 `client.note.remoteApply(noteId, body)`。

## 风险控制

- 本轮不新增本地 placeholder SDK method，不制造 local SDK fork。
- response 只冻结 typed `applied | conflict` 结果；transport failure 继续抛异常，由现有 worker/runtime 承接失败与重试语义。
- 当前不宣称上游 `app-api`、OpenAPI、generator、ack apply、`remoteCursor` 合并或冲突恢复 UI 已完成。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-target-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 发布结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply目标合同冻结 = L3`

下一轮仍需停留在 `CP08-4`，把该 spec 实际落到上游 `app-api / OpenAPI / generator`，再回接本地 bootstrap `apply(request)`。

