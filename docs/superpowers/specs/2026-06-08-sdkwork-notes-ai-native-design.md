# SDKWork Notes AI-Native Design

Date: 2026-06-08
Status: Draft for review
Owner: sdkwork-notes
Related standards:

- `../sdkwork-specs/SOUL.md`
- `../sdkwork-specs/API_SPEC.md`
- `../sdkwork-specs/DATABASE_SPEC.md`
- `../sdkwork-specs/DOMAIN_SPEC.md`
- `../sdkwork-specs/DRIVE_SPEC.md`
- `../sdkwork-specs/SDK_SPEC.md`
- `../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`
- `../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`

## 1. Decision Summary

SDKWork Notes will be designed as an AI-native knowledge workspace, not as a traditional note CRUD product.

The product model is:

```text
SDKWork Notes
  = Page-based editor
  + Drive-backed content, folders, assets, and versions
  + Object types and properties
  + Collections and multi-view databases
  + Links, backlinks, aliases, and graph projections
  + Local-first sync and recovery
  + AI context, suggestions, citations, and review workflow
```

The core resource is `Page`, not `Note`.

Required naming:

```text
API domain: notes
Core resource: page / pages
Database prefix: notes_
App API prefix: /app/v3/api/notes
Open API prefix: /notes/v3/api
Backend API prefix: /backend/v3/api/notes
App SDK surface: client.notes.pages.*
```

Forbidden new design names:

```text
/notes/notes
notes_note
notes_note_revision
client.notes.notes.*
Notes-owned storage object tables
Notes-owned upload session tables
Notes-owned file version tables
```

## 2. Industry Baseline

The current leading product pattern is no longer a plain note list.

Industry reference points:

- Notion: pages, databases, properties, relations, workspace AI, enterprise search, and structured collaboration.
- Obsidian: local-first files, backlinks, graph view, canvas, properties, sync, and publish.
- Tana: supertags, fields, typed nodes, and structured capture.
- Capacities: object-based notes and relationship-oriented knowledge objects.
- Microsoft Loop: workspaces, pages, components, and Copilot-assisted collaboration.
- Coda: documents plus tables, views, packs, automation, and AI.

SDKWork Notes must therefore treat knowledge as structured, queryable, versioned, linkable, and AI-operable content.

## 3. Product Positioning

SDKWork Notes is an AI-native knowledge workspace for professional knowledge workers, creators, developers, and teams.

Primary product goals:

1. Capture and edit knowledge quickly.
2. Store all durable page content as Drive-backed versioned files.
3. Turn pages into structured objects with typed properties.
4. Provide list, table, board, calendar, gallery, and graph views over the same knowledge set.
5. Make links, backlinks, mentions, aliases, and source citations first-class.
6. Let AI search, summarize, organize, rewrite, extract, and suggest changes with auditability.
7. Support local-first recovery, sync queues, and future collaboration without replacing the storage model.
8. Preserve enterprise boundaries: tenant, organization, permissions, audit, retention, export, and legal hold.

## 4. Scope

### 4.1 P0: Professional Foundation

P0 must create a complete professional base:

- Workspaces.
- Pages.
- Drive-backed page content.
- Drive-backed folders through a Notes facade.
- Drive-backed assets.
- Drive-backed versions and checkpoints.
- Tags.
- Page links and backlinks.
- Local draft recovery.
- Full-text search projection.
- Basic AI jobs: summarize, rewrite, extract tasks, answer from selected pages.
- AI citations tied to Drive version snapshots.
- Generated `sdkwork-notes-app-sdk`.

### 4.2 P1: Leading Knowledge Workspace

P1 adds structured knowledge:

- Object types.
- Property definitions.
- Property values.
- Collections.
- Views: list, table, board, calendar, gallery, graph.
- Page aliases.
- Unlinked mention detection.
- Semantic search projection.
- Templates.
- Inbox capture and daily pages.
- Import and export jobs.
- AI suggestion review queue.

### 4.3 P2: Differentiated Platform

P2 adds advanced platform capabilities:

- Collaborative editing.
- Block-level comments.
- Canvas.
- Automation.
- Plugin runtime.
- Knowledge agents.
- Meeting notes pipeline.
- Enterprise DLP, legal hold, retention, and eDiscovery workflows.

## 5. Ownership Boundaries

### 5.1 Drive Owns

Drive is the authority for:

- Spaces.
- File and folder nodes.
- Object storage.
- Upload sessions.
- Download grants.
- File lifecycle.
- Trash and restore for Drive nodes.
- Node versions.
- Version policy.
- Version retention.
- Storage providers.
- Storage quota.
- Sensitive file operation ledger.

Notes must not store provider details, object keys, buckets, presigned URLs, upload parts, or version lifecycle facts.

### 5.2 Notes Owns

Notes is the authority for:

- Workspace business metadata.
- Page business metadata.
- Page object type bindings.
- Property definitions and values.
- Collections and views.
- Tags.
- Page links, backlinks, aliases, and graph projections.
- AI jobs.
- AI source snapshots.
- AI suggestions and review state.
- Search, outline, insight, and semantic projections.
- Import/export business jobs.
- Local-first sync mutation batches.

### 5.3 Shared Rule

Notes persists stable Drive references only:

```text
drive_space_id
drive_node_id
drive_uri
current_drive_version_id
current_drive_version_no
```

Any Notes projection that uses Drive content must record its source Drive version and be rebuildable.

## 6. Drive Prerequisite Design

The current Drive implementation already has basic version behavior through `dr_drive_storage_object.version_no` and App API `versions.*`.

For SDKWork Notes and other future document products, Drive should evolve to a generic logical node version model.

### 6.1 Drive Version Policy Tables

```text
dr_drive_space_version_policy
  id
  tenant_id
  space_id
  versioning_enabled
  version_mode                  -- disabled, manual, auto_on_replace, checkpoint
  checkpoint_interval_sec
  min_change_bytes
  max_versions
  retention_days
  keep_deleted_versions
  allow_node_override
  legal_hold_enabled
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
dr_drive_node_version_policy
  id
  tenant_id
  space_id
  node_id
  versioning_enabled_override
  version_mode_override
  checkpoint_interval_sec_override
  max_versions_override
  retention_days_override
  keep_deleted_versions_override
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

### 6.2 Drive Logical Version Table

```text
dr_drive_node_version
  id
  tenant_id
  space_id
  node_id
  version_no
  storage_object_id
  content_type
  content_length
  checksum_sha256_hex
  version_kind                  -- auto, manual, restore, import, ai_generated, system
  version_label
  change_source                 -- app_api, backend_api, uploader, sync, ai, import, restore
  change_summary
  restored_from_version_id
  app_id
  app_resource_type
  app_resource_id
  scene
  source
  lifecycle_status
  created_by
  created_at
```

Required indexes:

```text
UNIQUE (tenant_id, node_id, version_no)
INDEX  (tenant_id, node_id, lifecycle_status, version_no DESC)
INDEX  (tenant_id, app_id, app_resource_type, app_resource_id, created_at DESC)
```

### 6.3 Notes Drive Space

Preferred final design:

```text
dr_drive_space.space_type = notes
```

Add a Drive-owned notes profile:

```text
dr_drive_space_notes_profile
  space_id
  tenant_id
  organization_id
  notes_workspace_id
  default_content_type
  default_schema_version
  ai_index_policy_code
  created_at
  updated_at
```

Compatibility option:

```text
space_type = app_upload
app_id = sdkwork-notes
app_resource_type = notes_workspace
app_resource_id = {notes_workspace_id}
```

The compatibility option is acceptable for phase 1, but the final architecture should add first-class `notes` spaces.

## 7. Notes Remote Database Design

All table names use the `notes_` prefix. The `notes` prefix must be registered as the Notes capability under the SDKWork content domain before production schema creation.

### 7.1 Core Tables

```text
notes_workspace
  id
  tenant_id
  organization_id
  owner_subject_type
  owner_subject_id
  name
  description
  drive_space_id
  default_page_content_type
  default_page_schema_version
  ai_index_policy_code
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_page
  id
  tenant_id
  organization_id
  workspace_id
  title
  page_kind                    -- doc, article, code, log, database, canvas
  parent_page_id
  folder_drive_node_id
  drive_space_id
  drive_node_id
  drive_uri
  current_drive_version_id
  current_drive_version_no
  content_type
  content_schema_version
  content_hash
  snippet
  icon
  cover_asset_id
  favorite
  archive_status               -- active, archived
  publish_status               -- private, published, unlisted
  word_count
  task_count
  drive_lifecycle_status_snapshot
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
  deleted_at
```

### 7.2 Object Model

```text
notes_object_type
  id
  tenant_id
  organization_id
  workspace_id
  code
  name
  description
  icon
  color
  system_defined
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_property_definition
  id
  tenant_id
  organization_id
  workspace_id
  object_type_id
  code
  name
  property_type                -- text, number, select, multi_select, date, checkbox, user, page_ref, url, file, formula
  config_json
  required
  searchable
  sortable
  sort_order
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_page_object_type
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  object_type_id
  created_by
  created_at
```

```text
notes_property_value
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  property_definition_id
  value_text
  value_number
  value_boolean
  value_datetime
  value_page_id
  value_user_id
  value_json
  source                         -- user, ai, import, integration
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

### 7.3 Collections And Views

```text
notes_collection
  id
  tenant_id
  organization_id
  workspace_id
  name
  description
  object_type_id
  source_scope                   -- workspace, folder, page_tree, manual
  source_config_json
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_collection_item
  id
  tenant_id
  organization_id
  workspace_id
  collection_id
  page_id
  sort_order
  lifecycle_status
  created_by
  updated_by
  created_at
  updated_at
```

`notes_collection_item` is required only for manual collections. Dynamic collections derive membership from `source_scope` and filters.

```text
notes_view
  id
  tenant_id
  organization_id
  workspace_id
  collection_id
  name
  view_type                      -- list, table, board, calendar, gallery, graph
  config_json
  sort_order
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

### 7.4 Tags, Assets, Links, Aliases, Templates

```text
notes_tag
  id
  tenant_id
  organization_id
  workspace_id
  name
  color
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_page_tag
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  tag_id
  created_by
  created_at
```

```text
notes_page_asset
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  block_id
  asset_role                    -- cover, image, attachment, audio, video, embed
  drive_space_id
  drive_node_id
  drive_uri
  media_resource_snapshot
  sort_order
  lifecycle_status
  created_by
  created_at
  updated_at
```

```text
notes_page_link
  id
  tenant_id
  organization_id
  workspace_id
  source_page_id
  target_page_id
  source_block_id
  link_type                     -- mention, backlink, embed, reference, parent
  anchor_snapshot
  lifecycle_status
  created_by
  created_at
```

```text
notes_page_alias
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  alias_text
  alias_normalized
  source                         -- user, ai, import
  lifecycle_status
  created_by
  created_at
```

```text
notes_template
  id
  tenant_id
  organization_id
  workspace_id
  name
  description
  object_type_id
  template_drive_node_id
  template_drive_uri
  config_json
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

### 7.5 Search And AI Projections

```text
notes_page_search_projection
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  drive_node_id
  source_drive_version_id
  source_drive_version_no
  title_snapshot
  plain_text
  snippet
  tags_snapshot
  object_types_snapshot
  property_values_snapshot
  language
  index_status
  indexed_at
  rebuild_version
```

```text
notes_page_outline_projection
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  source_drive_version_id
  source_drive_version_no
  outline_json
  task_summary_json
  indexed_at
  rebuild_version
```

```text
notes_semantic_index_projection
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  chunk_id
  source_drive_version_id
  source_drive_version_no
  chunk_text_hash
  chunk_text_preview
  embedding_provider
  embedding_model
  embedding_vector_ref
  permission_snapshot_hash
  index_status
  indexed_at
  rebuild_version
```

```text
notes_page_insight_projection
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  source_drive_version_id
  source_drive_version_no
  summary
  keywords
  action_items
  entities
  questions
  insight_status
  generated_by_job_id
  generated_at
  rebuild_version
```

### 7.6 AI Governance Tables

```text
notes_ai_job
  id
  tenant_id
  organization_id
  workspace_id
  job_type                      -- summarize, rewrite, extract_tasks, answer, organize, generate
  target_type                   -- page, collection, workspace, selection
  target_id
  prompt_snapshot
  context_policy_snapshot
  model_provider
  model_name
  status                        -- queued, running, succeeded, failed, canceled
  result_json
  error_code
  error_message
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_ai_job_source
  id
  tenant_id
  organization_id
  workspace_id
  job_id
  source_type                   -- page, collection, workspace, uploaded_context
  source_id
  drive_node_id
  drive_version_id
  drive_version_no
  excerpt_hash
  permission_snapshot_hash
  created_at
```

```text
notes_ai_suggestion
  id
  tenant_id
  organization_id
  workspace_id
  job_id
  target_type                   -- page, property, link, tag, collection
  target_id
  suggestion_type               -- rewrite, tag, property_update, link_create, task_create
  patch_json
  confidence
  review_status                 -- pending, accepted, rejected, modified
  reviewed_by
  reviewed_at
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_ai_feedback
  id
  tenant_id
  organization_id
  workspace_id
  job_id
  suggestion_id
  feedback_type                 -- accepted, rejected, edited, helpful, not_helpful
  feedback_text
  created_by
  created_at
```

AI must not silently mutate durable content. The default path for AI-generated edits is `notes_ai_suggestion` followed by user or automation approval.

### 7.7 Import, Export, Publication, Sync

```text
notes_import_job
  id
  tenant_id
  organization_id
  workspace_id
  source_type
  source_drive_node_id
  status
  result_json
  error_code
  error_message
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_export_job
  id
  tenant_id
  organization_id
  workspace_id
  target_type
  target_id
  export_format
  output_drive_node_id
  output_drive_uri
  status
  result_json
  error_code
  error_message
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_publication
  id
  tenant_id
  organization_id
  workspace_id
  page_id
  publication_status            -- draft, published, unpublished
  slug
  visibility                    -- private, workspace, public, unlisted
  published_drive_version_id
  published_drive_version_no
  published_at
  lifecycle_status
  version
  created_by
  updated_by
  created_at
  updated_at
```

```text
notes_sync_mutation_batch
  id
  tenant_id
  organization_id
  workspace_id
  client_id
  device_id
  base_change_token
  idempotency_key
  mutation_count
  status                        -- accepted, applied, conflict, rejected
  result_json
  created_by
  created_at
  updated_at
```

## 8. Index Design

Recommended high-value indexes:

```text
notes_workspace:
  (tenant_id, organization_id, owner_subject_type, owner_subject_id, lifecycle_status)

notes_page:
  (tenant_id, organization_id, workspace_id, lifecycle_status, updated_at DESC, id)
  (tenant_id, organization_id, workspace_id, folder_drive_node_id, lifecycle_status, updated_at DESC, id)
  (tenant_id, organization_id, workspace_id, parent_page_id, lifecycle_status, sort_order)
  UNIQUE (tenant_id, drive_node_id)

notes_property_value:
  (tenant_id, organization_id, workspace_id, property_definition_id, value_text)
  (tenant_id, organization_id, workspace_id, property_definition_id, value_number)
  (tenant_id, organization_id, workspace_id, property_definition_id, value_datetime)

notes_collection_item:
  (tenant_id, organization_id, workspace_id, collection_id, lifecycle_status, sort_order)
  UNIQUE (tenant_id, collection_id, page_id)

notes_page_link:
  (tenant_id, organization_id, workspace_id, source_page_id, lifecycle_status)
  (tenant_id, organization_id, workspace_id, target_page_id, lifecycle_status)

notes_page_alias:
  (tenant_id, organization_id, workspace_id, alias_normalized, lifecycle_status)

notes_page_search_projection:
  (tenant_id, organization_id, workspace_id, index_status, indexed_at)

notes_semantic_index_projection:
  (tenant_id, organization_id, workspace_id, page_id, source_drive_version_no)
  (tenant_id, organization_id, workspace_id, index_status, indexed_at)

notes_ai_suggestion:
  (tenant_id, organization_id, workspace_id, review_status, created_at DESC)
```

Full-text and vector search should be implemented as a projection over Drive-backed page content, not as the page content source of truth.

## 9. App API

App API prefix:

```text
/app/v3/api/notes
```

All protected App API operations use dual-token app authentication and resolve tenant/organization from context.

### 9.1 Workspace

| Method | Path | operationId |
| --- | --- | --- |
| GET | `/workspaces` | `workspaces.list` |
| POST | `/workspaces` | `workspaces.create` |
| GET | `/workspaces/{workspaceId}` | `workspaces.retrieve` |
| PATCH | `/workspaces/{workspaceId}` | `workspaces.update` |
| DELETE | `/workspaces/{workspaceId}` | `workspaces.delete` |
| GET | `/workspaces/{workspaceId}/bootstrap` | `workspaces.bootstrap.retrieve` |

### 9.2 Pages

| Method | Path | operationId |
| --- | --- | --- |
| GET | `/workspaces/{workspaceId}/pages` | `pages.list` |
| POST | `/workspaces/{workspaceId}/pages` | `pages.create` |
| GET | `/pages/{pageId}` | `pages.retrieve` |
| PATCH | `/pages/{pageId}` | `pages.update` |
| POST | `/pages/{pageId}/move` | `pages.move` |
| POST | `/pages/{pageId}/trash` | `pages.trash` |
| POST | `/pages/{pageId}/restore` | `pages.restore` |
| DELETE | `/pages/{pageId}` | `pages.delete` |

### 9.3 Page Content And Versions

| Method | Path | operationId |
| --- | --- | --- |
| GET | `/pages/{pageId}/content` | `pages.content.retrieve` |
| PUT | `/pages/{pageId}/content` | `pages.content.update` |
| POST | `/pages/{pageId}/content/checkpoints` | `pages.content.checkpoints.create` |
| GET | `/pages/{pageId}/versions` | `pages.versions.list` |
| GET | `/pages/{pageId}/versions/{versionId}` | `pages.versions.retrieve` |
| POST | `/pages/{pageId}/versions/{versionId}/restore` | `pages.versions.restore` |
| DELETE | `/pages/{pageId}/versions/{versionId}` | `pages.versions.delete` |
| GET | `/pages/{pageId}/version_policy` | `pages.versionPolicy.retrieve` |
| PATCH | `/pages/{pageId}/version_policy` | `pages.versionPolicy.update` |

The Notes version APIs are business facades over Drive node versions.

### 9.4 Object Types, Collections, Views

| Method | Path | operationId |
| --- | --- | --- |
| GET | `/workspaces/{workspaceId}/object_types` | `objectTypes.list` |
| POST | `/workspaces/{workspaceId}/object_types` | `objectTypes.create` |
| GET | `/object_types/{objectTypeId}` | `objectTypes.retrieve` |
| PATCH | `/object_types/{objectTypeId}` | `objectTypes.update` |
| DELETE | `/object_types/{objectTypeId}` | `objectTypes.delete` |
| GET | `/object_types/{objectTypeId}/properties` | `objectTypes.properties.list` |
| POST | `/object_types/{objectTypeId}/properties` | `objectTypes.properties.create` |
| PATCH | `/properties/{propertyId}` | `properties.update` |
| DELETE | `/properties/{propertyId}` | `properties.delete` |
| GET | `/workspaces/{workspaceId}/collections` | `collections.list` |
| POST | `/workspaces/{workspaceId}/collections` | `collections.create` |
| GET | `/collections/{collectionId}` | `collections.retrieve` |
| PATCH | `/collections/{collectionId}` | `collections.update` |
| DELETE | `/collections/{collectionId}` | `collections.delete` |
| GET | `/collections/{collectionId}/views` | `collections.views.list` |
| POST | `/collections/{collectionId}/views` | `collections.views.create` |
| PATCH | `/views/{viewId}` | `views.update` |
| DELETE | `/views/{viewId}` | `views.delete` |

### 9.5 Tags, Assets, Links, Search, AI, Sync

| Method | Path | operationId |
| --- | --- | --- |
| GET | `/workspaces/{workspaceId}/tags` | `tags.list` |
| POST | `/workspaces/{workspaceId}/tags` | `tags.create` |
| PUT | `/pages/{pageId}/tags` | `pages.tags.update` |
| GET | `/pages/{pageId}/assets` | `pages.assets.list` |
| POST | `/pages/{pageId}/assets` | `pages.assets.create` |
| DELETE | `/pages/{pageId}/assets/{assetId}` | `pages.assets.delete` |
| GET | `/pages/{pageId}/links` | `pages.links.list` |
| GET | `/pages/{pageId}/backlinks` | `pages.backlinks.list` |
| GET | `/search` | `search.query` |
| POST | `/ai_jobs` | `aiJobs.create` |
| GET | `/ai_jobs/{aiJobId}` | `aiJobs.retrieve` |
| POST | `/ai_jobs/{aiJobId}/cancel` | `aiJobs.cancel` |
| GET | `/ai_suggestions` | `aiSuggestions.list` |
| POST | `/ai_suggestions/{suggestionId}/accept` | `aiSuggestions.accept` |
| POST | `/ai_suggestions/{suggestionId}/reject` | `aiSuggestions.reject` |
| GET | `/workspaces/{workspaceId}/changes` | `workspaces.changes.list` |
| GET | `/workspaces/{workspaceId}/changes/start_page_token` | `workspaces.changes.startPageToken.retrieve` |
| POST | `/workspaces/{workspaceId}/mutation_batches` | `workspaces.mutationBatches.create` |
| GET | `/mutation_batches/{mutationBatchId}` | `mutationBatches.retrieve` |

## 10. Open API

Open API prefix:

```text
/notes/v3/api
```

Protected Open API operations use API key context. Open API must not expose app login/session flows.

| Method | Path | operationId |
| --- | --- | --- |
| GET | `/workspaces` | `workspaces.list` |
| GET | `/pages` | `pages.list` |
| POST | `/pages` | `pages.create` |
| GET | `/pages/{pageId}` | `pages.retrieve` |
| PATCH | `/pages/{pageId}` | `pages.update` |
| GET | `/pages/{pageId}/content` | `pages.content.retrieve` |
| PUT | `/pages/{pageId}/content` | `pages.content.update` |
| GET | `/pages/{pageId}/versions` | `pages.versions.list` |
| GET | `/collections` | `collections.list` |
| GET | `/collections/{collectionId}` | `collections.retrieve` |
| GET | `/search` | `search.query` |
| POST | `/exports` | `exports.create` |
| GET | `/exports/{exportId}` | `exports.retrieve` |

Open API must not expose:

- Drive bucket names.
- Drive object keys.
- Provider endpoint details.
- Presigned URLs as persistent identity.
- Internal AI prompt chains.
- Raw permission snapshots.

## 11. Backend API

Backend API prefix:

```text
/backend/v3/api/notes
```

Backend API is for governance, diagnostics, repair, audit, and administrative operations.

| Method | Path | operationId |
| --- | --- | --- |
| GET | `/workspaces` | `workspaces.admin.list` |
| GET | `/workspaces/{workspaceId}` | `workspaces.admin.retrieve` |
| PATCH | `/workspaces/{workspaceId}` | `workspaces.admin.update` |
| POST | `/workspaces/{workspaceId}/archive` | `workspaces.archive` |
| POST | `/workspaces/{workspaceId}/restore` | `workspaces.restore` |
| GET | `/workspaces/{workspaceId}/drive_binding` | `workspaces.driveBinding.retrieve` |
| POST | `/workspaces/{workspaceId}/repair_drive_binding` | `workspaces.driveBinding.repair` |
| GET | `/pages` | `pages.admin.list` |
| GET | `/pages/{pageId}` | `pages.admin.retrieve` |
| POST | `/pages/{pageId}/rebuild_projection` | `pages.projection.rebuild` |
| GET | `/index_jobs` | `indexJobs.list` |
| POST | `/index_jobs` | `indexJobs.create` |
| GET | `/index_jobs/{indexJobId}` | `indexJobs.retrieve` |
| GET | `/ai_jobs` | `aiJobs.admin.list` |
| GET | `/ai_jobs/{aiJobId}` | `aiJobs.admin.retrieve` |
| POST | `/ai_jobs/{aiJobId}/cancel` | `aiJobs.cancel` |
| GET | `/audit_events` | `auditEvents.list` |
| GET | `/diagnostics/drive_orphans` | `diagnostics.driveOrphans.list` |
| POST | `/diagnostics/drive_orphans/repair` | `diagnostics.driveOrphans.repair` |

Drive version retention, storage provider, object sweep, and quota APIs remain under `/backend/v3/api/drive`.

## 12. SDK Workspace Design

Target product root additions:

```text
sdkwork-notes/
  services/
    sdkwork-notes-pages-service
    sdkwork-notes-app-api
    sdkwork-notes-backend-api
    sdkwork-notes-open-api
  sdks/
    sdkwork-notes-sdk
    sdkwork-notes-app-sdk
    sdkwork-notes-backend-sdk
  generated/
    openapi/
  docs/
    schema-registry/
```

SDK family dependencies:

```text
sdkwork-notes-app-sdk
  depends on sdkwork-drive-app-sdk
  depends on appbase/IAM app SDK

sdkwork-notes-backend-sdk
  depends on sdkwork-drive-backend-sdk

sdkwork-notes-sdk
  depends on public API key context only
```

Rules:

- Notes OpenAPI authorities must not copy dependency-owned Drive operations.
- Frontend services consume generated Notes SDK and generated Drive SDK through injected clients.
- UI must not construct raw HTTP requests or manually assemble auth headers.
- Generated SDK output must not be hand-edited.

## 13. Local-First Client Model

The existing `sdkwork-notes-pc-react` app remains the primary PC/Web/Desktop client root.

Target package responsibilities:

```text
@sdkwork/notes-core
  SDK bootstrap, injected client ports, runtime config, token manager composition.

@sdkwork/notes-notes
  Page workspace UI and domain orchestration.

@sdkwork/notes-local
  Local durable drafts, workspace snapshots, SQLite/IndexedDB abstraction, recovery envelopes.

@sdkwork/notes-sync
  Mutation queue, replay, idempotency, conflict detection, remote apply client port.

@sdkwork/notes-search
  Local full-text and semantic projection adapters.

@sdkwork/notes-ai
  Future package for AI job orchestration UI and suggestion review.

@sdkwork/notes-desktop
  Tauri host bridge only; no domain rules.
```

Migration note:

Existing `Note`, `NoteSummary`, and `NoteFolder` types are compatibility models. New remote contracts should use `Page`, `PageSummary`, and Drive-backed folder facades.

## 14. Key Workflows

### 14.1 Create Page

```text
App client
  -> notes.pages.create
  -> Notes validates workspace permission
  -> Notes ensures Drive notes space
  -> Drive creates file node
  -> Drive writes initial page content
  -> Notes inserts notes_page with drive references
  -> Notes schedules search/insight projection
```

### 14.2 Save Page Content

```text
Editor autosave
  -> local draft write
  -> sync mutation batch or direct notes.pages.content.update
  -> Notes validates page permission
  -> Drive resolves effective version policy
  -> Drive writes content and version/checkpoint as policy requires
  -> Notes updates current_drive_version_no and read projections
```

### 14.3 Restore Version

```text
User selects version
  -> notes.pages.versions.restore
  -> Notes validates permission
  -> Drive restores node version or creates restore version
  -> Notes refreshes current version pointers and projections
```

### 14.4 AI Suggestion

```text
User runs AI command
  -> notes.aiJobs.create
  -> Notes records context policy
  -> AI worker resolves allowed source pages and Drive versions
  -> notes_ai_job_source records citation sources
  -> AI result creates notes_ai_suggestion rows
  -> User reviews suggestions
  -> Accepted suggestions become normal page/property/link mutations
```

## 15. Implementation Phases

### Phase 0: Contract Freeze

- Register `notes` prefix/capability.
- Write schema registry drafts.
- Write OpenAPI authority drafts.
- Decide Drive `notes` space vs `app_upload` phase-1 compatibility.
- Decide phase-1 handling of `dr_drive_node_version` migration.

### Phase 1: Drive-Backed Pages

- Add Notes service skeletons.
- Add Notes App/Open/Backend API authorities.
- Generate SDK families.
- Add `notes_workspace`, `notes_page`, `notes_page_asset`, `notes_page_link`, `notes_page_search_projection`.
- Wire page create/read/content save/version list through Drive.
- Keep existing PC app UI mostly unchanged through compatibility adapters.

### Phase 2: Local-First And Search

- Add durable local page draft snapshots.
- Add mutation batch sync.
- Add search projection refresh.
- Add Drive version checkpoint UX.
- Add conflict reporting and recovery.

### Phase 3: Object System

- Add object types, properties, collections, and views.
- Add table/list/board/calendar/gallery views.
- Add property index rules.

### Phase 4: AI-Native Layer

- Add AI job service.
- Add AI source/citation tracking.
- Add AI suggestion review.
- Add semantic index projection.
- Add AI-assisted tagging, linking, summarization, and rewrite flows.

### Phase 5: Collaboration And Platform

- Add collaboration service boundary.
- Add comments/canvas/automation/plugin planning.
- Add enterprise governance workflows.

## 16. Open Questions

1. Should Drive add `space_type = notes` before Notes phase 1, or should Notes phase 1 use `app_upload` compatibility?
2. Should `dr_drive_node_version` be introduced before Notes content save, or should phase 1 continue using `dr_drive_storage_object.version_no` with policy tables?
3. Which storage format is canonical for page content: `application/vnd.sdkwork.notes.page+json`, Markdown, or an HTML compatibility envelope?
4. Which AI provider/model registry owns model selection: Notes local config or a shared `intelligence` domain?
5. Should vector embeddings live in a shared data/intelligence vector service, with `notes_semantic_index_projection.embedding_vector_ref` as a reference only?

## 17. Acceptance Criteria

The design is acceptable when:

- No new Notes design duplicates Drive storage, upload, folder, or version ownership.
- New APIs do not use `/notes/notes`.
- New SDK operation IDs produce `client.notes.pages.*`, not `client.notes.notes.*`.
- App, Open, and Backend API surfaces are separated.
- Database tables have clear facts vs projection ownership.
- AI-generated changes are reviewable and auditable.
- Every projection records source Drive version.
- The existing PC app has a compatibility migration path from `Note` models to `Page` models.

## 18. References

- Notion AI: `https://www.notion.com/product/ai`
- Notion API page reference: `https://developers.notion.com/reference/page`
- Obsidian Help: `https://help.obsidian.md/`
- Tana Docs: `https://tana.inc/docs`
- Capacities: `https://capacities.io/`
- Microsoft Loop: `https://www.microsoft.com/en-us/microsoft-loop`
- Coda: `https://coda.io/product`
