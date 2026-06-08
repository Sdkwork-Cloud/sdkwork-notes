# SDKWork Notes Schema Registry

This directory contains authored database contract drafts for the AI-native SDKWork Notes product design.

These files are not database migrations. They describe intended table ownership, facts, projections, and indexing so implementation work can generate or validate concrete DDL later.

Authoritative design:

- `../superpowers/specs/2026-06-08-sdkwork-notes-ai-native-design.md`

Canonical standards:

- `../../sdkwork-specs/DATABASE_SPEC.md`
- `../../sdkwork-specs/DOMAIN_SPEC.md`
- `../../sdkwork-specs/DRIVE_SPEC.md`

## Ownership

Notes owns page metadata, object model, collections, links, AI governance, search projections, and sync/import/export business jobs.

Drive owns file content, folders, assets, object storage, upload sessions, download grants, node versions, and version policies. Notes tables store stable Drive references only.

## Table Files

- `tables/001-notes-core.yaml`: workspace, page, tag, asset, link, alias, template.
- `tables/002-notes-object-system.yaml`: object types, properties, collections, views.
- `tables/003-notes-ai-projections.yaml`: search, outline, semantic, insight, AI job/source/suggestion/feedback.
- `tables/004-notes-sync-import-export.yaml`: import, export, publication, sync mutation batches.
