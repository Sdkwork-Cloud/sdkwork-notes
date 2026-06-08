# SDKWork Notes Product Service Specs

This component owns the Notes product service boundary for Drive-backed pages.

Canonical SDKWork standards remain in `../../../sdkwork-specs/`. This local spec narrows the component integration contract only.

Phase 1 responsibilities:

- Persist `notes_workspace` and `notes_page` metadata.
- Store stable Drive references and current Drive version pointers.
- Delegate durable page content reads/writes to `DrivePageContentPort`.
- Keep file, folder, object, upload, and version lifecycle ownership in Drive.

Verification:

```powershell
cargo test -p sdkwork-notes-product
```
