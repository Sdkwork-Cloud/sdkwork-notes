# SDKWork Notes Runtime Topology

This repository adopts the shared SDKWork runtime topology framework.

- Platform standard: `../sdkwork-specs/APP_RUNTIME_TOPOLOGY_SPEC.md`
- Naming authority: `../sdkwork-specs/APP_RUNTIME_TOPOLOGY_NAMING.md`
- Adoption guide: `../sdkwork-specs/APP_RUNTIME_TOPOLOGY_ADOPTION.md`
- Framework: `../sdkwork-app-topology`

## Archetype

`application-http-gateway` — Notes exposes **application.public-ingress** through `sdkwork-notes-api-server`. Shared IAM and appbase SDKs use **platform.api-gateway**.

## Default dev profile

`self-hosted.split-services.development`

## Commands

```bash
pnpm notes:dev                 # self-hosted split-services development (browser)
pnpm notes:dev:cloud             # cloud-hosted split-services development
pnpm notes:dev:desktop           # self-hosted split-services development (Tauri)
pnpm notes:api-server            # Notes API server only (topology profile env)
pnpm topology:validate         # validate specs/topology.spec.json
pnpm gateway:matrix            # print gateway packaging matrix
pnpm gateway:cloud:bundle      # bundle cloud gateway TOML configs
```

Cloud gateway config bundles live in `configs/sdkwork-api-gateway.notes.{development,production}.toml`.

## Local URLs (self-hosted split dev)

| Surface | URL |
| --- | --- |
| application.public-ingress | http://127.0.0.1:8787 |
| platform.api-gateway | http://127.0.0.1:3900 |

Client env keys:

- `VITE_SDKWORK_NOTES_APPLICATION_PUBLIC_HTTP_URL` — Notes app SDK
- `VITE_SDKWORK_NOTES_PLATFORM_API_GATEWAY_HTTP_URL` — platform / IAM SDKs
- `VITE_SDKWORK_APPBASE_APP_API_BASE_URL` — appbase IAM app API

Profile values live in `configs/topology/*.env` only. Do not hardcode ports in feature packages.
