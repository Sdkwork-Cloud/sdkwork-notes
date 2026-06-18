# SDKWork Notes Phase 6 Backend AI Job Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Backend API AI job administration subset: list, retrieve, and cancel AI jobs.

**Architecture:** Add a separate Rust route crate named `sdkwork-routes-notes-backend-api` for `/backend/v3/api/notes/*`. The crate delegates to `NotesService`, which reads and updates `notes_ai_job` through `NotesRepository`; source counts come from `notes_ai_job_source`.

**Tech Stack:** Rust 2021, Axum 0.7, Tokio, SQLx AnyPool/SQLite tests, Serde, SDKWork backend route manifest JSON, Node.js static contract tests.

---

## File Structure

Modify:

- `Cargo.toml`: add the backend route crate workspace member and workspace dependency.
- `services/sdkwork-notes-pages-service/src/domain.rs`: add `AiJobPage`, `ListAiJobsQuery`, and `CancelAiJobCommand`.
- `services/sdkwork-notes-pages-service/src/ports.rs`: add AI job admin repository methods.
- `services/sdkwork-notes-pages-service/src/service.rs`: add list/retrieve/cancel use cases.
- `services/sdkwork-notes-pages-service/src/infrastructure/sql/notes_store.rs`: add AI job list/retrieve/cancel SQL.
- `services/sdkwork-notes-pages-service/tests/page_service.rs`: add product admin behavior test.
- `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/**`: create backend route crate.
- `sdks/_route-manifests/backend-api/sdkwork-routes-notes-backend-api.route-manifest.json`: add backend route manifest.
- `scripts/verify-notes-rust-service-skeleton.test.mjs`: verify backend route crate and manifest.
- `README.md`: add Phase 6 checkpoint and routes.

Do not modify:

- Generated SDK transport output.
- App API route crate except shared verification references if required.
- Drive SDK output or Drive-owned schema.
- Client application runtime config.

## Task 1: Product Backend AI Job RED

- [ ] Add a failing product service test named `backend_ai_job_admin_lists_retrieves_and_cancels_jobs`.
- [ ] The test should create a workspace/page, create an AI job, list AI jobs, retrieve that job, cancel it, and retrieve it again.
- [ ] Assert:
  - list returns `AiJobPage`;
  - `source_count` is `1`;
  - `suggestion_count` is `0`;
  - cancel changes status from `queued` to `canceled`;
  - a second cancel is idempotent.
- [ ] Run:

```powershell
cargo test -p sdkwork-notes-pages-service backend_ai_job_admin_lists_retrieves_and_cancels_jobs
```

Expected: fail because product admin query/command methods do not exist.

## Task 2: Product Backend AI Job GREEN

- [ ] Add domain structs and repository methods.
- [ ] Implement paginated SQL list with optional `workspace_id`.
- [ ] Implement retrieve by tenant/organization/id.
- [ ] Implement cancel status transition with conflict for terminal success/failure states.
- [ ] Re-run:

```powershell
cargo test -p sdkwork-notes-pages-service backend_ai_job_admin_lists_retrieves_and_cancels_jobs
cargo test -p sdkwork-notes-pages-service
```

Expected: product tests pass.

## Task 3: Backend Route RED

- [ ] Create route test first under the new backend route crate.
- [ ] The test should seed an AI job through `NotesService::create_ai_job`, then call:

```text
GET  /backend/v3/api/notes/ai_jobs
GET  /backend/v3/api/notes/ai_jobs/{aiJobId}
POST /backend/v3/api/notes/ai_jobs/{aiJobId}/cancel
```

- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-backend-api
```

Expected: fail before crate/router implementation is complete.

## Task 4: Backend Route GREEN

- [ ] Add crate files:
  - `Cargo.toml`
  - `src/lib.rs`
  - `src/dto.rs`
  - `src/error.rs`
  - `src/handlers.rs`
  - `src/paths.rs`
  - `src/routes.rs`
  - `src/manifest.rs`
  - `src/state.rs`
- [ ] Add DTOs for backend `AiJob`, `AiJobPage`, `PageInfo`, and temporary backend context query.
- [ ] Add handlers for list/retrieve/cancel.
- [ ] Add router builder.
- [ ] Re-run backend route tests.

## Task 5: Backend Manifest And Static Verification

- [ ] Add backend route manifest for:
  - `aiJobs.admin.list`
  - `aiJobs.admin.retrieve`
  - `aiJobs.cancel`
- [ ] Add manifest parity test against `generated/openapi/notes-backend-api.openapi.json`.
- [ ] Update Node static verifier for the backend route crate and manifest.
- [ ] Re-run:

```powershell
cargo test -p sdkwork-routes-notes-backend-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
```

## Task 6: Documentation And Full Verification

- [ ] Update `README.md` with Phase 6 routes, design, plan, and verification status.
- [ ] Run:

```powershell
cargo fmt -p sdkwork-notes-pages-service -p sdkwork-routes-notes-app-api -p sdkwork-routes-notes-backend-api -- --check
cargo test -p sdkwork-notes-pages-service
cargo test -p sdkwork-routes-notes-app-api
cargo test -p sdkwork-routes-notes-backend-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
```

- [ ] Record verification evidence and remaining gaps.
