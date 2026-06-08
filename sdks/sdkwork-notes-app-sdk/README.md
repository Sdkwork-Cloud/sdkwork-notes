# sdkwork-notes-app-sdk

SDKWork Notes App API SDK family metadata skeleton.

This directory declares the owner-authored SDK family contract for the app/client surface generated from `../../generated/openapi/notes-app-api.openapi.json`.

Status:

- Authority: `sdkwork-notes-app-api`
- SDK family: `sdkwork-notes-app-sdk`
- API prefix: `/app/v3/api`
- Standard profile: `sdkwork-v3`
- Generated output: not created in this phase

Dependencies:

- `sdkwork-appbase-app-sdk` for appbase IAM/session capabilities.
- `sdkwork-drive-app-sdk` for Drive-backed content, folders, assets, uploader, and version facades.

Rules:

- Notes does not copy Drive OpenAPI operations into this SDK family.
- Generated Drive transports are dependency-owned and must not be imported or forked by Notes generated output.
- Frontend services should receive Notes and Drive SDK clients through injected ports rather than raw HTTP.
