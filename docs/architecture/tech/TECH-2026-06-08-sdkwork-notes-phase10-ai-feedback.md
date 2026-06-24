> Migrated from `docs/superpowers/plans/2026-06-08-sdkwork-notes-phase10-ai-feedback.md` on 2026-06-24.
> Owner: SDKWork maintainers

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI suggestion feedback ledger and expose it through App API create and Backend API list routes.

**Architecture:** Notes owns only the AI feedback governance ledger. The service resolves suggestions and derives workspace/job references, while Drive remains the content/version/storage authority.

**Tech Stack:** Rust, Axum, SQLx, SQLite schema contract tests, SDKWork route manifests, OpenAPI 3.1.2.

---

### Task 1: Product Service Feedback Ledger

**Files:**
- Modify: `services/sdkwork-notes-pages-service/src/domain.rs`
- Modify: `services/sdkwork-notes-pages-service/src/ports.rs`
- Modify: `services/sdkwork-notes-pages-service/src/service.rs`
- Modify: `services/sdkwork-notes-pages-service/src/infrastructure/sql/sqlite_core.sql`
- Modify: `services/sdkwork-notes-pages-service/src/infrastructure/sql/notes_store.rs`
- Test: `services/sdkwork-notes-pages-service/tests/page_service.rs`
- Test: `services/sdkwork-notes-pages-service/tests/sqlite_schema_contract.rs`

- [x] Step 1: Add failing product tests for feedback create/list and invalid feedback type.
- [x] Step 2: Run the focused product test and verify it fails before implementation.
- [x] Step 3: Add feedback domain models, repository methods, service validation, SQLite DDL, SQL mapper, and schema assertions.
- [x] Step 4: Run focused product tests until green.

### Task 2: App API Feedback Create Route

**Files:**
- Modify: `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/dto.rs`
- Modify: `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/handlers.rs`
- Modify: `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/paths.rs`
- Modify: `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/routes.rs`
- Modify: `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/page_routes.rs`
- Modify: `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/route_manifest.rs`
- Modify: `sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json`

- [x] Step 1: Add failing route test for `POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/feedback`.
- [x] Step 2: Run the focused route test and verify it fails with 404.
- [x] Step 3: Add DTO, handler, path constant, router registration, route manifest entry, and manifest test expectation.
- [x] Step 4: Run focused App API route test until green.

### Task 3: Backend API Feedback List Route

**Files:**
- Modify: `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/src/dto.rs`
- Modify: `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/src/handlers.rs`
- Modify: `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/src/paths.rs`
- Modify: `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/src/routes.rs`
- Modify: `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/tests/ai_job_routes.rs`
- Modify: `packages/native-rust/routes/backend-api/sdkwork-routes-notes-backend-api/tests/route_manifest.rs`
- Modify: `sdks/_route-manifests/backend-api/sdkwork-routes-notes-backend-api.route-manifest.json`

- [x] Step 1: Add failing route test for `GET /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/feedback`.
- [x] Step 2: Run the focused route test and verify it fails with 404.
- [x] Step 3: Add DTO, handler, path constant, router registration, route manifest entry, and manifest test expectation.
- [x] Step 4: Run focused Backend API route test until green.

### Task 4: Contract And Documentation Alignment

**Files:**
- Modify: `generated/openapi/notes-app-api.openapi.json`
- Modify: `generated/openapi/notes-backend-api.openapi.json`
- Modify: `docs/schema-registry/tables/003-notes-ai-projections.yaml`
- Modify: `scripts/verify-notes-rust-service-skeleton.test.mjs`
- Modify: `README.md`

- [x] Step 1: Add App and Backend feedback operations to OpenAPI.
- [x] Step 2: Add `AiFeedback`, `AiFeedbackCreateRequest`, and `AiFeedbackPage` schemas where needed.
- [x] Step 3: Add schema registry indexes and README Phase 10 notes.
- [ ] Step 4: Run all verification commands and fix any drift.

