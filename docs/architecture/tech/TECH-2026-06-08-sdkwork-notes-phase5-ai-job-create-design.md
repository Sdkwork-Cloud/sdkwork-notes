> Migrated from `docs/superpowers/specs/2026-06-08-sdkwork-notes-phase5-ai-job-create-design.md` on 2026-06-24.
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
- `../sdkwork-specs/DATABASE_SPEC.md`
- `../sdkwork-specs/DRIVE_SPEC.md`
- `../sdkwork-specs/TEST_SPEC.md`

## 1. Goal

Phase 5 implements:

```text
POST /app/v3/api/notes/ai_jobs
operationId: aiJobs.create
```

This endpoint creates an auditable Notes AI job record and returns `202 Accepted`. It records the requested AI action, target, prompt/context policy snapshot, idempotency key, and page-source Drive version provenance when the target is a page.

## 2. Scope

In scope:

- Product service method `NotesService::create_ai_job`.
- Notes-owned tables:
  - `notes_ai_job`
  - `notes_ai_job_source`
- Idempotency handling for `Idempotency-Key`.
- Page target validation and source snapshot capture from current `notes_page` Drive references.
- App API DTO, handler, route constant, router registration, route manifest entry, and route tests.

Out of scope:

- No model provider calls.
- No background worker or queue consumer.
- No AI result generation.
- No AI suggestions workflow.
- No Drive content read/write/version lifecycle operation.
- No Notes-owned content revision table.
- No upload, download, object-store, provider, or file lifecycle table.

## 3. Architecture

```text
POST /app/v3/api/notes/ai_jobs
  -> sdkwork-routes-notes-app-api::handlers::create_ai_job
  -> NotesService::create_ai_job
  -> NotesRepository::find_workspace
  -> NotesRepository::find_page               # only for page targets
  -> NotesRepository::find_ai_job_by_idempotency_key
  -> NotesRepository::insert_ai_job
  -> AiJob
```

The service validates the command, resolves the workspace in the current tenant/organization scope, and records an AI job in `queued` status. For `targetType=page`, the service resolves the page through `NotesRepository::find_page` and stores a source row containing:

```text
source_type = page
source_id = page.id
drive_node_id = page.drive_node_id
drive_version_id = page.current_drive_version_id
drive_version_no = page.current_drive_version_no
```

This is a business/audit snapshot, not a Drive revision. Drive remains the authority for file content and version lifecycle.

## 4. API Contract

OpenAPI already declares:

```text
POST /app/v3/api/notes/ai_jobs
operationId: aiJobs.create
request: CreateAiJobRequest
response: 202 AiJob
x-sdkwork-idempotent: true
x-sdkwork-permission: notes.ai_jobs.write
x-sdkwork-audit-event: notes.ai_job.create
```

The App API route accepts the standard `Idempotency-Key` header. Until the later appbase AppContext/IAM integration lands, the local route implementation continues the existing temporary pattern of reading `tenantId`, `organizationId`, and `operatorId` from the request body.

Example request:

```json
{
  "tenantId": "tenant-001",
  "organizationId": "org-001",
  "operatorId": "user-001",
  "workspaceId": "workspace-001",
  "jobType": "summarize",
  "targetType": "page",
  "targetId": "page-001",
  "prompt": "Summarize this page",
  "contextPolicy": {
    "source": "current_page"
  }
}
```

Example response:

```json
{
  "id": "ai-job-5e7d42b6e816a244",
  "workspaceId": "workspace-001",
  "jobType": "summarize",
  "targetType": "page",
  "targetId": "page-001",
  "status": "queued",
  "createdAt": "2026-06-08T00:00:01Z"
}
```

## 5. Idempotency

`aiJobs.create` is retriable. The service stores:

```text
idempotency_key
request_payload_hash
created_by
tenant_id
organization_id
```

The unique idempotency scope is:

```text
tenant_id + organization_id + created_by + idempotency_key
```

Rules:

- Same key and same payload returns the existing job.
- Same key and different payload returns conflict.
- Missing `Idempotency-Key` returns validation error.
- The payload hash is deterministic and based on the normalized command payload used by the service.

## 6. Validation

The first implementation validates:

- `workspaceId` is required and must resolve in the current tenant/organization.
- `jobType` is one of `summarize`, `rewrite`, `extract_tasks`, `answer`, `organize`, `generate`.
- `targetType` is one of `page`, `collection`, `workspace`, `selection`.
- `prompt` is optional and must be at most 8000 characters.
- `contextPolicy`, when present, must be a JSON object.
- `targetType=page` requires `targetId` and stores the current page Drive version snapshot.
- `targetType=collection` requires `targetId`; collection existence is deferred until collection runtime lands.
- `targetType=workspace` does not require `targetId`.
- `targetType=selection` may omit `targetId`; selection details can live in `contextPolicy`.

## 7. Database Design

`notes_ai_job` is a Notes-owned AI command ledger. It records intent, prompt/context snapshots, status, result placeholder, idempotency, and audit fields.

`notes_ai_job_source` is a source-provenance ledger. Its page-source rows record current Drive node/version references for later AI worker execution, citations, and audit.

Neither table owns Drive content versions, storage facts, upload lifecycle, provider configuration, signed URLs, or object metadata.

## 8. Future Upgrade Path

Later slices can add:

- worker claiming and state transitions;
- provider/model routing;
- result persistence and suggestion creation;
- source expansion for collections, selections, linked pages, and semantic retrieval;
- event/outbox publication;
- operation status retrieval and cancellation APIs.

Those additions must preserve the current boundary: Notes owns AI intent, review, governance, and projections; Drive owns page content and version lifecycle.

## 9. Verification

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

- Product test proves AI job creation records page source Drive version provenance.
- Product test proves idempotent replay and conflicting replay behavior.
- Route test proves `POST /app/v3/api/notes/ai_jobs` returns `202 Accepted`.
- Route manifest parity test includes `aiJobs.create`.
- Static scans still block `/notes/notes`, `notes_note`, `notes_note_revision`, and Notes-owned Drive lifecycle terms.

