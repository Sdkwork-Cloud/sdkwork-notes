# SDKWork Notes Phase 8 AI Suggestion Decision Design

## Goal

Phase 8 adds the first user/system decision lifecycle for AI suggestions. A completed AI job can already persist proposed suggestions in `notes_ai_suggestion`; this phase lets clients and backend-admin workers mark a suggestion as accepted or rejected while preserving Drive-backed content boundaries.

## Scope

Implement only suggestion ledger decisions:

- `proposed -> accepted`
- `proposed -> rejected`
- repeated accept on `accepted` is idempotent
- repeated reject on `rejected` is idempotent
- changing a terminal decision, such as `accepted -> rejected`, returns conflict

Out of scope:

- No AI provider execution.
- No Drive content write.
- No Notes-owned revision or content version table.
- No automatic patch application to page content.
- No Drive upload/object/session/version lifecycle changes.

## Product Boundary

`sdkwork-notes-pages-service` owns the suggestion decision state because `notes_ai_suggestion` is a Notes-owned AI governance ledger. Drive remains the content and version authority. Accepting a suggestion means â€œthis suggestion was adopted by the Notes workflowâ€? a later phase can add a separate apply operation that writes page content through the existing Drive-backed page content port.

## API Design

App API:

- `POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/accept`
- `POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/reject`

Backend API:

- `POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/accept`
- `POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/reject`

Both surfaces return `AiSuggestion`. App API is for user-facing review flows. Backend API is for trusted worker/admin workflows. Open API remains absent for this capability because accepting or rejecting private workspace suggestions is authenticated app/backend behavior, not external integration behavior.

## Database Design

No new table is needed. Reuse `notes_ai_suggestion`:

- `status`: stores `proposed`, `accepted`, `rejected`, or existing compatible states.
- `updated_by`: records the actor that made the latest decision.
- `updated_at`: records decision time.
- `version`: increments on state transition.

Repository updates must include tenant and organization predicates and only transition from `proposed`. If a concurrent update wins first, the service reloads the suggestion and returns either idempotent success or conflict.

## Verification

Phase 8 must prove:

- Product service transitions and conflicts are covered by SQL-backed tests.
- App API routes decode path/body context, call service methods, and return updated suggestion status.
- Backend API routes expose the same lifecycle for worker/admin use.
- OpenAPI and route manifests contain the new operations.
- Static contract checks continue rejecting forbidden Notes naming and Drive-owned lifecycle leakage.
