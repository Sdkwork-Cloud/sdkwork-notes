# SDKWork Notes Phase 4 Search Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `GET /app/v3/api/notes/search` as a current Notes metadata/search projection API with Drive version provenance.

**Architecture:** `sdkwork-routes-notes-app-api` decodes the App API request and delegates to `NotesService::query_search`; the product service validates pagination/search input and calls `NotesRepository::search_pages`. Search reads current `notes_page` metadata/snippets and does not read Drive content or create search/index tables in this phase.

**Tech Stack:** Rust 2021, Axum 0.7, Tokio, SQLx AnyPool/SQLite tests, Serde, SDKWork route manifest JSON, Node.js static contract tests.

---

## File Structure

Modify:

- `services/sdkwork-notes-product/src/domain.rs`: add search query/result structs.
- `services/sdkwork-notes-product/src/ports.rs`: add `NotesRepository::search_pages`.
- `services/sdkwork-notes-product/src/service.rs`: add `NotesService::query_search`.
- `services/sdkwork-notes-product/src/infrastructure/sql/notes_store.rs`: add SQL search query.
- `services/sdkwork-notes-product/tests/page_service.rs`: add product service search test.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/dto.rs`: add search query DTO fields and response mappings.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/handlers.rs`: add `query_search`.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/paths.rs`: add `SEARCH`.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/src/routes.rs`: register search route.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/page_routes.rs`: add search route assertions.
- `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api/tests/route_manifest.rs`: include search route.
- `sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json`: add manifest entry.
- `README.md`: add Phase 4 checkpoint and implemented route.

Do not modify:

- generated SDK transport output.
- Drive schema or SDK files.
- SQL schema unless search requires a non-breaking index in a later phase.

## Task 1: Product Search RED

- [ ] Add a failing product service test named `search_query_returns_page_summaries_with_drive_version_provenance`.
- [ ] The test should create two workspaces and pages, update content/snippets, then call `service.query_search`.
- [ ] Assert:
  - keyword results are scoped by `workspace_id`;
  - highlights include a matching title or snippet;
  - `source_drive_version_id` and `source_drive_version_no` come from the current Drive refs;
  - pagination info is returned.
- [ ] Run:

```powershell
cargo test -p sdkwork-notes-product search_query_returns_page_summaries_with_drive_version_provenance
```

Expected: fail because search query models and service method do not exist.

## Task 2: Product Search GREEN

- [ ] Add domain structs:
  - `SearchQuery`
  - `SearchResult`
  - `SearchResultPage`
- [ ] Add repository method `search_pages`.
- [ ] Implement SQL search over `title` and `snippet`, optional `workspace_id`, and one-extra-row pagination.
- [ ] Implement `NotesService::query_search` validation and highlight construction.
- [ ] Re-run:

```powershell
cargo test -p sdkwork-notes-product search_query_returns_page_summaries_with_drive_version_provenance
cargo test -p sdkwork-notes-product
```

Expected: product tests pass.

## Task 3: Route Search RED

- [ ] Add route test assertion for:

```text
GET /app/v3/api/notes/search?tenantId=tenant-001&organizationId=org-001&workspace_id=workspace-001&q=roadmap&page=1&page_size=20
```

- [ ] Assert `items[0].page.id`, `items[0].sourceDriveVersionNo`, and `items[0].highlights`.
- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-app-api app_api_routes_create_page_and_update_drive_backed_content
```

Expected: fail with 404 before route implementation.

## Task 4: Route Search GREEN

- [ ] Add `SearchQueryRequest` or extend query DTO handling for `workspace_id` and `q`.
- [ ] Add response DTO mappings for `SearchResultResponse` and `SearchResultPageResponse`.
- [ ] Add handler `query_search`.
- [ ] Add `SEARCH` path constant and route registration.
- [ ] Re-run route tests.

## Task 5: Manifest And Static Verification

- [ ] Update route manifest parity expected operations to include:

```text
GET /app/v3/api/notes/search
```

- [ ] Run:

```powershell
cargo test -p sdkwork-routes-notes-app-api route_manifest_matches_app_openapi_operations
```

Expected: fail because manifest is missing search route.

- [ ] Add manifest entry with:
  - `operationId: search.query`
  - `permission: notes.search.query`
  - response schema `SearchResultPage`
  - handler name `query_search`
- [ ] Re-run manifest and static verifier.

## Task 6: Documentation And Full Verification

- [ ] Update `README.md` with Phase 4 route, design, plan, and verification status.
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
