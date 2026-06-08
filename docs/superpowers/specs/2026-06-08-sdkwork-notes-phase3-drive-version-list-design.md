# SDKWork Notes Phase 3 Drive Version List Design

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

Phase 3 implements the first Drive-owned version read workflow through the Notes App API facade:

```text
GET /app/v3/api/notes/pages/{pageId}/versions
operationId: pages.versions.list
```

The endpoint lets Notes clients list the Drive node versions for a page without creating any Notes-owned revision model.

## 2. Scope

In scope:

- Product service method `NotesService::list_page_versions`.
- Drive port method `DrivePageContentPort::list_page_content_versions`.
- Domain models for Drive version summaries and paginated Drive version pages.
- App API DTOs and handler for `DriveVersionPage`.
- Route constant, router registration, and route manifest entry for `pages.versions.list`.
- Product and route tests using fake Drive data.
- Static/contract verification that no `notes_note_revision`, `notes_revision`, upload lifecycle, or object-storage lifecycle ownership is introduced.

Out of scope:

- No Notes database table for versions.
- No Notes-owned revision snapshots.
- No Drive SQL/schema changes.
- No production Drive Rust adapter.
- No generated SDK transport output.
- No download grant or restore/checkpoint route.

## 3. Architecture

```text
GET /app/v3/api/notes/pages/{pageId}/versions
  -> sdkwork-routes-notes-app-api::handlers::list_page_versions
  -> NotesService::list_page_versions
  -> NotesRepository::find_page
  -> DrivePageContentPort::list_page_content_versions
  -> DriveVersionPage
```

Notes performs page lookup first. This confirms the page exists in the caller's tenant/organization scope and resolves the Drive references:

```text
drive_space_id
drive_node_id
drive_uri
current_drive_version_id
```

The Drive port owns version listing. Notes passes Drive identity and pagination parameters to Drive and returns Drive version summaries through the Notes App API contract.

## 4. API Contract

OpenAPI already declares:

```text
GET /app/v3/api/notes/pages/{pageId}/versions
operationId: pages.versions.list
response: DriveVersionPage
```

The response shape is:

```json
{
  "items": [
    {
      "driveVersionId": "drive-version-page-001-v2",
      "driveVersionNo": "2",
      "versionKind": "auto",
      "versionLabel": "Autosave",
      "changeSummary": "Updated page",
      "createdAt": "2026-06-08T00:00:02Z"
    }
  ],
  "pageInfo": {
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

Int64-style version numbers are serialized as strings at the API boundary.

## 5. Drive Boundary

The version list is Drive data exposed through a Notes facade. Notes must not:

- store version history rows;
- duplicate Drive storage object rows;
- store object keys, buckets, provider metadata, upload sessions, or presigned URLs;
- infer version retention policy locally;
- implement restore, checkpoint, or diff lifecycle without a Drive-owned capability.

If Drive later adds version labels, checkpoint metadata, restore commands, or version retention policy APIs, Notes should consume those through the Drive product Rust component or an approved Drive SDK facade.

## 6. Pagination

The endpoint uses the existing standard query parameters:

```text
page
page_size
```

`NotesService` validates:

- `page >= 1`
- `1 <= page_size <= 200`

The Drive port returns one extra item or explicit page info. Phase 3 keeps pagination simple and delegates item ordering to Drive. The fake Drive test returns newest-first versions to match common Drive version history UX.

## 7. Error Model

Expected failures:

- Missing page: `404` via `NotesRepository::find_page`.
- Invalid pagination: `400`.
- Drive authorization or version listing failure: normalized by the Drive adapter into `NotesProductError`, then mapped by the route crate to RFC 9457-style problem details.

The temporary body/query `tenantId`, `organizationId`, and `operatorId` context fields remain a local/private skeleton boundary. Production wiring must replace them with appbase AppContext without changing this API contract.

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

- Product service test proves page version listing delegates to Drive and returns Drive version summaries.
- Route test proves `GET /app/v3/api/notes/pages/{pageId}/versions` returns `DriveVersionPage`.
- Route manifest parity test includes `pages.versions.list`.
- Static scans still block `/notes/notes`, `notes_note`, `notes_note_revision`, and Notes-owned Drive lifecycle terms.
- No SQL table or column is added for Notes-owned revisions.
