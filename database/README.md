# NOTES Database Module

Canonical lifecycle assets for `sdkwork-notes` per `DATABASE_FRAMEWORK_SPEC.md`.

- moduleId: `notes`
- serviceCode: `NOTES`
- tablePrefix: `notes_`

## Commands

```bash
pnpm run db:materialize:contract
pnpm run db:validate
```

Legacy SQL: `crates/sdkwork-notes-pages-repository-sqlx/src/sqlite_core.sql` → `database/ddl/baseline/postgres/0001_notes_legacy_baseline.sql`

Runtime bootstrap: `sdkwork-notes-database-host` / `connect_and_bootstrap_notes_database_from_env()`. API server SQLite path continues to use `install_sqlite_schema()`.
