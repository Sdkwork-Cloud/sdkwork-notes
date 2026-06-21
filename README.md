# sdkwork-notes

SDKWork Notes is a standalone workspace for the Notes product line.

The current primary deliverable is the desktop application in `sdkwork-notes-pc-react`, built as a monorepo with split packages and a Tauri desktop shell. The repository is prepared for future expansion with `sdkwork-notes-mobile-react` and `sdkwork-notes-mobile-flutter`.

## Contract Foundation (2026-06-08)

The AI-native Notes contract foundation is now recorded as owner-authored planning and contract skeletons. This phase does not include backend implementation, database migrations, or generated SDK transport output.

- Architecture alignment audit: [docs/architecture/sdkwork-specs-alignment-audit.md](docs/architecture/sdkwork-specs-alignment-audit.md)
- Root layout dictionary: [docs/root-layout.md](docs/root-layout.md)
- AI-native design spec: [docs/superpowers/specs/2026-06-08-sdkwork-notes-ai-native-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-ai-native-design.md)
- Contract implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-contract-foundation.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-contract-foundation.md)
- Schema registry entrypoint: [docs/schema-registry/README.md](docs/schema-registry/README.md)
- OpenAPI authorities: [apis/app-api/notes/notes-app-api.openapi.json](apis/app-api/notes/notes-app-api.openapi.json), [apis/open-api/notes/notes-open-api.openapi.json](apis/open-api/notes/notes-open-api.openapi.json), [apis/backend-api/notes/notes-backend-api.openapi.json](apis/backend-api/notes/notes-backend-api.openapi.json)
- SDK family skeletons: [sdks/sdkwork-notes-app-sdk/README.md](sdks/sdkwork-notes-app-sdk/README.md), [sdks/sdkwork-notes-sdk/README.md](sdks/sdkwork-notes-sdk/README.md), [sdks/sdkwork-notes-backend-sdk/README.md](sdks/sdkwork-notes-backend-sdk/README.md)
- Contract verifier: [scripts/verify-notes-contract-foundation.mjs](scripts/verify-notes-contract-foundation.mjs)
- Architecture verifier: [scripts/verify-notes-standard-architecture.test.mjs](scripts/verify-notes-standard-architecture.test.mjs)
- Verifier tests: [scripts/verify-notes-contract-foundation.test.mjs](scripts/verify-notes-contract-foundation.test.mjs)

Key contract decisions:

- The core resource is `Page`; new contracts must not introduce `/notes/notes`, `notes_note`, `notes_note_revision`, or `client.notes.notes.*`.
- Durable page content, folders, assets, uploads, object storage, and versions remain Drive-owned.
- Notes stores stable Drive references and owns page metadata, object systems, collections/views, links, AI governance, projections, import/export, and sync metadata.

## Phase 1 Rust Service Foundation (2026-06-08)

The first executable backend service layer has been started at the repository root. It is a Rust workspace that mirrors the SDKWork Drive service structure while keeping Drive as the content and version authority.

- Root Rust workspace: [Cargo.toml](Cargo.toml)
- Product service crate: [crates/sdkwork-notes-pages-service](crates/sdkwork-notes-pages-service)
- App API route crate: [crates/sdkwork-router-notes-app-api](crates/sdkwork-router-notes-app-api)
- Phase 1 service design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase1-rust-service-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase1-rust-service-design.md)
- Phase 1 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase1-rust-service.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase1-rust-service.md)
- Service skeleton verifier: [scripts/verify-notes-rust-service-skeleton.test.mjs](scripts/verify-notes-rust-service-skeleton.test.mjs)

Implemented Phase 1 runtime routes:

```text
POST /app/v3/api/notes/workspaces
POST /app/v3/api/notes/workspaces/{workspaceId}/pages
GET  /app/v3/api/notes/pages/{pageId}
GET  /app/v3/api/notes/pages/{pageId}/content
PUT  /app/v3/api/notes/pages/{pageId}/content
```

The product service persists `notes_workspace` and `notes_page` metadata only. Page content is read and written through `DrivePageContentPort`; tests use a fake Drive port. A production adapter is still pending and must bind to a Drive-owned Rust product service/facade or an approved generated Drive SDK facade. Notes must not implement that adapter with raw HTTP to Drive App API or direct writes to Drive tables.

## Phase 2 Route Manifest And Read Model Foundation (2026-06-08)

The App API runtime has been aligned to the SDKWork Rust route crate shape and now exposes a normalized route manifest for the implemented Notes App API subset.

- Phase 2 design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase2-route-manifest-and-read-model-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase2-route-manifest-and-read-model-design.md)
- Phase 2 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase2-route-manifest-and-read-model.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase2-route-manifest-and-read-model.md)
- Route crate: [crates/sdkwork-router-notes-app-api](crates/sdkwork-router-notes-app-api)
- Normalized route manifest: [sdks/_route-manifests/app-api/sdkwork-router-notes-app-api.route-manifest.json](sdks/_route-manifests/app-api/sdkwork-router-notes-app-api.route-manifest.json)

Implemented Phase 2 App API runtime routes:

```text
GET   /app/v3/api/notes/workspaces
POST  /app/v3/api/notes/workspaces
GET   /app/v3/api/notes/workspaces/{workspaceId}/bootstrap
GET   /app/v3/api/notes/workspaces/{workspaceId}/pages
POST  /app/v3/api/notes/workspaces/{workspaceId}/pages
GET   /app/v3/api/notes/pages/{pageId}
PATCH /app/v3/api/notes/pages/{pageId}
GET   /app/v3/api/notes/pages/{pageId}/content
PUT   /app/v3/api/notes/pages/{pageId}/content
```

Phase 2 adds workspace/page list APIs, workspace bootstrap, route manifest parity checks, and Notes-owned page metadata updates with optimistic version checks. Page content remains Drive-owned; Notes still stores only Drive references and current Drive version pointers.

## Phase 3 Drive Version Workflows (2026-06-08)

The App API runtime now exposes Drive-owned version workflows through the Notes business facade.

- Phase 3 design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase3-drive-version-list-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase3-drive-version-list-design.md)
- Phase 3 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase3-drive-version-list.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase3-drive-version-list.md)

Implemented Phase 3 App API runtime routes:

```text
GET  /app/v3/api/notes/pages/{pageId}/versions
POST /app/v3/api/notes/pages/{pageId}/versions/{driveVersionId}/restore
```

The product service resolves the Notes page for tenant/organization scope, delegates version listing/restoration to `DrivePageContentPort`, and atomically advances `notes_page.current_drive_version_id/current_drive_version_no` after Drive returns the restored content snapshot. Restoring a historical version produces a new Drive-owned current version; Notes does not move bytes or write Drive version rows directly. No Notes-owned revision table, version lifecycle, storage object, upload session, provider bucket, or object key state is introduced.

Current consistency guards:

- content update and restore commands reject stale expected Drive pointers before calling Drive when the caller supplies an expected version;
- content update, restore, and AI suggestion apply reject Drive snapshots that point at the wrong node, contain invalid page content, or do not advance the Drive version;
- duplicate page creation is rejected before Drive content creation to avoid orphan Drive content for same-tenant duplicate page ids;
- version list responses from Drive are validated before the Notes facade returns them to SDK/API clients.

## Phase 4 Search Query (2026-06-08)

The App API runtime now exposes the first search workflow over current Notes page projections while preserving Drive version provenance.

- Phase 4 design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase4-search-query-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase4-search-query-design.md)
- Phase 4 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase4-search-query.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase4-search-query.md)

Implemented Phase 4 App API runtime route:

```text
GET /app/v3/api/notes/search
```

The first implementation searches current `notes_page` title/snippet metadata, supports optional `workspace_id`, returns deterministic lightweight highlights, and includes `sourceDriveVersionId` / `sourceDriveVersionNo` from the current Drive-backed page content pointer. It does not introduce a search engine, vector index, AI job table, or Drive content reads in the search path.

Backend verification commands:

```powershell
cargo test -p sdkwork-notes-pages-service
cargo test -p sdkwork-router-notes-app-api
node --test scripts\verify-notes-rust-service-skeleton.test.mjs
node scripts\verify-notes-contract-foundation.mjs
cargo test --workspace
```

## Phase 5 AI Job Create (2026-06-08)

The App API runtime now exposes the first AI-native command workflow as an auditable, idempotent job creation endpoint.

- Phase 5 design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase5-ai-job-create-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase5-ai-job-create-design.md)
- Phase 5 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase5-ai-job-create.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase5-ai-job-create.md)

Implemented Phase 5 App API runtime route:

```text
POST /app/v3/api/notes/ai_jobs
```

This route creates a `queued` Notes AI job and requires `Idempotency-Key`. For `targetType=page`, Notes snapshots the current page Drive node/version references into `notes_ai_job_source` so later AI workers and audit flows know exactly which Drive content version was selected. The endpoint does not execute AI, call a model provider, read Drive content, write Drive content, or create any Notes-owned revision/version lifecycle table.

New product-owned tables:

```text
notes_ai_job
notes_ai_job_source
```

These tables are AI command and provenance ledgers only. Drive still owns page content, file versions, folders, uploads, storage providers, and object lifecycle.

## Phase 6 Backend AI Job Admin (2026-06-08)

The Backend API runtime now exposes the first operational administration surface for the Notes AI job ledger.

- Phase 6 design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase6-backend-ai-job-admin-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase6-backend-ai-job-admin-design.md)
- Phase 6 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase6-backend-ai-job-admin.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase6-backend-ai-job-admin.md)
- Backend route crate: [crates/sdkwork-router-notes-backend-api](crates/sdkwork-router-notes-backend-api)
- Backend route manifest: [sdks/_route-manifests/backend-api/sdkwork-router-notes-backend-api.route-manifest.json](sdks/_route-manifests/backend-api/sdkwork-router-notes-backend-api.route-manifest.json)

Implemented Phase 6 Backend API runtime routes:

```text
GET  /backend/v3/api/notes/ai_jobs
GET  /backend/v3/api/notes/ai_jobs/{aiJobId}
POST /backend/v3/api/notes/ai_jobs/{aiJobId}/cancel
```

This phase reuses the product-owned `notes_ai_job` and `notes_ai_job_source` ledgers. Backend operators can list jobs, retrieve one job, and cancel `queued` or `running` jobs. Cancel is idempotent for already `canceled` jobs and returns a conflict for terminal `succeeded` or `failed` jobs.

The route crate delegates to `NotesService` and keeps persistence in the product repository. It does not add an AI worker, provider execution, Drive content reads, Drive writes, Drive version lifecycle, or any Notes-owned revision/version table.

## Phase 7 AI Suggestion Ledger (2026-06-08)

The AI job runtime now has the first executable suggestion loop without introducing a model provider dependency.

- Phase 7 design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase7-ai-suggestion-ledger-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase7-ai-suggestion-ledger-design.md)
- Phase 7 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase7-ai-suggestion-ledger.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase7-ai-suggestion-ledger.md)

Implemented Phase 7 Backend API runtime routes:

```text
POST /backend/v3/api/notes/ai_jobs/{aiJobId}/claim
POST /backend/v3/api/notes/ai_jobs/{aiJobId}/complete
```

Implemented Phase 7 App API runtime route:

```text
GET /app/v3/api/notes/pages/{pageId}/ai_suggestions
```

New product-owned table:

```text
notes_ai_suggestion
```

The backend route can claim a queued job, complete a running job, and persist reviewable suggestions. The app route lists page suggestions with source Drive node/version provenance. This makes `suggestionCount` on AI jobs real instead of a placeholder count.

This phase still does not execute AI, call a model provider, read Drive content, write Drive content, mutate page content, or create a Notes-owned revision/version lifecycle. Suggestions are proposed ledger records; future phases can add accept/reject/apply workflows through normal page metadata/content commands and Drive-owned versioning.

## Phase 8 AI Suggestion Decision Lifecycle (2026-06-08)

AI suggestions now have the first review decision lifecycle on both App API and Backend API surfaces.

- Phase 8 design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase8-ai-suggestion-decision-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase8-ai-suggestion-decision-design.md)
- Phase 8 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase8-ai-suggestion-decision.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase8-ai-suggestion-decision.md)

Implemented Phase 8 App API runtime routes:

```text
POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/accept
POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/reject
```

Implemented Phase 8 Backend API runtime routes:

```text
POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/accept
POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/reject
```

The lifecycle is intentionally narrow: `proposed` suggestions can become `accepted` or `rejected`; repeating the same terminal decision is idempotent; changing an accepted suggestion to rejected, or a rejected suggestion to accepted, returns conflict.

This phase reuses the existing `notes_ai_suggestion` ledger and its `status`, `updated_by`, `updated_at`, and `version` fields. It does not write page content, apply patches, create Notes revisions, create Drive versions, or touch Drive-owned storage/upload/object lifecycle. A later apply workflow can write accepted changes through the existing Drive-backed page content command path.

## Phase 9 AI Suggestion Apply Workflow (2026-06-08)

Accepted AI suggestions can now be applied through the normal Drive-backed page content command path.

- Phase 9 design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase9-ai-suggestion-apply-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase9-ai-suggestion-apply-design.md)
- Phase 9 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase9-ai-suggestion-apply.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase9-ai-suggestion-apply.md)

Implemented Phase 9 App API runtime route:

```text
POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/apply
```

Implemented Phase 9 Backend API runtime route:

```text
POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/apply
```

The first apply shape is deliberately conservative. A suggestion must already be `accepted`, its payload must contain a full `content` object, and optional `contentType` / `contentSchemaVersion` values override the current page content metadata. The service writes through `DrivePageContentPort::update_page_content`, validates that the returned Drive snapshot advances the current page version, then updates `notes_page` Drive refs and marks the suggestion `applied` in one Notes database transaction.

This phase extends `notes_ai_suggestion.status` to `proposed`, `accepted`, `applied`, `rejected`, and `dismissed`. It still does not create a Notes-owned revision table, storage table, upload lifecycle, object lifecycle, model provider call, AI execution runtime, or generic rich-text patch engine. Drive remains the version authority for the file content produced by apply.

## Phase 10 AI Suggestion Feedback Loop (2026-06-08)

AI suggestions now have a product-owned feedback ledger for quality review and future evaluation workflows.

- Phase 10 design: [docs/superpowers/specs/2026-06-08-sdkwork-notes-phase10-ai-feedback-design.md](docs/superpowers/specs/2026-06-08-sdkwork-notes-phase10-ai-feedback-design.md)
- Phase 10 implementation plan: [docs/superpowers/plans/2026-06-08-sdkwork-notes-phase10-ai-feedback.md](docs/superpowers/plans/2026-06-08-sdkwork-notes-phase10-ai-feedback.md)

Implemented Phase 10 App API runtime route:

```text
POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/feedback
```

Implemented Phase 10 Backend API runtime route:

```text
GET /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/feedback
```

New product-owned table:

```text
notes_ai_feedback
```

Feedback records are governance ledger entries tied to an AI suggestion, AI job, workspace, tenant, organization, actor, feedback type, and optional feedback text. Replaying the same feedback payload by the same actor is idempotent through a stable feedback id.

This phase does not read or write Drive content, create Drive versions, mutate page content, change suggestion status, call model providers, export training data, or add Notes-owned storage/upload/object lifecycle tables.

## English

### Overview

This repository contains the Notes application workspace with:

- A React + Vite monorepo desktop app
- A Tauri desktop shell with tray support and cross-platform packaging
- Split package architecture for auth, shell, notes, user, desktop, i18n, commons, and core
- A GitHub Actions release workflow for Windows, Linux, and macOS desktop bundles

### Current Status

Implemented and verified:

- Desktop Notes application workspace in `sdkwork-notes-pc-react`
- Tauri desktop architecture with tray behavior and packaging
- Local development mode using source/relative shared SDK dependencies
- Release mode using git-backed shared SDK dependencies
- GitHub release workflow for multi-platform and multi-architecture desktop builds

Reserved for future work:

- `sdkwork-notes-mobile-react`
- `sdkwork-notes-mobile-flutter`

### Repository Structure

```text
sdkwork-notes/
├── .github/
│   └── workflows/
│       └── package.yml
├── sdkwork-notes-pc-react/
│   ├── packages/
│   │   ├── sdkwork-notes-pc-auth/
│   │   ├── sdkwork-notes-pc-commons/
│   │   ├── sdkwork-notes-pc-core/
│   │   ├── sdkwork-notes-pc-desktop/
│   │   ├── sdkwork-notes-pc-i18n/
│   │   ├── sdkwork-notes-pc-notes/
│   │   ├── sdkwork-notes-pc-shell/
│   │   ├── sdkwork-notes-pc-types/
│   │   └── sdkwork-notes-pc-user/
│   ├── scripts/
│   └── src/
├── sdkwork-notes-mobile-react/
└── sdkwork-notes-mobile-flutter/
```

### Tech Stack

- Node.js 22 recommended
- pnpm 10
- TypeScript
- React
- Vite
- Tailwind CSS
- Tauri 2
- Rust / Cargo
- Turbo

### Prerequisites

Before running the desktop app locally, make sure you have:

1. Install Node.js (v22+) and enable Corepack
2. Rust and Cargo installed
3. Tauri platform dependencies installed for your operating system
4. The shared SDK repositories available locally for source-mode development, or rely on git mode for release

### Local SDK Dependency Modes

The desktop workspace supports two shared SDK modes:

- `source`
  - Used by local desktop development commands such as `dev:desktop`, `build:desktop`, and `check:desktop:toolchain`
  - Prefers local sibling SDK sources
- `git`
  - Used by release commands such as `release:desktop`
  - Materializes shared SDK dependencies from git repositories

Environment overrides are also supported:

- `SDKWORK_SHARED_SDK_APP_LOCAL_ROOT`
- `SDKWORK_SHARED_SDK_COMMON_LOCAL_ROOT`

For a standalone `sdkwork-notes` repository layout, local source mode expects these sibling repositories by default:

- `../legacy-java-plus-app-api`
- `../sdk`

If your local layout is different, set the override environment variables above.

### Quick Start

From the repository root:

```bash
cd sdkwork-notes-pc-react
pnpm install
pnpm dev
```

### Desktop Development Commands

Run these inside `sdkwork-notes-pc-react`:

```bash
pnpm test
pnpm check:desktop
pnpm typecheck
pnpm build
pnpm check:desktop:toolchain
pnpm dev:desktop
pnpm build:desktop
pnpm release:desktop -- --target x86_64-pc-windows-msvc
```

### Release Workflow

GitHub Actions workflow:

- `.github/workflows/package.yml`

Trigger modes:

- Push a tag matching `sdkwork-notes-release-*`
- Manual `workflow_dispatch`

Current desktop release matrix includes:

- Windows x64
- Windows arm64
- Linux x64
- Linux arm64
- macOS Intel
- macOS Apple Silicon

### Notes on Packaging

The Tauri desktop application is configured for:

- Tray-based desktop behavior
- Multi-platform desktop packaging
- Multi-architecture release builds
- Release asset publication through GitHub Releases

### Verification

The current desktop workspace has been verified with:

- `pnpm test`
- `pnpm check:desktop`
- `pnpm typecheck`
- `pnpm build`

### Development Scope

This repository is currently centered on the desktop Notes product. The mobile directories are intentionally preserved as placeholders so the repository can grow into a multi-client Notes workspace without changing its top-level layout later.

---

## ??

### ????

`sdkwork-notes` ??Notes ?????????????
??????????????`sdkwork-notes-pc-react`???? package workspace + ??????????Tauri ????????????? `sdkwork-notes-mobile-react` ??`sdkwork-notes-mobile-flutter` ?????????????????
### ????????
- `sdkwork-notes-pc-react` ????Notes ????- React + Vite + package workspace ??
- Tauri ???????????????????- ???????????/ source ???? SDK
- Release ???? git ???? SDK
- GitHub Actions ???????????????

### ????

??????????
- `.github/workflows`
  - ???????? release workflow
- `sdkwork-notes-pc-react`
  - ????????????Notes ????- `sdkwork-notes-mobile-react`
  - React ????????- `sdkwork-notes-mobile-flutter`
  - Flutter ????????
### ???

- Node.js 22
- pnpm 10
- TypeScript
- React
- Vite
- Tailwind CSS
- Tauri 2
- Rust / Cargo
- Turbo

### ??????

??????????????

1. ????Node.js ??pnpm
2. ????Rust ??Cargo
3. ?????????????Tauri ??
4. ??????SDK ????????? release ??????git ??????

### ?? SDK ????

??????????????SDK ????
- `source`
  - ?????? `dev:desktop`?`build:desktop` ?????
  - ?????????? SDK
- `git`
  - ??????????`release:desktop`
  - ?? git ?????? SDK ??

??????????SDK ??????????????
- `SDKWORK_SHARED_SDK_APP_LOCAL_ROOT`
- `SDKWORK_SHARED_SDK_COMMON_LOCAL_ROOT`

????????????????????????

- `../legacy-java-plus-app-api`
- `../sdk`

### ?????
??????????
```bash
cd sdkwork-notes-pc-react
pnpm install
pnpm dev
```

### ????????
??`sdkwork-notes-pc-react` ??????

```bash
pnpm test
pnpm check:desktop
pnpm typecheck
pnpm build
pnpm check:desktop:toolchain
pnpm dev:desktop
pnpm build:desktop
pnpm release:desktop -- --target x86_64-pc-windows-msvc
```

### Release ????
???????? release workflow??
- `.github/workflows/package.yml`

??????
- ?????`sdkwork-notes-release-*` ????tag
- ???? `workflow_dispatch`

????????????????

- Windows x64
- Windows arm64
- Linux x64
- Linux arm64
- macOS Intel
- macOS Apple Silicon

### ????

?????????? Notes ??????????????????????????????????????????????Notes ?????