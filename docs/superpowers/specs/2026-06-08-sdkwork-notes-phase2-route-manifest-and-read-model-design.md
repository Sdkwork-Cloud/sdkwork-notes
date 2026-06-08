# SDKWork Notes Phase 2 Route Manifest And Read Model Design

Date: 2026-06-08
Status: Approved implementation checkpoint
Owner: sdkwork-notes
Related standards:

- `../sdkwork-specs/SOUL.md`
- `../sdkwork-specs/CODE_STYLE_SPEC.md`
- `../sdkwork-specs/NAMING_SPEC.md`
- `../sdkwork-specs/RUST_CODE_SPEC.md`
- `../sdkwork-specs/API_SPEC.md`
- `../sdkwork-specs/WEB_BACKEND_SPEC.md`
- `../sdkwork-specs/DRIVE_SPEC.md`
- `../sdkwork-specs/SDK_SPEC.md`
- `../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`
- `../sdkwork-specs/COMPONENT_SPEC.md`
- `../sdkwork-specs/TEST_SPEC.md`

## 1. Goal

Phase 2 turns the Phase 1 service slice into a SDKWork-standard Rust App API route crate with route manifest evidence and the first Notes read models.

This phase proves these executable facts:

1. Notes App API routes are mounted from a canonical route crate named `sdkwork-routes-notes-app-api`.
2. The route crate publishes a deterministic route manifest under `sdks/_route-manifests/app-api`.
3. Runtime routes and route manifest operations match the owner-authored Notes App OpenAPI authority.
4. Workspace and page list workflows work without adding Notes-owned content, storage, upload, or version lifecycle ownership.

## 2. Scope

In scope:

- Route crate path aligned to `packages/native-rust/routes/app-api/sdkwork-routes-notes-app-api`.
- Route crate module split: `paths.rs`, `routes.rs`, `handlers.rs`, `manifest.rs`, `dto.rs`, `error.rs`, and `state.rs`.
- Normalized route manifest artifact at `sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json`.
- App API read models for:
  - workspace list;
  - workspace bootstrap;
  - workspace page list;
  - page metadata retrieve and patch.
- Product service methods for list/bootstrap metadata workflows.
- Route manifest parity tests against `generated/openapi/notes-app-api.openapi.json`.
- Static scans that block `/notes/notes`, `notes_note`, and Notes-owned Drive lifecycle terms.

Out of scope:

- No production Drive Rust adapter.
- No generated SDK transport output.
- No Open API or Backend API runtime implementation.
- No server binary, IAM middleware, release packaging, or runtime config.
- No Notes-owned revision table or file version lifecycle.
- No AI indexing worker implementation.

## 3. Architecture

```text
sdkwork-routes-notes-app-api
  -> paths.rs canonical App API path constants
  -> routes.rs Axum router composition
  -> handlers.rs HTTP decoding and problem-detail mapping
  -> dto.rs App API request/response DTOs
  -> manifest.rs normalized route manifest include
  -> NotesService
  -> NotesRepository + DrivePageContentPort

sdks/_route-manifests/app-api
  -> sdkwork-routes-notes-app-api.route-manifest.json
  -> route manifest parity with generated/openapi/notes-app-api.openapi.json
```

Handlers remain thin and delegate to `NotesService`. Business rules remain in `sdkwork-notes-product`. Persistence remains limited to Notes workspace/page metadata, while content and versions remain delegated through the Drive port.

## 4. Implemented App API Routes

```text
GET   /app/v3/api/notes/workspaces
POST  /app/v3/api/notes/workspaces
GET   /app/v3/api/notes/workspaces/{workspaceId}/bootstrap
GET   /app/v3/api/notes/workspaces/{workspaceId}/pages
POST  /app/v3/api/notes/workspaces/{workspaceId}/pages
GET   /app/v3/api/notes/pages/{pageId}
PATCH /app/v3/api/notes/pages/{pageId}
GET   /app/v3/api/notes/pages/{pageId}/content
PUT   /app/v3/api/notes/pages/{pageId}/content
```

Every route uses the canonical App API prefix `/app/v3/api`, the domain prefix `/notes`, and resource `pages`. No route uses `/notes/notes`.

## 5. Read Model Behavior

Phase 2 adds these Notes-owned read workflows:

- `list_workspaces`: paginated workspace metadata list scoped by tenant and organization.
- `list_pages`: paginated page summary list scoped to a workspace, with `q` title/snippet search.
- `get_workspace_bootstrap`: workspace metadata, root page summaries, built-in object type summaries, and a change token.
- `update_page_metadata`: page metadata patch for title, favorite state, archive status, and publish status with optimistic concurrency by Notes page metadata version.

The metadata patch intentionally does not call the Drive content port and does not change `current_drive_version_id` or `current_drive_version_no`.

## 6. Drive Boundary

Drive remains the authority for:

- page body bytes;
- Drive node lifecycle;
- Drive file/folder metadata below the Drive abstraction;
- upload sessions;
- storage objects;
- content versions and checkpoints.

Notes stores only:

```text
drive_space_id
drive_node_id
drive_uri
current_drive_version_id
current_drive_version_no
```

The Phase 2 route crate and service source must not introduce:

- `notes_note`;
- `notes_note_revision`;
- Notes-owned revision tables;
- storage provider fields;
- upload session fields;
- provider object keys or bucket identity;
- duplicate upload or presign APIs.

## 7. Temporary Request Context Boundary

Phase 2 handlers continue to accept explicit `tenantId`, `organizationId`, and `operatorId` body/query fields. This is a local/private skeleton boundary for tests only.

Before production exposure, a later runtime phase must replace this with the standard appbase typed AppContext guard and dual-token request-context resolver. That future change must not alter the route path, operationId, response schema, or Drive ownership boundary.

## 8. Verification

Required commands from `sdkwork-notes` root:

```powershell
cargo fmt -p sdkwork-notes-product -p sdkwork-routes-notes-app-api -- --check
cargo test -p sdkwork-notes-product
cargo test -p sdkwork-routes-notes-app-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
cargo test --workspace
```

Acceptance criteria:

- Route manifest operations equal the implemented App API route set.
- Every manifest route exists in the Notes App OpenAPI authority with the same operationId.
- Route crate component spec declares its route manifest and no generated SDK client ownership.
- Service and route source static scans do not find forbidden Notes-owned storage/version names.
- Existing Phase 1 service and contract foundation tests still pass.
