# SDKWork Notes Phase 3 Drive Version List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `GET /app/v3/api/notes/pages/{pageId}/versions` as a Notes App API facade over Drive-owned page content versions.

**Architecture:** `sdkwork-routes-notes-app-api` decodes the App API request and delegates to `NotesService::list_page_versions`; the product service resolves the Notes page and calls `DrivePageContentPort::list_page_content_versions`. Notes returns Drive version summaries and never persists revision rows.

**Tech Stack:** Rust 2021, Axum 0.7, Tokio, SQLx AnyPool/SQLite tests, Serde, SDKWork route manifest JSON, Node.js static contract tests.

---

## File Structure

Modify:

- `services/sdkwork-notes-product/src/domain.rs`: add Drive version summary/page/query structs.
- `services/sdkwork-notes-product/src/ports.rs`: add `ListDrivePageContentVersionsCommand` and Drive port method.
- `services/sdkwork-notes-product/src/service.rs`: add `NotesService::list_page_versions`.
- `services/sdkwork-notes-product/tests/page_service.rs`: add product service test and fake Drive version data.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/paths.rs`: add `PAGE_VERSIONS`.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/dto.rs`: add Drive version response DTOs.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/handlers.rs`: add versions handler.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/routes.rs`: register versions route.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/page_routes.rs`: add route behavior assertion and fake Drive implementation.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/route_manifest.rs`: include versions route in expected operations.
- `sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json`: add manifest entry for `pages.versions.list`.
- `README.md`: add Phase 3 checkpoint and implemented route.

Do not modify:

- `services/sdkwork-notes-product/src/infrastructure/sql/sqlite_core.sql`, unless a non-version metadata fix is required.
- generated SDK transport output.
- Drive-owned schema or SDK files.

## Task 1: Product Service RED

- [ ] Add a failing test in `services/sdkwork-notes-product/tests/page_service.rs` named `page_versions_are_listed_from_drive_without_notes_revision_rows`.
- [ ] The test should:
  - create a workspace;
  - create a page;
  - update content once so Drive has versions 1 and 2;
  - call `service.list_page_versions`;
  - assert newest-first Drive version summaries;
  - assert pagination info;
  - assert fake Drive received the page's `drive_space_id`, `drive_node_id`, and `drive_uri`.
- [ ] Run:

```powershell
cargo test -p sdkwork-notes-product page_versions_are_listed_from_drive_without_notes_revision_rows
```

Expected: fail because the service method and Drive port method do not exist.

## Task 2: Product Service GREEN

- [ ] Add domain structs:
  - `ListPageVersionsQuery`
  - `DriveVersionSummary`
  - `DriveVersionPage`
- [ ] Add port command `ListDrivePageContentVersionsCommand`.
- [ ] Add `DrivePageContentPort::list_page_content_versions`.
- [ ] Implement `NotesService::list_page_versions`:
  - validate pagination;
  - lookup page through `NotesRepository::find_page`;
  - pass Drive identity to the Drive port;
  - return Drive's page result unchanged except for standard domain shape.
- [ ] Update existing fake Drive implementations in product tests.
- [ ] Re-run:

```powershell
cargo test -p sdkwork-notes-product page_versions_are_listed_from_drive_without_notes_revision_rows
cargo test -p sdkwork-notes-product
```

Expected: product tests pass.

## Task 3: Route RED

- [ ] Add an assertion in `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/page_routes.rs` for:

```text
GET /app/v3/api/notes/pages/page-001/versions?tenantId=tenant-001&organizationId=org-001&page=1&page_size=20
```

- [ ] Assert response fields:
  - `items[0].driveVersionId == "drive-version-page-001-v2"`
  - `items[0].driveVersionNo == "2"`
  - `items[0].versionKind == "auto"`
  - `pageInfo.page == 1`
- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-app-api app_api_routes_create_page_and_update_drive_backed_content
```

Expected: fail with 404 or missing method before route implementation.

## Task 4: Route GREEN

- [ ] Add DTO mappings for `DriveVersionSummaryResponse` and `DriveVersionPageResponse`.
- [ ] Add handler `list_page_versions`.
- [ ] Add path constant `PAGE_VERSIONS`.
- [ ] Register `GET` route in `routes.rs`.
- [ ] Update route fake Drive implementation.
- [ ] Re-run:

```powershell
cargo test -p sdkwork-routes-notes-app-api app_api_routes_create_page_and_update_drive_backed_content
cargo test -p sdkwork-routes-notes-app-api
```

Expected: route tests pass.

## Task 5: Manifest And Static Verification

- [ ] Update route manifest test expected operations to include:

```text
GET /app/v3/api/notes/pages/{pageId}/versions
```

- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-app-api route_manifest_matches_phase2_app_openapi_operations
```

Expected: fail because manifest is missing the route.

- [ ] Add manifest route entry with:
  - `operationId: pages.versions.list`
  - `permission: notes.pages.versions.read`
  - response schema `DriveVersionPage`
  - handler name `list_page_versions`
- [ ] Re-run route manifest tests and static verifier.

## Task 6: Documentation And Full Verification

- [ ] Update `README.md` with Phase 3 route, design, plan, and verification status.
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
