# SDKWork Notes App API Route Crate Specs

This component owns the first executable Notes App API route crate for Drive-backed page workflows.

Canonical SDKWork standards remain in `../../../../../../../sdkwork-specs/`. This local spec narrows the component integration contract only.

Responsibilities:

- Mount the implemented `/app/v3/api/notes` page and workspace routes.
- Keep route constants in `src/paths.rs`.
- Keep Axum router composition in `src/routes.rs`.
- Keep HTTP DTO decode and service delegation in `src/handlers.rs`.
- Expose the deterministic route manifest through `src/manifest.rs`.
- Map HTTP DTOs to `sdkwork-notes-pages-service` service commands.
- Expose page content version listing and restore routes as Notes business facades over Drive-owned versions.
- Return problem detail errors.
- Avoid `/notes/notes`, `notes_note`, `notes_note_revision`, and Drive-owned storage lifecycle APIs.

Verification:

```powershell
cargo test -p sdkwork-routes-notes-app-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
```
