# SDKWork Notes ?sdkwork-specs Alignment Audit

Audit date: 2026-06-21 (updated)  
Scope: repository root, Rust HTTP backend, SDK contracts, deployment topology, PC React application surface

## Executive summary

SDKWork Notes is **aligned** with `sdkwork-specs` for an HTTP-only product workspace. The repository integrates `sdkwork-web-framework`, `sdkwork-database`, `sdkwork-utils-rust`, and `@sdkwork/utils`, follows the standard root directory dictionary (with documented hybrid PC app placement at `sdkwork-notes-pc-react/`), and uses the standard GitHub packaging workflow. **No RPC services exist**, so `sdkwork-discovery` is correctly deferred.

OpenAPI authorities live under `apis/` only; the legacy `generated/openapi/` duplicate has been removed.

## Alignment matrix

| Area | Standard | Status | Evidence |
| --- | --- | --- | --- |
| Agent entrypoints | `AGENTS_SPEC.md` | Aligned | Root + `sdkwork-notes-pc-react/AGENTS.md`, shim files, `.sdkwork/` |
| Root directory dictionary | `SDKWORK_WORKSPACE_SPEC.md` | Aligned | `apis/`, `apps/`, `crates/`, `database/`, `sdks/`, `configs/`, `deployments/`, `docs/`, `tests/` |
| PNPM scripts | `PNPM_SCRIPT_SPEC.md` | Aligned | Root exposes `dev`, `build`, `test`, `check`, `verify`, `clean`, `api:*`, `sdk:*`, `db:*`, `topology:*` |
| Web framework | `WEB_FRAMEWORK_SPEC.md` | Aligned | `sdkwork-web-core`, `sdkwork-web-axum`, `WebRequestContext`, IAM adapter layer |
| Database framework | `DATABASE_SPEC.md` + `sdkwork-database` | Partial ? Aligned (config + lifecycle) | `database/` assets, `DatabaseConfig::from_env("notes")`, SQLx store |
| Shared utils | `sdkwork-utils` | Aligned | `sdkwork-utils-rust` in route crates; `@sdkwork/utils` in PC workspace |
| Service discovery | RPC only | N/A | No proto/RPC; discovery not required |
| API contracts | `API_SPEC.md` | Aligned | `apis/*/*.openapi.json`, route manifests, `x-sdkwork-*` extensions |
| SDK workspace | `SDK_WORKSPACE_GENERATION_SPEC.md` | In progress | Families + manifests present; app-sdk TS transport generated; backend/open sdkgen pending |
| Deployment | `DEPLOYMENT_SPEC.md`, topology specs | Aligned | `specs/topology.spec.json`, unified + split orchestration, gateway TOML |
| Packaging / CI | `GITHUB_WORKFLOW_SPEC.md` | Aligned | `sdkwork.workflow.json`, thin `package.yml` |
| PC app architecture | `APP_PC_ARCHITECTURE_SPEC.md` | Partial | Functional PC workspace + config templates; package names still `@sdkwork/notes-*` |
| PC config profiles | `CONFIG_SPEC.md` | Aligned | `sdkwork-notes-pc-react/config/{browser,desktop,server,container}/` examples |
| Rust crate naming | `NAMING_SPEC.md`, `RUST_CODE_SPEC.md` | Aligned | Route/server/service/repository crates under `crates/` |
| Security / IAM | `IAM_LOGIN_INTEGRATION_SPEC.md` | Aligned (client) | Appbase auth integration in PC React; server IAM routes embedded |
| Testing | `TEST_SPEC.md` | Aligned | `pnpm verify`, architecture + contract + Rust tests |

## Framework integration detail

### sdkwork-web-framework

- Workspace dependencies: `sdkwork-web-core`, `sdkwork-web-axum` in root `Cargo.toml`
- Route handlers inject `WebRequestContext` (`crates/sdkwork-router-notes-*-api/src/handlers.rs`)
- API server mounts protected routers via `build_web_framework_layer` + `with_web_request_context` (`crates/sdkwork-notes-api-server/src/bootstrap/auth.rs`)
- Route manifests and OpenAPI authorities declare `WebRequestContext` / `x-sdkwork-request-context`

### sdkwork-database

- API server resolves `SDKWORK_NOTES_DATABASE_URL` through `sdkwork-database-config` (`DatabaseConfig::from_env("notes")`)
- Full lifecycle assets under `database/` (contract, migrations, seeds, drift)
- **Follow-up:** migrate `SqlNotesStore` to `sdkwork-database-repository` entity pattern (Drive reference implementation)

### sdkwork-utils

- `sdkwork-utils-rust` declared in root `Cargo.toml` and consumed by `sdkwork-router-notes-app-api`
- Route validation uses shared `is_blank` / `trim` helpers instead of ad-hoc string checks
- `@sdkwork/utils` linked in `sdkwork-notes-pc-react/pnpm-workspace.yaml` and root PC package dependencies

### sdkwork-discovery

Not integrated ?**by design** until Notes introduces gRPC/RPC services.

## Planned migrations (non-blocking)

1. **Normalize PC package names** from `@sdkwork/notes-*` to `sdkwork-notes-pc-*` per `APP_PC_ARCHITECTURE_SPEC.md` (large client-side rename).
2. **Complete sdkgen output** for backend/open SDK families (manifests and authorities are ready under `apis/`).
3. **Enable SBOM/signing** in release workflow when production gates require it (`RELEASE_SPEC.md`, `SUPPLY_CHAIN_SECURITY_SPEC.md`).
4. **Migrate Drive app SDK facade** in `sdkwork-notes-api-server` to the current generated Drive SDK request shapes.
5. **Add open-api route crate** when open-api runtime endpoints are required (contract authority and SDK family already declared).

## Verification commands

```powershell
pnpm check
pnpm verify
node --test scripts/verify-notes-standard-architecture.test.mjs
pnpm api:check
node scripts/sync-notes-api-framework-metadata.mjs
```

Expected: all tests pass; route manifests and OpenAPI authorities stay synchronized with web-framework metadata.
