# SDKWork Notes Backend API Route Component

This component is the Rust Backend API route crate for SDKWork Notes.

Canonical standards are referenced through `component.spec.json` and the repository `AGENTS.md`; do not copy root standard text into this component.

Current scope:

- `GET /backend/v3/api/notes/ai_jobs`
- `GET /backend/v3/api/notes/ai_jobs/{aiJobId}`
- `POST /backend/v3/api/notes/ai_jobs/{aiJobId}/cancel`

Boundary:

- Handlers decode backend HTTP DTOs and delegate to `sdkwork_notes_pages_service::service::NotesService`.
- AI execution, provider calls, Drive content reads/writes, and Drive lifecycle ownership are out of scope.
- Avoid `/notes/notes`, `notes_note`, `notes_note_revision`, and Drive-owned storage lifecycle APIs.
