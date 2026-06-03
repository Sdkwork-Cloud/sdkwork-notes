# Step08-app-sdk远程apply合同缺口审计 - 2026-04-14

## 发布摘要

- 当前 `shell / desktop -> bootstrap -> apply(request)` 顶层注入路径已经存在，但 shared app-sdk 与 `NotesAppApiController` 仍没有 replay-safe remote apply 合同。
- 本轮新增的是合同审计守卫，不是真实远端执行能力。
- 当前 note direct-write API 与 `batchUpdate` 必须继续禁止作为 replay handler 使用。

## 风险控制

- 默认 caller 仍未注入真实 `apply(request)`。
- 当前 note request / result 合同仍缺 `idempotencyKey / localRevision / baseRemoteCursor / mutation / remoteCursor`。
- 当前不宣称 ack apply、`remoteCursor` 合并、冲突恢复 UI 与离在线 smoke 已完成。

## 验证

```powershell
node --test --experimental-test-isolation=none scripts/workspace-sync-app-sdk-contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-store-bootstrap.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-runtime-boundary.contract.test.mjs
node --test --experimental-test-isolation=none scripts/workspace-sync-remote-apply.contract.test.mjs
node --test --experimental-test-isolation=none scripts/package-scripts-contract.test.mjs
pnpm.cmd test:workspace:contracts
pnpm.cmd typecheck
```

## 发布结论

- `Step 08 = L2`
- `CP08-4 / 冲突与失败恢复验证 = L2`
- `CP08-4 / app-sdk远程apply合同缺口审计 = L3`

下一轮仍需停留在 `CP08-4`，先完成上游 `app-api / OpenAPI / generator` 合同闭环，再回接本地 bootstrap `apply(request)`。
