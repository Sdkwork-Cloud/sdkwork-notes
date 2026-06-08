# SDKWork Notes Phase 5 AI Job Create Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `POST /app/v3/api/notes/ai_jobs` as an auditable, idempotent AI job creation endpoint with page-source Drive version provenance.

**Architecture:** `sdkwork-routes-notes-app-api` decodes the App API request and delegates to `NotesService::create_ai_job`. The product service validates the command, resolves the workspace and page target when applicable, handles idempotency, and persists `notes_ai_job` plus initial `notes_ai_job_source` rows through `NotesRepository`.

**Tech Stack:** Rust 2021, Axum 0.7, Tokio, SQLx AnyPool/SQLite tests, Serde, SDKWork route manifest JSON, Node.js static contract tests.

---

## File Structure

Modify:

- `docs/schema-registry/tables/003-notes-ai-projections.yaml`: record idempotency columns and product-owned initial AI job source writes.
- `services/sdkwork-notes-product/src/domain.rs`: add AI job domain models and command structs.
- `services/sdkwork-notes-product/src/ports.rs`: add AI job repository methods.
- `services/sdkwork-notes-product/src/service.rs`: add `NotesService::create_ai_job`.
- `services/sdkwork-notes-product/src/infrastructure/sql/sqlite_core.sql`: add `notes_ai_job` and `notes_ai_job_source`.
- `services/sdkwork-notes-product/src/infrastructure/sql/notes_store.rs`: add AI job SQL mapping and insert/read methods.
- `services/sdkwork-notes-product/tests/sqlite_schema_contract.rs`: assert AI job tables and Drive reference boundaries.
- `services/sdkwork-notes-product/tests/page_service.rs`: add product service AI job tests.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/dto.rs`: add AI job request/response DTOs.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/handlers.rs`: add `create_ai_job`.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/paths.rs`: add `AI_JOBS`.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/routes.rs`: register AI job route.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/page_routes.rs`: add route assertions.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/route_manifest.rs`: include `POST /app/v3/api/notes/ai_jobs`.
- `sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json`: add manifest entry.
- `scripts/verify-notes-rust-service-skeleton.test.mjs`: include the implemented AI job operation.
- `README.md`: add Phase 5 checkpoint and route.

Do not modify:

- Generated SDK transport output.
- Drive SDK output or Drive-owned schema.
- Notes page content/version lifecycle tables.
- Application runtime config under client roots.

## Task 1: Product AI Job RED

- [ ] Add a failing product service test named `ai_job_creation_records_page_source_drive_version_provenance_and_idempotency`.
- [ ] The test should create a workspace/page, update page content to a second Drive version, and call `service.create_ai_job`.
- [ ] Assert:
  - returned job status is `queued`;
  - source row records page id, Drive node id, current Drive version id, and current Drive version number;
  - same idempotency key and same payload returns the same job;
  - same idempotency key and different payload returns conflict.
- [ ] Run:

```powershell
cargo test -p sdkwork-notes-product ai_job_creation_records_page_source_drive_version_provenance_and_idempotency
```

Expected: fail because AI job domain/service/repository methods do not exist.

## Task 2: Product AI Job GREEN

- [ ] Add domain structs:
  - `AiJobType`
  - `AiJobTargetType`
  - `AiJob`
  - `AiJobSource`
  - `CreateAiJobCommand`
  - `NewAiJob`
  - `NewAiJobSource`
- [ ] Add repository methods:
  - `find_ai_job_by_idempotency_key`
  - `insert_ai_job`
- [ ] Add SQLite tables and mapping code.
- [ ] Implement `NotesService::create_ai_job`.
- [ ] Re-run:

```powershell
cargo test -p sdkwork-notes-product ai_job_creation_records_page_source_drive_version_provenance_and_idempotency
cargo test -p sdkwork-notes-product
```

Expected: product tests pass.

## Task 3: Route AI Job RED

- [ ] Add route test assertion for:

```text
POST /app/v3/api/notes/ai_jobs
Idempotency-Key: ai-job-create-001
```

- [ ] Assert response status is `202`, `status` is `queued`, and replay with the same key returns the same job id.
- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-app-api app_api_routes_create_page_and_update_drive_backed_content
```

Expected: fail with 404 before route implementation.

## Task 4: Route AI Job GREEN

- [ ] Add `CreateAiJobRequest` and `AiJobResponse` DTOs.
- [ ] Add handler `create_ai_job` that reads `Idempotency-Key` and delegates to the service.
- [ ] Add `AI_JOBS` path constant and route registration.
- [ ] Re-run route tests.

## Task 5: Manifest And Static Verification

- [ ] Update route manifest parity expected operations to include:

```text
POST /app/v3/api/notes/ai_jobs
```

- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-app-api route_manifest_matches_app_openapi_operations
```

Expected: fail because manifest is missing `aiJobs.create`.

- [ ] Add manifest entry with:
  - `operationId: aiJobs.create`
  - `permission: notes.ai_jobs.write`
  - request schema `CreateAiJobRequest`
  - response schema `AiJob`
  - handler name `create_ai_job`
- [ ] Update the Node static route manifest test expected set.

## Task 6: Documentation And Full Verification

- [ ] Update `README.md` with Phase 5 route, design, plan, and verification status.
- [ ] Run:

```powershell
cargo fmt -p sdkwork-notes-product -p sdkwork-routes-notes-app-api -- --check
cargo test -p sdkwork-notes-product
cargo test -p sdkwork-routes-notes-app-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
cargo test --workspace
```

- [ ] Record verification evidence and remaining gaps.
