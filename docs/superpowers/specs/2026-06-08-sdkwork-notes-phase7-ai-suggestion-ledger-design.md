# SDKWork Notes Phase 7 AI Suggestion Ledger Design

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

Phase 7 turns the Notes AI job ledger into a minimal executable AI workflow loop:

```text
Backend worker/admin claims a queued AI job
  -> backend records deterministic AI suggestions
  -> job becomes succeeded
  -> app clients list page suggestions
```

This phase does not call an AI provider. It adds the durable Notes-owned suggestion ledger that future model workers can write to after reading Drive-owned page content through approved Drive boundaries.

## 2. Scope

In scope:

- Product service methods:
  - `NotesService::claim_ai_job`
  - `NotesService::complete_ai_job`
  - `NotesService::list_page_ai_suggestions`
- Repository methods for claim, complete, and list suggestions.
- New table:
  - `notes_ai_suggestion`
- Backend API routes:
  - `POST /backend/v3/api/notes/ai_jobs/{aiJobId}/claim`
  - `POST /backend/v3/api/notes/ai_jobs/{aiJobId}/complete`
- App API route:
  - `GET /app/v3/api/notes/pages/{pageId}/ai_suggestions`
- Route manifest and static verifier coverage.

Out of scope:

- No model/provider integration.
- No prompt execution runtime.
- No worker lease timeout or heartbeat.
- No streaming generation.
- No user accept/reject workflow.
- No Drive content read/write/version lifecycle operation.
- No Notes-owned revision/version table.

## 3. Architecture

```text
Backend worker/admin route
  -> sdkwork-routes-notes-backend-api::handlers
  -> NotesService::claim_ai_job / complete_ai_job
  -> NotesRepository
  -> notes_ai_job / notes_ai_suggestion

App route
  -> sdkwork-routes-notes-app-api::handlers
  -> NotesService::list_page_ai_suggestions
  -> NotesRepository
  -> notes_ai_suggestion
```

The backend route crate remains the operational surface. The app route exposes only user-facing suggestions for a page in the caller's tenant and organization scope.

Until appbase AppContext/IAM integration lands, both route crates continue using the existing temporary `tenantId`, `organizationId`, and `operatorId` query/body context pattern.

## 4. API Contract

Backend operations:

```text
POST /backend/v3/api/notes/ai_jobs/{aiJobId}/claim
operationId: aiJobs.claim
permission: notes.backend.ai_jobs.write
response: AiJob

POST /backend/v3/api/notes/ai_jobs/{aiJobId}/complete
operationId: aiJobs.complete
permission: notes.backend.ai_jobs.write
request: CompleteAiJobRequest
response: AiJob
```

App operation:

```text
GET /app/v3/api/notes/pages/{pageId}/ai_suggestions
operationId: pages.aiSuggestions.list
permission: notes.pages.ai_suggestions.read
response: AiSuggestionPage
```

Suggested response shape:

```json
{
  "items": [
    {
      "id": "ai-suggestion-7d3a59e0b6e12a44",
      "workspaceId": "workspace-001",
      "pageId": "page-001",
      "aiJobId": "ai-job-001",
      "suggestionType": "summary",
      "status": "proposed",
      "sourceDriveVersionId": "drive-version-page-001-v2",
      "sourceDriveVersionNo": "2",
      "payload": { "summary": "Launch plan" },
      "createdAt": "2026-06-08T00:00:01Z"
    }
  ],
  "pageInfo": {
    "page": "1",
    "pageSize": "20",
    "hasMore": false
  }
}
```

`sourceDriveVersionId` and `sourceDriveVersionNo` are copied from the AI job source snapshot so users and audits can see which Drive content version produced the suggestion.

## 5. Job State Semantics

Claim:

- `queued` -> `running`
- `running` -> idempotent success when claimed again by the same worker/operator in this minimal phase
- `succeeded` / `failed` / `canceled` -> conflict

Complete:

- Allowed only when job is `running`.
- Inserts one or more suggestions.
- Updates `notes_ai_job.status` to `succeeded`.
- Stores `result_json` as a summary of suggestion count and completion metadata.

Failure handling and retry policies are intentionally deferred. A later phase should add worker leases, heartbeat, failure recording, and retry limits.

## 6. Database Boundary

Phase 7 adds one Notes-owned table:

```text
notes_ai_suggestion
```

This table is a suggestion ledger, not a content version table. It stores:

- tenant and organization scope;
- workspace and page target;
- AI job id;
- suggestion type and status;
- source Drive node/version snapshot;
- suggestion payload JSON;
- lifecycle and audit fields.

It must not store Drive object storage lifecycle facts, upload sessions, provider object keys, buckets, presigned URLs, or page content revisions.

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

- Product tests prove claim/complete/list suggestions behavior.
- Backend route tests prove claim and complete route behavior.
- App route tests prove page suggestion listing.
- Route manifest tests prove implemented routes match OpenAPI operations.
- Static scans continue rejecting `/notes/notes`, `notes_note`, Notes-owned revisions, and Drive-owned storage lifecycle terms.
