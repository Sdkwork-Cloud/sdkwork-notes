# SDKWork Notes Product Service Specs

This component owns the Notes product service boundary for Drive-backed pages.

Canonical SDKWork standards remain in `../../../sdkwork-specs/`. This local spec narrows the component integration contract only.

Phase 1 responsibilities:

- Persist `notes_workspace` and `notes_page` metadata.
- Store stable Drive references and current Drive version pointers.
- Delegate durable page content reads/writes, version listing, and version restore workflows to `DrivePageContentPort`.
- Atomically advance current Drive version pointers after Drive returns a validated content snapshot.
- Reject stale expected Drive pointers before Drive writes when the caller supplies an expected version.
- Validate Drive content snapshots and version summaries before exposing them through Notes service/API facades.
- Keep file, folder, object, upload, and version lifecycle ownership in Drive.

Production integration note:

- `DrivePageContentPort` is the owned Notes boundary. The production adapter must consume a Drive-owned Rust product service/facade or approved generated Drive SDK facade. It must not call Drive App API through raw HTTP and must not write Drive tables directly.

Verification:

```powershell
cargo test -p sdkwork-notes-pages-service
```
