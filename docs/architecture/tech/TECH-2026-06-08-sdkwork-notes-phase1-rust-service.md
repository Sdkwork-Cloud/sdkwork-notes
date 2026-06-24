> Migrated from `docs/superpowers/plans/2026-06-08-sdkwork-notes-phase1-rust-service.md` on 2026-06-24.
> Owner: SDKWork maintainers

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first executable Rust service layer for Drive-backed Notes pages.

**Architecture:** Create a root Cargo workspace with `sdkwork-notes-pages-service` and `sdkwork-notes-app-api`. Product code owns Notes business metadata and delegates content writes/reads to an injected Drive port; App API handlers map the first page routes to the service.

**Tech Stack:** Rust 2021, Tokio, SQLx AnyPool/SQLite tests, Axum 0.7, Serde, Node.js contract tests.

---

## File Structure

Create:

- `Cargo.toml`: Notes root Rust workspace.
- `scripts/verify-notes-rust-service-skeleton.test.mjs`: Node contract test for service crate layout and forbidden generated SDK transport output.
- `services/sdkwork-notes-pages-service/Cargo.toml`: product crate manifest.
- `services/sdkwork-notes-pages-service/src/lib.rs`: public module assembly.
- `services/sdkwork-notes-pages-service/src/domain.rs`: workspace, page, content reference, and request context models.
- `services/sdkwork-notes-pages-service/src/error.rs`: typed product errors.
- `services/sdkwork-notes-pages-service/src/ports.rs`: `NotesRepository` and `DrivePageContentPort`.
- `services/sdkwork-notes-pages-service/src/service.rs`: page/workspace use cases.
- `services/sdkwork-notes-pages-service/src/infrastructure/mod.rs`: infrastructure module assembly.
- `services/sdkwork-notes-pages-service/src/infrastructure/sql/mod.rs`: SQL schema install entrypoints.
- `services/sdkwork-notes-pages-service/src/infrastructure/sql/notes_store.rs`: SQL repository implementation.
- `services/sdkwork-notes-pages-service/src/infrastructure/sql/sqlite_core.sql`: idempotent SQLite schema.
- `services/sdkwork-notes-pages-service/tests/sqlite_schema_contract.rs`: schema install and forbidden column tests.
- `services/sdkwork-notes-pages-service/tests/page_service.rs`: service behavior tests with fake Drive.
- `services/sdkwork-notes-app-api/Cargo.toml`: App API crate manifest.
- `services/sdkwork-notes-app-api/src/lib.rs`: public module assembly.
- `services/sdkwork-notes-app-api/src/dto.rs`: request/response DTOs.
- `services/sdkwork-notes-app-api/src/error.rs`: problem detail mapping.
- `services/sdkwork-notes-app-api/src/routes.rs`: Axum router and handlers.
- `services/sdkwork-notes-app-api/src/state.rs`: router state.
- `services/sdkwork-notes-app-api/tests/page_routes.rs`: route behavior tests.

Modify:

- `README.md`: add Phase 1 service entrypoint and verification commands.

## Task 1: Workspace Skeleton

- [ ] Write failing `scripts/verify-notes-rust-service-skeleton.test.mjs`.
- [ ] Run `node --test scripts\verify-notes-rust-service-skeleton.test.mjs` and confirm it fails because `Cargo.toml` and service crates are missing.
- [ ] Add root `Cargo.toml` and minimal crate manifests/source roots.
- [ ] Re-run the Node test and confirm it passes.

## Task 2: Product SQL Schema

- [ ] Write failing `services/sdkwork-notes-pages-service/tests/sqlite_schema_contract.rs`.
- [ ] Run `cargo test -p sdkwork-notes-pages-service sqlite_schema_contract` and confirm missing schema implementation.
- [ ] Add SQLite schema and `install_sqlite_schema` / `install_any_schema` helpers.
- [ ] Re-run product schema test.

## Task 3: Product Page Service

- [ ] Write failing `services/sdkwork-notes-pages-service/tests/page_service.rs` for workspace create, page create, content update, and content retrieve.
- [ ] Run `cargo test -p sdkwork-notes-pages-service page_service` and confirm missing behavior.
- [ ] Implement domain models, repository port, fake-friendly Drive content port, service layer, and SQL store.
- [ ] Re-run product service tests.

## Task 4: App API Routes

- [ ] Write failing `services/sdkwork-notes-app-api/tests/page_routes.rs`.
- [ ] Run `cargo test -p sdkwork-notes-app-api page_routes` and confirm route crate is incomplete.
- [ ] Implement DTOs, problem detail mapping, state, router builder, and handlers.
- [ ] Re-run App API route tests.

## Task 5: Documentation And Verification

- [ ] Update `README.md` with Phase 1 service roots and commands.
- [ ] Run:

```powershell
cargo fmt -p sdkwork-notes-pages-service -p sdkwork-notes-app-api -- --check
cargo test -p sdkwork-notes-pages-service
cargo test -p sdkwork-notes-app-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node --test scripts\verify-notes-contract-foundation.test.mjs
node scripts\verify-notes-contract-foundation.mjs
```

- [ ] Record verification evidence and any remaining gaps.

