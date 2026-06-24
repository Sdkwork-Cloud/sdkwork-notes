> Migrated from `docs/superpowers/specs/2026-06-08-sdkwork-notes-phase4-search-query-design.md` on 2026-06-24.
> Owner: SDKWork maintainers

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
- `../sdkwork-specs/TEST_SPEC.md`

## 1. Goal

Phase 4 implements:

```text
GET /app/v3/api/notes/search
operationId: search.query
```

The first implementation is a current Notes metadata/search projection facade over `notes_page`. It returns page summaries plus Drive version provenance so AI and search consumers can understand which Drive content version the result came from.

## 2. Scope

In scope:

- Product service method `NotesService::query_search`.
- Repository method for current page metadata/snippet search.
- Domain response models:
  - `SearchResult`;
  - `SearchResultPage`;
  - `SearchQuery`.
- App API DTOs and handler for `SearchResultPage`.
- Route constant, router registration, and route manifest entry for `search.query`.
- Tests for workspace filtering, keyword filtering, highlights, and Drive version provenance.

Out of scope:

- No full-text search engine.
- No semantic/vector index.
- No background indexing worker.
- No AI job or suggestion queue.
- No new SQL table in this phase.
- No Drive content reads during search.

## 3. Architecture

```text
GET /app/v3/api/notes/search
  -> sdkwork-routes-notes-app-api::handlers::query_search
  -> NotesService::query_search
  -> NotesRepository::search_pages
  -> SearchResultPage
```

`NotesRepository::search_pages` reads current `notes_page` rows only. It searches page `title` and denormalized `snippet`, optionally scoped by `workspace_id`.

Drive content remains Drive-owned. Search results include provenance from page metadata:

```text
source_drive_version_id = current_drive_version_id
source_drive_version_no = current_drive_version_no
```

If a page has no current Drive version id, the API may omit `sourceDriveVersionId`; `sourceDriveVersionNo` remains required and should be `"0"` only for legacy or not-yet-indexed rows. New pages created by the current service have Drive version numbers.

## 4. API Contract

OpenAPI already declares:

```text
GET /app/v3/api/notes/search
operationId: search.query
query:
  workspace_id: optional string
  q: optional string, max 200
  page: optional integer
  page_size: optional integer
response: SearchResultPage
```

Response shape:

```json
{
  "items": [
    {
      "page": {
        "id": "page-001",
        "workspaceId": "workspace-001",
        "title": "Roadmap",
        "snippet": "hello v2",
        "pageKind": "doc",
        "driveNodeId": "drive-node-page-001",
        "currentDriveVersionNo": "2",
        "favorite": false,
        "updatedAt": "2026-06-08T00:00:02Z"
      },
      "highlights": ["Roadmap"],
      "sourceDriveVersionId": "drive-version-page-001-v2",
      "sourceDriveVersionNo": "2"
    }
  ],
  "pageInfo": {
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

## 5. Highlight Behavior

Phase 4 uses deterministic lightweight highlighting:

- If `q` is blank, `highlights` is empty.
- If `q` appears in title, include the title once.
- Else if `q` appears in snippet, include the snippet once.
- Matching is case-insensitive.

This is not final rich-text highlighting. It is a stable, testable placeholder until a dedicated projection/search engine is introduced.

## 6. Pagination

The service validates:

- `page >= 1`;
- `1 <= page_size <= 200`;
- `q` length <= 200 after trimming.

The repository requests one extra row and the service converts that into `PageInfo.has_more`.

## 7. Future Upgrade Path

This phase intentionally keeps search simple. Later phases can replace the repository implementation with:

- `notes_page_search_projection`;
- full-text search;
- semantic vector search;
- hybrid ranking;
- AI-generated summaries and citations;
- stale-index detection by comparing projection source Drive version with current page Drive version.

The API contract remains the same as long as `SearchResultPage` and source Drive version provenance are preserved.

## 8. Verification

Required commands from `sdkwork-notes` root:

```powershell
cargo fmt -p sdkwork-notes-pages-service -p sdkwork-routes-notes-app-api -- --check
cargo test -p sdkwork-notes-pages-service
cargo test -p sdkwork-routes-notes-app-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
cargo test --workspace
```

Acceptance criteria:

- Product test proves `search.query` returns page summaries, highlights, and Drive version provenance.
- Route test proves `/app/v3/api/notes/search` returns `SearchResultPage`.
- Route manifest parity test includes `search.query`.
- Static scans still block `/notes/notes`, `notes_note`, `notes_note_revision`, and Notes-owned Drive lifecycle terms.

