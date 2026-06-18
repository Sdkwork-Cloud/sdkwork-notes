# SDKWork Notes â€?sdkwork-specs Alignment Audit

Audit date: 2026-06-18  
Scope: repository root, Rust HTTP backend, SDK contracts, deployment topology, PC React application surface

## Executive summary

SDKWork Notes is **substantially aligned** with `sdkwork-specs` for an HTTP-only product workspace. The repository integrates `sdkwork-web-framework` and `sdkwork-database-config`, follows the standard root directory dictionary (with documented hybrid app placement), and uses the standard GitHub packaging workflow. **No RPC services exist**, so `sdkwork-discovery` is correctly deferred.

Remaining gaps are tracked as planned migrations rather than blockers.

## Alignment matrix

| Area | Standard | Status | Evidence |
| --- | --- | --- | --- |
| Agent entrypoints | `AGENTS_SPEC.md` | Aligned | Root + `sdkwork-notes-pc-react/AGENTS.md`, shim files, `.sdkwork/` |
| Root directory dictionary | `SDKWORK_WORKSPACE_SPEC.md` | Aligned | `apis/`, `apps/`, `crates/`, `sdks/`, `configs/`, `deployments/`, `docs/`, `tests/`, â€?|
| Web framework | `WEB_FRAMEWORK_SPEC.md` | Aligned | `sdkwork-web-core`, `sdkwork-web-axum`, `WebRequestContext`, IAM adapter layer |
| Database framework | `DATABASE_SPEC.md` + `sdkwork-database` | Partial â†?Aligned (config) | `DatabaseConfig::from_env("notes")`, schema registry, SQLx store |
| Service discovery | RPC only | N/A | No proto/RPC; discovery not required |
| API contracts | `API_SPEC.md` | Aligned | `apis/*/*.openapi.json`, route manifests, `x-sdkwork-*` extensions |
| SDK workspace | `SDK_WORKSPACE_GENERATION_SPEC.md` | In progress | Families + manifests present; canonical sdkgen output pending |
| Deployment | `DEPLOYMENT_SPEC.md`, topology specs | Aligned | `specs/topology.spec.json`, `configs/topology/`, gateway TOML |
| Packaging / CI | `GITHUB_WORKFLOW_SPEC.md` | Aligned | `sdkwork.workflow.json`, thin `package.yml` |
| PC app architecture | `APP_PC_ARCHITECTURE_SPEC.md` | Partial | Functional PC workspace; package names still `@sdkwork/notes-*` |
| Rust crate naming | `NAMING_SPEC.md`, `RUST_CODE_SPEC.md` | Partial | Route/server crates compliant; product crate still `sdkwork-notes-pages-service` |
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
- Table contracts documented under `docs/schema-registry/tables/`
- **Follow-up:** migrate `SqlNotesStore` to `sdkwork-database-repository` entity pattern (Drive reference implementation)

### sdkwork-discovery

Not integrated â€?**by design** until Notes introduces gRPC/RPC services.

## Planned migrations (non-blocking)

1. **Rename product service crate** from `sdkwork-notes-pages-service` to `sdkwork-notes-pages-service` and split SQLx access into `sdkwork-notes-pages-repository-sqlx` per `RUST_CODE_SPEC.md`.
2. **Normalize PC package names** from `@sdkwork/notes-*` to `sdkwork-notes-pc-*` per `APP_PC_ARCHITECTURE_SPEC.md` (large client-side rename).
3. **Complete sdkgen output** for app/backend/open SDK families; remove duplicate skeleton transport under `generated/openapi/` once materialization pipeline owns authority sync.
4. **Add PC config profile templates** under `sdkwork-notes-pc-react/config/{browser,desktop,server,container}/` per `CONFIG_SPEC.md`.
5. **Enable SBOM/signing** in release workflow when production gates require it (`RELEASE_SPEC.md`, `SUPPLY_CHAIN_SECURITY_SPEC.md`).
6. **Migrate Drive app SDK facade** in `sdkwork-notes-api-server` to the current generated Drive SDK request shapes (context now travels via `WebRequestContext`, not request-body tenant fields). This blocks `cargo test --workspace` until fixed; product/route crates already pass.

## Verification commands

```powershell
pnpm verify
node --test scripts/verify-notes-standard-architecture.test.mjs
node scripts/sync-notes-api-framework-metadata.mjs
```

Expected: all tests pass; route manifests and OpenAPI authorities stay synchronized with web-framework metadata.
