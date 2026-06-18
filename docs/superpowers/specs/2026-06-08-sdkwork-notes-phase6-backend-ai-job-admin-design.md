# SDKWork Notes Phase 6 Backend AI Job Admin Design

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

Phase 6 implements the Backend API AI job administration subset:

```text
GET  /backend/v3/api/notes/ai_jobs
GET  /backend/v3/api/notes/ai_jobs/{aiJobId}
POST /backend/v3/api/notes/ai_jobs/{aiJobId}/cancel
```

The goal is to make the AI job ledger operationally inspectable and controllable without adding an AI worker, model provider integration, or Drive lifecycle ownership.

## 2. Scope

In scope:

- Product service methods:
  - `NotesService::list_ai_jobs`
  - `NotesService::get_ai_job`
  - `NotesService::cancel_ai_job`
- Repository methods for AI job list/retrieve/cancel.
- Backend API Rust route crate:
  - `sdkwork-routes-notes-backend-api`
- Backend route manifest for the implemented AI job subset.
- Tests for list, retrieve, cancel, manifest parity, and static route coverage.

Out of scope:

- No AI job execution.
- No worker claiming or leasing.
- No provider/model calls.
- No audit event table in this slice.
- No index job, projection rebuild, export, or Drive orphan diagnostic route.
- No Drive content read/write/version lifecycle operation.

## 3. Architecture

```text
Backend API route
  -> sdkwork-routes-notes-backend-api::handlers
  -> NotesService
  -> NotesRepository
  -> notes_ai_job / notes_ai_job_source
```

The route crate is separate from the App API crate because it serves `/backend/v3/api`, uses backend permissions, and will later plug into backend-admin request-context and IAM policy enforcement.

Until appbase backend AppContext/IAM integration lands, the route crate follows the existing local runtime pattern and accepts temporary `tenantId`, `organizationId`, and `operatorId` query parameters.

## 4. API Contract

Backend OpenAPI already declares:

```text
GET  /backend/v3/api/notes/ai_jobs
operationId: aiJobs.admin.list
permission: notes.backend.ai_jobs.read
response: AiJobPage

GET  /backend/v3/api/notes/ai_jobs/{aiJobId}
operationId: aiJobs.admin.retrieve
permission: notes.backend.ai_jobs.read
response: AiJob

POST /backend/v3/api/notes/ai_jobs/{aiJobId}/cancel
operationId: aiJobs.cancel
permission: notes.backend.ai_jobs.write
response: AiJob
```

The response DTO follows the backend `AiJob` schema:

```json
{
  "id": "ai-job-5e7d42b6e816a244",
  "workspaceId": "workspace-001",
  "jobType": "summarize",
  "targetType": "page",
  "targetId": "page-001",
  "status": "queued",
  "sourceCount": "1",
  "suggestionCount": "0",
  "createdAt": "2026-06-08T00:00:01Z"
}
```

`sourceCount` is calculated from `notes_ai_job_source`. `suggestionCount` is returned as `0` until the AI suggestion runtime table is materialized.

## 5. Cancel Semantics

Cancel is a state transition on the Notes AI job ledger:

- `queued` -> `canceled`
- `running` -> `canceled`
- `canceled` -> `canceled` idempotent success
- `succeeded` / `failed` -> conflict

This slice only changes the Notes ledger status. It does not interrupt an external worker process because workers are not implemented yet.

## 6. Database Boundary

Phase 6 reuses:

```text
notes_ai_job
notes_ai_job_source
```

No new table is required. The backend query path joins or aggregates source count from `notes_ai_job_source`. It must not create Drive lifecycle state, provider facts, upload state, object identifiers, or Notes-owned revision rows.

## 7. Verification

Required commands from `sdkwork-notes` root:

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

Acceptance criteria:

- Product test proves AI job list/retrieve/cancel behavior.
- Backend route test proves list/retrieve/cancel return the backend `AiJob` and `AiJobPage` schemas.
- Backend route manifest test proves the implemented routes match `notes-backend-api.openapi.json`.
- Static scans continue to reject `/notes/notes`, `notes_note`, Notes-owned revisions, and Drive-owned storage lifecycle terms.
