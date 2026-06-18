# SDKWork Notes Phase 2 Route Manifest And Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Notes App API runtime to the SDKWork Rust route crate pattern and add the first workspace/page read model endpoints.

**Architecture:** Keep `sdkwork-notes-pages-service` as the business service crate and expose App API routes through `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api`. The route crate owns paths, handlers, DTOs, router assembly, and manifest projection; Notes content and versions remain delegated to Drive through `DrivePageContentPort`.

**Tech Stack:** Rust 2021, Axum 0.7, Tokio, SQLx AnyPool/SQLite tests, Serde, SDKWork route manifest JSON, Node.js static contract tests.

---

## File Structure

Create:

- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/Cargo.toml`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/lib.rs`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/paths.rs`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/routes.rs`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/handlers.rs`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/dto.rs`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/error.rs`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/state.rs`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/manifest.rs`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/specs/README.md`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/specs/component.spec.json`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/page_routes.rs`
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/route_manifest.rs`
- `sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json`

Modify:

- `Cargo.toml`
- `services/sdkwork-notes-pages-service/src/domain.rs`
- `services/sdkwork-notes-pages-service/src/ports.rs`
- `services/sdkwork-notes-pages-service/src/service.rs`
- `services/sdkwork-notes-pages-service/src/infrastructure/sql/notes_store.rs`
- `services/sdkwork-notes-pages-service/tests/page_service.rs`
- `scripts/verify-notes-rust-service-skeleton.test.mjs`
- `README.md`

## Task 1: Route Crate Shape

- [ ] Write a failing static test in `scripts/verify-notes-rust-service-skeleton.test.mjs` requiring the route crate package name `sdkwork-routes-notes-app-api`, canonical path, component spec, and route manifest artifact.
- [ ] Run `node --test scripts\verify-notes-rust-service-skeleton.test.mjs` and confirm it fails because the route crate/manifest path is missing or incomplete.
- [ ] Add the route crate manifest, module files, component spec, and route manifest include entrypoint.
- [ ] Re-run the static test and confirm the crate shape requirements pass.

## Task 2: Product Read Models

- [ ] Add a failing product service test in `services/sdkwork-notes-pages-service/tests/page_service.rs` for workspace list pagination, page list search, workspace bootstrap, and metadata patch optimistic concurrency.
- [ ] Run `cargo test -p sdkwork-notes-pages-service read_models_list_bootstrap_and_update_page_metadata_without_drive_content_changes` and confirm the behavior is missing.
- [ ] Add domain query/result structs, repository port methods, SQL store queries, and `NotesService` methods for list/bootstrap/metadata update.
- [ ] Re-run `cargo test -p sdkwork-notes-pages-service`.

## Task 3: App API Read Model Routes

- [ ] Add failing route behavior checks in `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/page_routes.rs` for:
  - `GET /app/v3/api/notes/workspaces`;
  - `GET /app/v3/api/notes/workspaces/{workspaceId}/bootstrap`;
  - `GET /app/v3/api/notes/workspaces/{workspaceId}/pages`;
  - `PATCH /app/v3/api/notes/pages/{pageId}`.
- [ ] Run `cargo test -p sdkwork-routes-notes-app-api app_api_routes_create_page_and_update_drive_backed_content` and confirm the new assertions fail before implementation.
- [ ] Add DTOs, handlers, path constants, and route registrations for the read model endpoints.
- [ ] Re-run `cargo test -p sdkwork-routes-notes-app-api`.

## Task 4: Route Manifest Parity

- [ ] Add a failing manifest parity test in `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/route_manifest.rs` for the Phase 2 implemented route set.
- [ ] Run `cargo test -p sdkwork-routes-notes-app-api route_manifest_matches_phase2_app_openapi_operations` and confirm the manifest is incomplete.
- [ ] Update `sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json` with the Phase 2 route entries and OpenAPI operationIds.
- [ ] Re-run the route manifest test.

## Task 5: Documentation And Verification

- [ ] Update `README.md` with the Phase 2 design, plan, route crate, manifest path, implemented routes, and backend verification commands.
- [ ] Run:

```powershell
cargo fmt -p sdkwork-notes-pages-service -p sdkwork-routes-notes-app-api -- --check
cargo test -p sdkwork-notes-pages-service
cargo test -p sdkwork-routes-notes-app-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
cargo test --workspace
```

- [ ] Record verification evidence and remaining gaps.
