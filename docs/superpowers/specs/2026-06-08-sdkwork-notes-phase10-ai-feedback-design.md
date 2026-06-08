# SDKWork Notes Phase 10 AI Feedback Design

## Scope

Phase 10 adds an AI suggestion feedback ledger to close the first product-quality loop around reviewable AI suggestions.

Implemented resources:

- App API: `POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/feedback`
- Backend API: `GET /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/feedback`
- Product ledger table: `notes_ai_feedback`

## Design

Feedback belongs to Notes because it is AI governance metadata, not file content. The feedback row records tenant, organization, workspace, AI job, optional suggestion, feedback type, optional text, creator, and creation time.

The service first resolves the AI suggestion in the caller context, derives `workspace_id` and `job_id` from that suggestion, validates the feedback type, trims the optional feedback text, and stores a deterministic feedback id so the same actor can replay the same feedback payload safely.

Allowed feedback types are:

```text
accepted
rejected
edited
helpful
not_helpful
```

## Boundaries

This phase does not read or write Drive content, create Drive versions, create Notes-owned revisions, call a model provider, export training data, mutate suggestion status, or add upload/object/storage lifecycle tables.

The core resource remains `Page`. The implementation must not introduce `/notes/notes`, `notes_note`, `notes_note_revision`, `notes_revision`, or `client.notes.notes.*`.

## Data Model

`notes_ai_feedback` is an append-style ledger table owned by `sdkwork-notes-product`.

Required columns:

- `id`
- `tenant_id`
- `organization_id`
- `workspace_id`
- `job_id`
- `suggestion_id`
- `feedback_type`
- `feedback_text`
- `created_by`
- `created_at`

Indexes:

- `ix_notes_ai_feedback_suggestion`
- `ix_notes_ai_feedback_job`

## Verification

Required narrow checks:

```powershell
cargo test -p sdkwork-notes-product ai_suggestion_feedback_is_recorded_for_quality_loop
cargo test -p sdkwork-notes-product invalid_ai_suggestion_feedback_type_is_rejected
cargo test -p sdkwork-routes-notes-app-api app_api_routes_create_ai_suggestion_feedback
cargo test -p sdkwork-routes-notes-backend-api backend_api_routes_list_ai_suggestion_feedback
```

Required aggregate checks:

```powershell
cargo test -p sdkwork-notes-product
cargo test -p sdkwork-routes-notes-app-api
cargo test -p sdkwork-routes-notes-backend-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
cargo test --workspace
```
