# Notes topology profiles

Machine contract: `specs/topology.spec.json` (`schemaVersion: 2`, archetype `application-http-gateway`).

Platform standard: `../../sdkwork-specs/APP_RUNTIME_TOPOLOGY_ADOPTION.md`

## Active profiles

| Profile id | Command |
| --- | --- |
| `standalone.split-services.development` | `pnpm dev:browser:split-services`, `pnpm dev:desktop` with `--service-layout split-services` |
| `standalone.unified-process.development` | `pnpm dev`, `pnpm dev:browser`, `pnpm dev:desktop` |
| `cloud.split-services.development` | `pnpm dev:browser:cloud`, `pnpm dev:desktop:cloud` |
| `standalone.unified-process.production` | self-hosted production build |
| `cloud.split-services.production` | cloud production deploy |

Loader: `scripts/lib/notes-topology.mjs` → `@sdkwork/app-topology`.
