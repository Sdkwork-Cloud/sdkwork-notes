# apis/

Author-owned HTTP API contracts for SDKWork Notes.

This directory holds reviewable OpenAPI authorities and validation inputs. Generated SDK transport output remains under `sdks/`; materialized runtime artifacts may also appear under `generated/openapi/` during migration.

| Surface | Authority file |
| --- | --- |
| app-api | [app-api/notes/notes-app-api.openapi.json](app-api/notes/notes-app-api.openapi.json) |
| backend-api | [backend-api/notes/notes-backend-api.openapi.json](backend-api/notes/notes-backend-api.openapi.json) |
| open-api | [open-api/notes/notes-open-api.openapi.json](open-api/notes/notes-open-api.openapi.json) |

Route manifests live under `sdks/_route-manifests/`. Every operation declares `WebRequestContext` and the matching `*-api` surface per `sdkwork-specs/WEB_FRAMEWORK_SPEC.md`.
