> Migrated from `docs/superpowers/plans/2026-06-08-sdkwork-notes-contract-foundation.md` on 2026-06-24.
> Owner: SDKWork maintainers

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the first concrete contract foundation for the AI-native SDKWork Notes product root without generating backend code or duplicating Drive-owned capabilities.

**Architecture:** This phase lands owner-authored planning and contract artifacts only: schema registry drafts, SDK family manifests, OpenAPI skeleton authorities, and contract verification scripts. Drive remains the authority for file content, folders, upload, storage objects, and versions; Notes owns page metadata, object models, collections, views, links, AI governance, projections, and SDK authority boundaries.

**Tech Stack:** Markdown design specs, YAML schema registry contracts, OpenAPI 3.1.2 JSON skeletons, Node.js contract verification scripts, SDKWork `sdks/` family metadata.

---

## Scope

This plan implements Phase 0 from `docs/superpowers/specs/2026-06-08-sdkwork-notes-ai-native-design.md`.

In scope:

- Add schema registry drafts for Notes remote tables.
- Add OpenAPI skeletons for Notes App API, Open API, and Backend API.
- Add SDK family metadata skeletons for `sdkwork-notes-sdk`, `sdkwork-notes-app-sdk`, and `sdkwork-notes-backend-sdk`.
- Add a contract verification script that blocks forbidden names such as `/notes/notes`, `notes_note`, and `client.notes.notes`.
- Add README/index files that explain the product root contract layout.

Out of scope:

- No backend service implementation.
- No generated SDK transport output.
- No database migrations.
- No Drive schema changes.
- No frontend migration from `Note` to `Page`.
- No AI worker implementation.

## File Structure

Create:

- `docs/schema-registry/README.md`: schema registry entrypoint for Notes.
- `docs/schema-registry/tables/001-notes-core.yaml`: workspace/page/tag/link/asset core contracts.
- `docs/schema-registry/tables/002-notes-object-system.yaml`: object type, property, collection, and view contracts.
- `docs/schema-registry/tables/003-notes-ai-projections.yaml`: search, semantic, insight, AI job, source, suggestion, and feedback contracts.
- `docs/schema-registry/tables/004-notes-sync-import-export.yaml`: sync, import, export, publication contracts.
- `generated/openapi/notes-app-api.openapi.json`: App API skeleton authority.
- `generated/openapi/notes-open-api.openapi.json`: Open API skeleton authority.
- `generated/openapi/notes-backend-api.openapi.json`: Backend API skeleton authority.
- `sdks/sdkwork-notes-app-sdk/.sdkwork-assembly.json`: App SDK family metadata.
- `sdks/sdkwork-notes-app-sdk/sdk-manifest.json`: App SDK generation manifest placeholder.
- `sdks/sdkwork-notes-app-sdk/README.md`: App SDK family entrypoint.
- `sdks/sdkwork-notes-app-sdk/specs/component.spec.json`: App SDK component contract.
- `sdks/sdkwork-notes-sdk/.sdkwork-assembly.json`: Open SDK family metadata.
- `sdks/sdkwork-notes-sdk/sdk-manifest.json`: Open SDK generation manifest placeholder.
- `sdks/sdkwork-notes-sdk/README.md`: Open SDK family entrypoint.
- `sdks/sdkwork-notes-sdk/specs/component.spec.json`: Open SDK component contract.
- `sdks/sdkwork-notes-backend-sdk/.sdkwork-assembly.json`: Backend SDK family metadata.
- `sdks/sdkwork-notes-backend-sdk/sdk-manifest.json`: Backend SDK generation manifest placeholder.
- `sdks/sdkwork-notes-backend-sdk/README.md`: Backend SDK family entrypoint.
- `sdks/sdkwork-notes-backend-sdk/specs/component.spec.json`: Backend SDK component contract.
- `scripts/verify-notes-contract-foundation.mjs`: contract verification.

Modify:

- `README.md`: add contract foundation references.
- `docs/架构/README.md`: add the new AI-native design and contract foundation references without replacing the existing 01-10 baseline.

## Task 1: Schema Registry Drafts

**Files:**

- Create: `docs/schema-registry/README.md`
- Create: `docs/schema-registry/tables/001-notes-core.yaml`
- Create: `docs/schema-registry/tables/002-notes-object-system.yaml`
- Create: `docs/schema-registry/tables/003-notes-ai-projections.yaml`
- Create: `docs/schema-registry/tables/004-notes-sync-import-export.yaml`

- [ ] **Step 1: Write schema registry YAML drafts**

Add table contracts matching the design spec. Each table must include:

- `module: notes`
- `owner: sdkwork-notes`
- `domain: content`
- `tables`
- table descriptions
- core columns
- source-of-truth/projection descriptions
- critical indexes

- [ ] **Step 2: Verify forbidden table names are absent**

Run:

```powershell
rg -n "notes_note|notes_note_revision|storage_object|upload_session|bucket|object_key" docs/schema-registry
```

Expected: no matches, except explanatory text if explicitly marked forbidden.

## Task 2: OpenAPI Skeleton Authorities

**Files:**

- Create: `generated/openapi/notes-app-api.openapi.json`
- Create: `generated/openapi/notes-open-api.openapi.json`
- Create: `generated/openapi/notes-backend-api.openapi.json`

- [ ] **Step 1: Create minimal OpenAPI 3.1.2 skeletons**

Each skeleton must include:

- `openapi: 3.1.2`
- `info`
- `servers`
- `tags`
- `paths`
- `components.schemas.ProblemDetail`
- security schemes appropriate to the surface

- [ ] **Step 2: Add representative path contracts**

App API must include representative paths for:

- `/app/v3/api/notes/workspaces`
- `/app/v3/api/notes/workspaces/{workspaceId}/bootstrap`
- `/app/v3/api/notes/workspaces/{workspaceId}/pages`
- `/app/v3/api/notes/pages/{pageId}`
- `/app/v3/api/notes/pages/{pageId}/content`
- `/app/v3/api/notes/pages/{pageId}/versions`
- `/app/v3/api/notes/search`
- `/app/v3/api/notes/ai_jobs`

Open API must use `/notes/v3/api` and include representative paths for pages, content, search, and exports.

Backend API must use `/backend/v3/api/notes` and include representative paths for workspaces, projection rebuild, index jobs, AI jobs, and diagnostics.

- [ ] **Step 3: Verify operationId style**

Run:

```powershell
rg -n '"operationId": "notes\.|notes_note|/notes/notes|client\.notes\.notes' generated/openapi
```

Expected: no matches.

## Task 3: SDK Family Metadata Skeletons

**Files:**

- Create SDK family files under `sdks/sdkwork-notes-sdk`
- Create SDK family files under `sdks/sdkwork-notes-app-sdk`
- Create SDK family files under `sdks/sdkwork-notes-backend-sdk`

- [ ] **Step 1: Create SDK family directories and manifests**

The App SDK must declare dependency on `sdkwork-drive-app-sdk`.

The Backend SDK must declare dependency on `sdkwork-drive-backend-sdk`.

The Open SDK must not declare appbase login/session dependencies.

- [ ] **Step 2: Verify dependency boundaries**

Run:

```powershell
rg -n "sdkwork-drive-(app|backend)-sdk|sdkDependencies|generatedTransportImportPolicy" sdks
```

Expected:

- App SDK references `sdkwork-drive-app-sdk`.
- Backend SDK references `sdkwork-drive-backend-sdk`.
- Generated Drive transports are marked forbidden for import/copy into Notes.

## Task 4: Contract Verification Script

**Files:**

- Create: `scripts/verify-notes-contract-foundation.mjs`

- [ ] **Step 1: Write a Node contract verifier**

The verifier must:

- scan `docs/schema-registry`, `generated/openapi`, `sdks`, and the AI-native design spec;
- fail on forbidden names: `/notes/notes`, `notes_note`, `notes_note_revision`, `client.notes.notes`;
- fail if OpenAPI files do not use their required prefixes;
- fail if App SDK lacks Drive App SDK dependency;
- fail if Backend SDK lacks Drive Backend SDK dependency;
- fail if any OpenAPI `operationId` begins with `notes.`;
- print a concise success message when contracts pass.

- [ ] **Step 2: Run verifier and fix findings**

Run:

```powershell
node scripts/verify-notes-contract-foundation.mjs
```

Expected: exit code `0`.

## Task 5: Documentation Links

**Files:**

- Modify: `README.md`
- Modify: `docs/架构/README.md`

- [ ] **Step 1: Add contract foundation links**

Add links to:

- AI-native design spec.
- schema registry.
- OpenAPI skeletons.
- SDK family skeletons.
- verification script.

- [ ] **Step 2: Verify links and final contract scan**

Run:

```powershell
node scripts/verify-notes-contract-foundation.mjs
git status --short
```

Expected:

- verifier exits `0`;
- status shows only intentional contract foundation files.

## Final Verification

Run:

```powershell
node scripts/verify-notes-contract-foundation.mjs
rg -n "/notes/notes|notes_note|notes_note_revision|client\\.notes\\.notes" docs generated sdks scripts
```

Expected:

- verifier exits `0`;
- `rg` only reports forbidden names when they appear inside explicit forbidden-name checks or acceptance criteria, not as active contracts.

## Handoff

After this plan is complete, the next plan should target one of these independently testable tracks:

1. Drive version policy contract implementation in `sdkwork-drive`.
2. Notes service and API route skeletons in `sdkwork-notes`.
3. PC React compatibility adapter from `Note` to `Page`.
4. Notes local-first draft and mutation batch runtime.

