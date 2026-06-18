# tests/

Cross-cutting verification entry for SDKWork Notes.

Backend and route crate tests live next to their crates. Frontend contract tests live under `sdkwork-notes-pc-react/scripts/`. Root verification commands:

```powershell
pnpm verify
node --test scripts/verify-notes-standard-architecture.test.mjs
node --test scripts/verify-notes-rust-service-skeleton.test.mjs
node --test scripts/verify-notes-contract-foundation.test.mjs
```
