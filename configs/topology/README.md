# Notes topology profiles

Machine contract: `specs/topology.spec.json` (`schemaVersion: 2`, archetype `application-http-gateway`).

Platform standard: `../../sdkwork-specs/APP_RUNTIME_TOPOLOGY_ADOPTION.md`

## Active profiles

| Profile id | Command |
| --- | --- |
| `self-hosted.split-services.development` | `pnpm notes:dev`, `pnpm notes:dev:desktop` |
| `cloud-hosted.split-services.development` | `pnpm notes:dev:cloud` |
| `self-hosted.unified-process.production` | self-hosted production build |
| `cloud-hosted.split-services.production` | cloud production deploy |

Loader: `scripts/lib/notes-topology.mjs` → `@sdkwork/app-topology`.
