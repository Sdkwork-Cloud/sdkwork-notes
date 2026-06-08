# SDKWork Notes Phase 7 AI Suggestion Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the minimal AI job worker and suggestion ledger loop.

**Architecture:** Extend `sdkwork-notes-product` with a Notes-owned `notes_ai_suggestion` ledger and service methods for claim, complete, and list page suggestions. Extend backend route crate with worker/admin claim and complete commands, and extend app route crate with page suggestion listing.

**Tech Stack:** Rust 2021, Axum 0.7, Tokio, SQLx AnyPool/SQLite tests, Serde, SDKWork route manifests, OpenAPI JSON skeletons, Node.js static contract tests.

---

## File Structure

Modify:

- `generated/openapi/notes-app-api.openapi.json`: add page AI suggestion list operation and schemas.
- `generated/openapi/notes-backend-api.openapi.json`: add AI job claim/complete operations and request schema.
- `services/sdkwork-notes-product/src/domain.rs`: add AI suggestion structs, claim/complete commands, and list query.
- `services/sdkwork-notes-product/src/ports.rs`: add repository methods.
- `services/sdkwork-notes-product/src/service.rs`: add claim/complete/list suggestion use cases.
- `services/sdkwork-notes-product/src/infrastructure/sql/sqlite_core.sql`: add `notes_ai_suggestion`.
- `services/sdkwork-notes-product/src/infrastructure/sql/notes_store.rs`: add SQL implementations and suggestion counts.
- `services/sdkwork-notes-product/tests/page_service.rs`: add product behavior test.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/*`: add app route, DTO, handler, manifest coverage.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/*`: add route and manifest tests.
- `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/src/*`: add backend routes, DTOs, handlers, manifest coverage.
- `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/tests/*`: add route and manifest tests.
- `sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json`: add app route entry.
- `sdks/_route-manifests/backend-api/sdkwork-routes-notes-backend-api.route-manifest.json`: add backend route entries.
- `docs/schema-registry/tables/003-notes-ai-projections.yaml`: add `notes_ai_suggestion`.
- `scripts/verify-notes-rust-service-skeleton.test.mjs`: add route static expectations.
- `README.md`: add Phase 7 checkpoint.

Do not modify:

- Generated SDK transport output.
- Drive SDK output or Drive-owned schema.
- Notes-owned revision/version tables.
- Upload/object/storage lifecycle tables.
- Client application runtime config.

## Task 1: Product RED

- [ ] Add a failing product service test named `ai_job_worker_claims_completes_and_lists_page_suggestions`.
- [ ] The test should create workspace/page/job, claim the job, complete it with one suggestion, retrieve/list the job, and list page suggestions.
- [ ] Assert:
  - claim changes status from `queued` to `running`;
  - complete changes status to `succeeded`;
  - suggestion count is `1`;
  - listed suggestion includes page id, job id, payload, and source Drive version provenance;
  - second complete returns conflict.
- [ ] Run:

```powershell
cargo test -p sdkwork-notes-product ai_job_worker_claims_completes_and_lists_page_suggestions
```

Expected: fail because methods and schema do not exist.

## Task 2: Product GREEN

- [ ] Add domain structs and repository trait methods.
- [ ] Add `notes_ai_suggestion` schema and indexes.
- [ ] Implement claim status transition.
- [ ] Implement complete transaction: validate running job, insert suggestions, update job result/status.
- [ ] Implement list page suggestions with pagination.
- [ ] Update AI job SQL queries to count suggestions.
- [ ] Re-run:

```powershell
cargo test -p sdkwork-notes-product ai_job_worker_claims_completes_and_lists_page_suggestions
cargo test -p sdkwork-notes-product
```

Expected: product tests pass.

## Task 3: Backend Route RED/GREEN

- [ ] Add backend route test for:

```text
POST /backend/v3/api/notes/ai_jobs/{aiJobId}/claim
POST /backend/v3/api/notes/ai_jobs/{aiJobId}/complete
```

- [ ] Add DTOs and handlers for claim/complete.
- [ ] Add path constants and router entries.
- [ ] Update backend route manifest and parity test.
- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-backend-api
```

Expected: backend route tests pass.

## Task 4: App Route RED/GREEN

- [ ] Add app route test for:

```text
GET /app/v3/api/notes/pages/{pageId}/ai_suggestions
```

- [ ] Add DTOs and handler for page suggestion listing.
- [ ] Add path constants and router entry.
- [ ] Update app route manifest and parity test.
- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-app-api
```

Expected: app route tests pass.

## Task 5: Contract, Registry, Static Verification

- [ ] Update App and Backend OpenAPI skeletons with implemented operations and schemas.
- [ ] Update route manifest artifacts.
- [ ] Update schema registry for `notes_ai_suggestion`.
- [ ] Update static verifier route expectations.
- [ ] Run:

```powershell
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
```

Expected: Node checks pass.

## Task 6: Documentation And Full Verification

- [ ] Update `README.md` with Phase 7 routes, database boundary, and verification status.
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
