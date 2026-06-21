# sdkwork-notes-backend-sdk

SDKWork Notes Backend API SDK family metadata skeleton.

This directory declares the backend-admin SDK family generated from `../../apis/backend-api/notes/notes-backend-api.openapi.json`.

Status:

- Authority: `sdkwork-notes-backend-api`
- SDK family: `sdkwork-notes-backend-sdk`
- API prefix: `/backend/v3/api`
- Standard profile: `sdkwork-v3`
- Generated output: not created in this phase

Dependencies:

- `sdkwork-appbase-backend-sdk` for backend-admin context and appbase management capabilities.
- `sdkwork-drive-backend-sdk` for Drive file governance, diagnostics, version retention, quota, provider, and repair capabilities.

Rules:

- Notes backend APIs may diagnose or repair Notes metadata bindings, but Drive storage/provider/version lifecycle remains Drive-owned.
- Notes backend SDK generation must not copy Drive backend operations into Notes generated transports.
