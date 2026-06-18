# Notes Config Templates

`configs/` contains safe checked-in config templates for `sdkwork-notes`.

Current templates:

- `topology/*.env`: runtime topology profile env files (`specs/topology.spec.json`).
- `sdkwork-api-gateway.notes.development.toml`: cloud gateway dev handoff for Notes surfaces.
- `sdkwork-api-gateway.notes.production.toml`: cloud gateway production handoff for Notes surfaces.

Host-local overrides such as `.env.local` and `configs/*.local.toml` must stay out of source control.
Runtime user-private config is governed by `../../sdkwork-specs/RUNTIME_DIRECTORY_SPEC.md`.
