# SDKWork Notes Phase 8 AI Suggestion Decision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accept/reject lifecycle commands for AI suggestions without writing Drive content or creating Notes-owned revisions.

**Architecture:** Extend `sdkwork-notes-product` with command structs, repository transition methods, and service state-machine validation over the existing `notes_ai_suggestion` ledger. Add App API and Backend API routes for suggestion decisions, then update OpenAPI, route manifests, docs, and static verification expectations.

**Tech Stack:** Rust 2021, Axum 0.7, SQLx AnyPool/SQLite tests, Serde, SDKWork route manifests, OpenAPI 3.1.2 skeletons, Node.js static contract tests.

---

## File Structure

Modify:

- `services/sdkwork-notes-product/src/domain.rs`: add accept/reject command structs.
- `services/sdkwork-notes-product/src/ports.rs`: add repository methods for suggestion lookup and status transition.
- `services/sdkwork-notes-product/src/service.rs`: add accept/reject use cases and state-machine helper.
- `services/sdkwork-notes-product/src/infrastructure/sql/notes_store.rs`: implement SQL transition with tenant/org predicates.
- `services/sdkwork-notes-product/tests/page_service.rs`: add product decision lifecycle test.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/*`: add app accept/reject DTO/handlers/routes/path constants.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/*`: add app route test and manifest parity.
- `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/src/*`: add backend accept/reject DTO/handlers/routes/path constants.
- `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/tests/*`: add backend route test and manifest parity.
- `generated/openapi/notes-app-api.openapi.json`: add app suggestion decision operations.
- `generated/openapi/notes-backend-api.openapi.json`: add backend suggestion decision operations and `AiSuggestion` schema if missing.
- `sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json`: add app route entries.
- `sdks/_route-manifests/backend-api/sdkwork-routes-notes-backend-api.route-manifest.json`: add backend route entries.
- `scripts/verify-notes-rust-service-skeleton.test.mjs`: update route expectations.
- `README.md`: add Phase 8 checkpoint.

Do not modify:

- Generated SDK transport output.
- Drive SDK output or Drive-owned schema.
- Notes-owned revision/version tables.
- Upload/object/storage lifecycle tables.

## Task 1: Product RED

- [ ] Add a failing product test named `ai_suggestion_decisions_accept_reject_and_conflict`.
- [ ] Seed two proposed suggestions through existing AI job complete flow.
- [ ] Accept the first suggestion and assert status is `accepted`.
- [ ] Accept the first suggestion again and assert idempotent `accepted`.
- [ ] Reject the second suggestion and assert status is `rejected`.
- [ ] Reject the accepted first suggestion and assert conflict.
- [ ] Run:

```powershell
cargo test -p sdkwork-notes-product ai_suggestion_decisions_accept_reject_and_conflict
```

Expected: fail because command and service methods do not exist.

## Task 2: Product GREEN

- [ ] Add `AcceptAiSuggestionCommand` and `RejectAiSuggestionCommand`.
- [ ] Add repository methods `find_ai_suggestion` and `decide_ai_suggestion`.
- [ ] Implement service methods `accept_ai_suggestion` and `reject_ai_suggestion`.
- [ ] Enforce `proposed -> accepted/rejected`, same terminal idempotency, opposite terminal conflict.
- [ ] Re-run:

```powershell
cargo test -p sdkwork-notes-product ai_suggestion_decisions_accept_reject_and_conflict
cargo test -p sdkwork-notes-product
```

Expected: product tests pass.

## Task 3: App Route RED/GREEN

- [ ] Add app route test for:

```text
POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/accept
POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/reject
```

- [ ] Add `AiSuggestionDecisionRequest` DTO.
- [ ] Add path constants, handlers, and router entries.
- [ ] Update app route manifest and parity test.
- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-app-api
```

Expected: app route tests pass.

## Task 4: Backend Route RED/GREEN

- [ ] Add backend route test for:

```text
POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/accept
POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/reject
```

- [ ] Add backend DTO/handlers/routes/path constants.
- [ ] Update backend route manifest and parity test.
- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-backend-api
```

Expected: backend route tests pass.

## Task 5: Contract And Static Verification

- [ ] Update App and Backend OpenAPI skeletons with implemented operations and schemas.
- [ ] Update route manifest artifacts.
- [ ] Update static verifier route expectations.
- [ ] Run:

```powershell
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
```

Expected: Node checks pass.

## Task 6: Documentation And Full Verification

- [ ] Update `README.md` with Phase 8 route and database boundary.
- [ ] Run:

```powershell
cargo fmt -p sdkwork-notes-product -p sdkwork-routes-notes-app-api -p sdkwork-routes-notes-backend-api -- --check
cargo test -p sdkwork-notes-product
cargo test -p sdkwork-routes-notes-app-api
cargo test -p sdkwork-routes-notes-backend-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
```

- [ ] Record verification evidence and remaining gaps.
