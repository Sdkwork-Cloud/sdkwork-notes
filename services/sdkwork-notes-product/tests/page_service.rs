use async_trait::async_trait;
use sdkwork_notes_product::domain::{
    AcceptAiSuggestionCommand, ApplyAiSuggestionCommand, ClaimAiJobCommand, CompleteAiJobCommand,
    CompleteAiSuggestionInput, CreateAiFeedbackCommand, CreateAiJobCommand, CreatePageCommand,
    CreateWorkspaceCommand, DrivePageContentSnapshot, DriveVersionPage, DriveVersionSummary,
    ListAiJobsQuery, ListAiSuggestionFeedbackQuery, ListPageAiSuggestionsQuery,
    ListPageVersionsQuery, ListPagesQuery, ListWorkspacesQuery, NotesActorContext, PageInfo,
    PageKind, RejectAiSuggestionCommand, SearchQuery, UpdatePageContentCommand,
    UpdatePageMetadataCommand,
};
use sdkwork_notes_product::error::NotesProductError;
use sdkwork_notes_product::infrastructure::sql::install_sqlite_schema;
use sdkwork_notes_product::infrastructure::sql::notes_store::SqlNotesStore;
use sdkwork_notes_product::ports::{
    CreateDrivePageContentCommand, DrivePageContentPort, ListDrivePageContentVersionsCommand,
    ReadDrivePageContentCommand, UpdateDrivePageContentCommand,
};
use sdkwork_notes_product::service::NotesService;
use serde_json::json;
use sqlx::any::AnyPoolOptions;
use sqlx::Row;
use std::collections::BTreeMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tokio::test]
async fn page_content_lifecycle_stores_drive_refs_and_updates_current_version() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let drive = FakeDrivePageContentPort::default();
    let service = NotesService::new(SqlNotesStore::new(pool.clone()), drive.clone());
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: Some("AI notes workspace".to_string()),
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");
    assert_eq!(workspace.drive_space_id, "drive-space-001");

    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "hello" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    assert_eq!(page.drive_space_id, "drive-space-001");
    assert_eq!(page.drive_node_id, "drive-node-page-001");
    assert_eq!(
        page.drive_uri,
        "drive://spaces/drive-space-001/nodes/drive-node-page-001"
    );
    assert_eq!(
        page.current_drive_version_id.as_deref(),
        Some("drive-version-page-001-v1")
    );
    assert_eq!(page.current_drive_version_no, Some(1));

    let updated = service
        .update_page_content(UpdatePageContentCommand {
            context: actor.clone(),
            page_id: page.id.clone(),
            content: json!({ "blocks": [{ "type": "paragraph", "text": "hello v2" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Autosave".to_string()),
            expected_drive_version_id: Some("drive-version-page-001-v1".to_string()),
            create_checkpoint: false,
        })
        .await
        .expect("page content should update");
    assert_eq!(updated.drive_version_id, "drive-version-page-001-v2");
    assert_eq!(updated.drive_version_no, 2);

    let refreshed_page = service
        .get_page(&actor, &page.id)
        .await
        .expect("page should be readable");
    assert_eq!(
        refreshed_page.current_drive_version_id.as_deref(),
        Some("drive-version-page-001-v2")
    );
    assert_eq!(refreshed_page.current_drive_version_no, Some(2));

    let content = service
        .get_page_content(&actor, &page.id)
        .await
        .expect("page content should be read through Drive");
    assert_eq!(content.content["blocks"][0]["text"], "hello v2");
    assert_eq!(content.drive_version_id, "drive-version-page-001-v2");
}

#[tokio::test]
async fn page_workflows_normalize_context_and_resource_ids_before_repository_and_drive_access() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let drive = FakeDrivePageContentPort::default();
    let service = NotesService::new(SqlNotesStore::new(pool), drive.clone());
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };
    let padded_actor = NotesActorContext {
        tenant_id: " tenant-001 ".to_string(),
        organization_id: " org-001 ".to_string(),
        operator_id: " user-001 ".to_string(),
    };

    service
        .create_workspace(CreateWorkspaceCommand {
            id: " workspace-001 ".to_string(),
            context: actor.clone(),
            owner_subject_type: " user ".to_string(),
            owner_subject_id: " user-001 ".to_string(),
            name: " Product Lab ".to_string(),
            description: None,
            drive_space_id: " drive-space-001 ".to_string(),
            default_page_content_type: " application/vnd.sdkwork.notes.page+json ".to_string(),
            default_page_schema_version: " 1 ".to_string(),
            ai_index_policy_code: " default ".to_string(),
        })
        .await
        .expect("workspace creation should normalize metadata");

    let page = service
        .create_page(CreatePageCommand {
            id: " page-001 ".to_string(),
            context: padded_actor.clone(),
            workspace_id: " workspace-001 ".to_string(),
            title: " Roadmap ".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "hello" }] }),
            content_type: " application/vnd.sdkwork.notes.page+json ".to_string(),
            content_schema_version: " 1 ".to_string(),
            change_summary: Some(" Initial page ".to_string()),
        })
        .await
        .expect("page creation should use normalized context and ids");
    assert_eq!(page.id, "page-001");
    assert_eq!(page.tenant_id, "tenant-001");
    assert_eq!(page.organization_id, "org-001");
    assert_eq!(page.created_by, "user-001");
    assert_eq!(page.title, "Roadmap");

    let listed = service
        .list_pages(ListPagesQuery {
            context: padded_actor.clone(),
            workspace_id: " workspace-001 ".to_string(),
            page: 1,
            page_size: 20,
            q: Some(" roadmap ".to_string()),
        })
        .await
        .expect("page list should use normalized context and workspace id");
    assert_eq!(listed.items.len(), 1);
    assert_eq!(listed.items[0].id, "page-001");

    let bootstrap = service
        .get_workspace_bootstrap(&padded_actor, " workspace-001 ")
        .await
        .expect("workspace bootstrap should use normalized context and workspace id");
    assert_eq!(bootstrap.root_pages.len(), 1);
    assert_eq!(bootstrap.root_pages[0].id, "page-001");

    let updated_page = service
        .update_page_metadata(UpdatePageMetadataCommand {
            context: padded_actor.clone(),
            page_id: " page-001 ".to_string(),
            title: Some(" Roadmap v2 ".to_string()),
            favorite: Some(true),
            archive_status: Some(" active ".to_string()),
            publish_status: Some(" private ".to_string()),
            expected_version: Some(" 1 ".to_string()),
        })
        .await
        .expect("metadata update should normalize context, ids, and patch values");
    assert_eq!(updated_page.title, "Roadmap v2");
    assert!(updated_page.favorite);

    let content = service
        .update_page_content(UpdatePageContentCommand {
            context: padded_actor.clone(),
            page_id: " page-001 ".to_string(),
            content: json!({ "blocks": [{ "type": "paragraph", "text": "hello v2" }] }),
            content_type: " application/vnd.sdkwork.notes.page+json ".to_string(),
            content_schema_version: " 1 ".to_string(),
            change_summary: Some(" Autosave ".to_string()),
            expected_drive_version_id: Some(" drive-version-page-001-v1 ".to_string()),
            create_checkpoint: false,
        })
        .await
        .expect("content update should use normalized context and page id");
    assert_eq!(content.page_id, "page-001");
    assert_eq!(content.drive_version_id, "drive-version-page-001-v2");

    let versions = service
        .list_page_versions(ListPageVersionsQuery {
            context: padded_actor,
            page_id: " page-001 ".to_string(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("version list should use normalized context and page id");
    assert_eq!(versions.items.len(), 2);

    let request = drive
        .last_version_list_request()
        .await
        .expect("Drive version list request should be recorded");
    assert_eq!(request.tenant_id, "tenant-001");
    assert_eq!(request.organization_id, "org-001");
    assert_eq!(request.page_id, "page-001");
}

#[tokio::test]
async fn update_page_content_validates_payload_before_drive_content_is_written() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let drive = FakeDrivePageContentPort::default();
    let service = NotesService::new(SqlNotesStore::new(pool), drive.clone());
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");
    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id,
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    let drive_update_count = drive.update_count("page-001").await;
    let invalid_content = service
        .update_page_content(UpdatePageContentCommand {
            context: actor.clone(),
            page_id: page.id.clone(),
            content: json!("plain text is not the notes page envelope"),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Invalid content".to_string()),
            expected_drive_version_id: page.current_drive_version_id.clone(),
            create_checkpoint: false,
        })
        .await;
    assert!(matches!(
        invalid_content,
        Err(NotesProductError::Validation(_))
    ));
    assert_eq!(drive.update_count("page-001").await, drive_update_count);

    let blank_content_type = service
        .update_page_content(UpdatePageContentCommand {
            context: actor,
            page_id: page.id,
            content: json!({ "blocks": [] }),
            content_type: " ".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Invalid content type".to_string()),
            expected_drive_version_id: page.current_drive_version_id,
            create_checkpoint: false,
        })
        .await;
    assert!(matches!(
        blank_content_type,
        Err(NotesProductError::Validation(_))
    ));
    assert_eq!(drive.update_count("page-001").await, drive_update_count);
}

#[tokio::test]
async fn create_page_validates_metadata_before_drive_content_is_written() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let drive = FakeDrivePageContentPort::default();
    let service = NotesService::new(SqlNotesStore::new(pool), drive.clone());
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    let too_long_title_result = service
        .create_page(CreatePageCommand {
            id: "page-title-too-long".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "T".repeat(513),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Invalid create".to_string()),
        })
        .await;
    assert!(matches!(
        too_long_title_result,
        Err(NotesProductError::Validation(_))
    ));
    assert!(!drive.has_page("page-title-too-long").await);

    let missing_parent_result = service
        .create_page(CreatePageCommand {
            id: "page-missing-parent".to_string(),
            context: actor,
            workspace_id: workspace.id,
            title: "Child page".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: Some("missing-parent".to_string()),
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Invalid parent".to_string()),
        })
        .await;
    assert!(matches!(
        missing_parent_result,
        Err(NotesProductError::NotFound(_))
    ));
    assert!(!drive.has_page("page-missing-parent").await);
}

#[tokio::test]
async fn create_workspace_normalizes_and_validates_metadata_before_sql_constraints() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: " workspace-trimmed ".to_string(),
            context: actor.clone(),
            owner_subject_type: " user ".to_string(),
            owner_subject_id: " user-001 ".to_string(),
            name: " Product Lab ".to_string(),
            description: Some(" AI notes workspace ".to_string()),
            drive_space_id: " drive-space-trimmed ".to_string(),
            default_page_content_type: " application/vnd.sdkwork.notes.page+json ".to_string(),
            default_page_schema_version: " 1 ".to_string(),
            ai_index_policy_code: " default ".to_string(),
        })
        .await
        .expect("workspace metadata should be normalized before insert");
    assert_eq!(workspace.id, "workspace-trimmed");
    assert_eq!(workspace.owner_subject_type, "user");
    assert_eq!(workspace.owner_subject_id, "user-001");
    assert_eq!(workspace.name, "Product Lab");
    assert_eq!(workspace.description.as_deref(), Some("AI notes workspace"));
    assert_eq!(workspace.drive_space_id, "drive-space-trimmed");
    assert_eq!(
        workspace.default_page_content_type,
        "application/vnd.sdkwork.notes.page+json"
    );
    assert_eq!(workspace.default_page_schema_version, "1");
    assert_eq!(workspace.ai_index_policy_code, "default");

    let invalid_owner_type = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-invalid-owner".to_string(),
            context: actor.clone(),
            owner_subject_type: "team".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Invalid Owner".to_string(),
            description: None,
            drive_space_id: "drive-space-invalid-owner".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await;
    assert!(matches!(
        invalid_owner_type,
        Err(NotesProductError::Validation(_))
    ));

    let too_long_name = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-name-too-long".to_string(),
            context: actor,
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "W".repeat(121),
            description: None,
            drive_space_id: "drive-space-name-too-long".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await;
    assert!(matches!(
        too_long_name,
        Err(NotesProductError::Validation(_))
    ));
}

#[tokio::test]
async fn read_models_list_bootstrap_and_update_page_metadata_without_drive_content_changes() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: Some("AI notes workspace".to_string()),
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-002".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Research Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-002".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("second workspace should be created");

    let first_page = service
        .create_page(CreatePageCommand {
            id: "page-roadmap".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Apollo roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "roadmap" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial roadmap".to_string()),
        })
        .await
        .expect("root page should be created");

    service
        .create_page(CreatePageCommand {
            id: "page-child".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Apollo child detail".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: Some(first_page.id.clone()),
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial child".to_string()),
        })
        .await
        .expect("child page should be created");

    service
        .create_page(CreatePageCommand {
            id: "page-meeting".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Release meeting".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial meeting".to_string()),
        })
        .await
        .expect("second root page should be created");

    let workspaces = service
        .list_workspaces(ListWorkspacesQuery {
            context: actor.clone(),
            page: 1,
            page_size: 1,
        })
        .await
        .expect("workspaces should be listed");
    assert_eq!(workspaces.items.len(), 1);
    assert_eq!(workspaces.page_info.page, 1);
    assert_eq!(workspaces.page_info.page_size, 1);
    assert!(workspaces.page_info.has_more);

    let roadmap_pages = service
        .list_pages(ListPagesQuery {
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            page: 1,
            page_size: 20,
            q: Some("roadmap".to_string()),
        })
        .await
        .expect("pages should be searchable by title");
    assert_eq!(roadmap_pages.items.len(), 1);
    assert_eq!(roadmap_pages.items[0].id, "page-roadmap");
    assert_eq!(
        roadmap_pages.items[0].current_drive_version_no.as_deref(),
        Some("1")
    );

    let bootstrap = service
        .get_workspace_bootstrap(&actor, &workspace.id)
        .await
        .expect("workspace bootstrap should be returned");
    assert_eq!(bootstrap.workspace.id, workspace.id);
    assert_eq!(bootstrap.root_pages.len(), 2);
    assert!(bootstrap
        .root_pages
        .iter()
        .all(|page| page.id != "page-child"));
    assert!(bootstrap
        .object_types
        .iter()
        .any(|object_type| object_type.code == "database"));

    let updated_page = service
        .update_page_metadata(UpdatePageMetadataCommand {
            context: actor.clone(),
            page_id: first_page.id.clone(),
            title: Some("Apollo roadmap v2".to_string()),
            favorite: Some(true),
            archive_status: Some("archived".to_string()),
            publish_status: Some("unlisted".to_string()),
            expected_version: Some(first_page.version.to_string()),
        })
        .await
        .expect("page metadata should update");
    assert_eq!(updated_page.title, "Apollo roadmap v2");
    assert!(updated_page.favorite);
    assert_eq!(
        updated_page.current_drive_version_id,
        first_page.current_drive_version_id
    );
    assert_eq!(
        updated_page.current_drive_version_no,
        first_page.current_drive_version_no
    );

    let stale_update = service
        .update_page_metadata(UpdatePageMetadataCommand {
            context: actor,
            page_id: first_page.id,
            title: Some("stale title".to_string()),
            favorite: None,
            archive_status: None,
            publish_status: None,
            expected_version: Some("1".to_string()),
        })
        .await;
    assert!(matches!(stale_update, Err(NotesProductError::Conflict(_))));
}

#[tokio::test]
async fn page_versions_are_listed_from_drive_without_notes_revision_rows() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let drive = FakeDrivePageContentPort::default();
    let service = NotesService::new(SqlNotesStore::new(pool), drive.clone());
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id,
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "hello" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    service
        .update_page_content(UpdatePageContentCommand {
            context: actor.clone(),
            page_id: page.id.clone(),
            content: json!({ "blocks": [{ "type": "paragraph", "text": "hello v2" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Autosave".to_string()),
            expected_drive_version_id: page.current_drive_version_id.clone(),
            create_checkpoint: false,
        })
        .await
        .expect("page content should update");

    let versions = service
        .list_page_versions(ListPageVersionsQuery {
            context: actor,
            page_id: page.id,
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page versions should be listed through Drive");

    assert_eq!(versions.page_info.page, 1);
    assert_eq!(versions.page_info.page_size, 20);
    assert!(!versions.page_info.has_more);
    assert_eq!(versions.items.len(), 2);
    assert_eq!(
        versions.items[0].drive_version_id,
        "drive-version-page-001-v2"
    );
    assert_eq!(versions.items[0].drive_version_no, 2);
    assert_eq!(versions.items[0].version_kind, "auto");
    assert_eq!(
        versions.items[1].drive_version_id,
        "drive-version-page-001-v1"
    );

    let request = drive
        .last_version_list_request()
        .await
        .expect("Drive version list request should be recorded");
    assert_eq!(request.drive_space_id, "drive-space-001");
    assert_eq!(request.drive_node_id, "drive-node-page-001");
    assert_eq!(
        request.drive_uri,
        "drive://spaces/drive-space-001/nodes/drive-node-page-001"
    );
}

#[tokio::test]
async fn search_query_returns_page_summaries_with_drive_version_provenance() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-002".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Research Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-002".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("second workspace should be created");

    let roadmap = service
        .create_page(CreatePageCommand {
            id: "page-roadmap".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Apollo roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "launch notes" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial roadmap".to_string()),
        })
        .await
        .expect("roadmap page should be created");

    service
        .update_page_content(UpdatePageContentCommand {
            context: actor.clone(),
            page_id: roadmap.id.clone(),
            content: json!({ "blocks": [{ "type": "paragraph", "text": "roadmap launch v2" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Roadmap update".to_string()),
            expected_drive_version_id: roadmap.current_drive_version_id,
            create_checkpoint: true,
        })
        .await
        .expect("roadmap content should update");

    service
        .create_page(CreatePageCommand {
            id: "page-other-workspace".to_string(),
            context: actor.clone(),
            workspace_id: "workspace-002".to_string(),
            title: "Apollo roadmap outside scope".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial other page".to_string()),
        })
        .await
        .expect("other workspace page should be created");

    let search = service
        .query_search(SearchQuery {
            context: actor,
            workspace_id: Some(workspace.id),
            q: Some("roadmap".to_string()),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("search should return current page projections");

    assert_eq!(search.page_info.page, 1);
    assert_eq!(search.page_info.page_size, 20);
    assert!(!search.page_info.has_more);
    assert_eq!(search.items.len(), 1);
    assert_eq!(search.items[0].page.id, "page-roadmap");
    assert_eq!(
        search.items[0].page.current_drive_version_no.as_deref(),
        Some("2")
    );
    assert_eq!(
        search.items[0].source_drive_version_id.as_deref(),
        Some("drive-version-page-roadmap-v2")
    );
    assert_eq!(search.items[0].source_drive_version_no, "2");
    assert_eq!(search.items[0].highlights, vec!["Apollo roadmap"]);
}

#[tokio::test]
async fn ai_job_creation_records_page_source_drive_version_provenance_and_idempotency() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool.clone()),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "hello" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    service
        .update_page_content(UpdatePageContentCommand {
            context: actor.clone(),
            page_id: page.id.clone(),
            content: json!({ "blocks": [{ "type": "paragraph", "text": "hello v2" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Autosave".to_string()),
            expected_drive_version_id: page.current_drive_version_id.clone(),
            create_checkpoint: true,
        })
        .await
        .expect("page content should update");

    let command = CreateAiJobCommand {
        context: actor.clone(),
        workspace_id: workspace.id.clone(),
        job_type: "summarize".to_string(),
        target_type: "page".to_string(),
        target_id: Some(page.id.clone()),
        prompt: Some("Summarize this page".to_string()),
        context_policy: Some(json!({ "source": "current_page" })),
        idempotency_key: "ai-job-create-001".to_string(),
    };

    let job = service
        .create_ai_job(command.clone())
        .await
        .expect("AI job should be queued");
    assert_eq!(job.workspace_id, workspace.id);
    assert_eq!(job.job_type, "summarize");
    assert_eq!(job.target_type, "page");
    assert_eq!(job.target_id.as_deref(), Some("page-001"));
    assert_eq!(job.status, "queued");
    assert!(job.result.is_none());

    let source_row = sqlx::query(
        "SELECT source_type, source_id, drive_node_id, drive_version_id, drive_version_no
         FROM notes_ai_job_source
         WHERE tenant_id=$1 AND organization_id=$2 AND job_id=$3",
    )
    .bind(&actor.tenant_id)
    .bind(&actor.organization_id)
    .bind(&job.id)
    .fetch_one(&pool)
    .await
    .expect("AI job source should be persisted");

    let source_type: String = source_row.get("source_type");
    let source_id: String = source_row.get("source_id");
    let drive_node_id: String = source_row.get("drive_node_id");
    let drive_version_id: String = source_row.get("drive_version_id");
    let drive_version_no: i64 = source_row.get("drive_version_no");
    assert_eq!(source_type, "page");
    assert_eq!(source_id, "page-001");
    assert_eq!(drive_node_id, "drive-node-page-001");
    assert_eq!(drive_version_id, "drive-version-page-001-v2");
    assert_eq!(drive_version_no, 2);

    let replay = service
        .create_ai_job(command.clone())
        .await
        .expect("same idempotency key and payload should replay existing AI job");
    assert_eq!(replay.id, job.id);

    let conflicting_replay = service
        .create_ai_job(CreateAiJobCommand {
            prompt: Some("Use the same key for a different request".to_string()),
            ..command
        })
        .await;
    assert!(matches!(
        conflicting_replay,
        Err(NotesProductError::Conflict(_))
    ));
}

#[tokio::test]
async fn ai_job_creation_hashes_and_resolves_normalized_request_values() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");
    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    let normalized_job = service
        .create_ai_job(CreateAiJobCommand {
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            job_type: "summarize".to_string(),
            target_type: "page".to_string(),
            target_id: Some(page.id.clone()),
            prompt: Some("Summarize this page".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: "ai-job-normalization-001".to_string(),
        })
        .await
        .expect("normalized AI job should be created");

    let replay_with_spaces = service
        .create_ai_job(CreateAiJobCommand {
            context: actor,
            workspace_id: " workspace-001 ".to_string(),
            job_type: " summarize ".to_string(),
            target_type: " page ".to_string(),
            target_id: Some(" page-001 ".to_string()),
            prompt: Some(" Summarize this page ".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: " ai-job-normalization-001 ".to_string(),
        })
        .await
        .expect("equivalent normalized AI job request should replay");

    assert_eq!(replay_with_spaces.id, normalized_job.id);
    assert_eq!(replay_with_spaces.workspace_id, "workspace-001");
    assert_eq!(replay_with_spaces.target_id.as_deref(), Some("page-001"));
}

#[tokio::test]
async fn ai_workflows_normalize_context_and_resource_ids_before_repository_and_drive_access() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let drive = FakeDrivePageContentPort::default();
    let service = NotesService::new(SqlNotesStore::new(pool), drive.clone());
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };
    let padded_actor = NotesActorContext {
        tenant_id: " tenant-001 ".to_string(),
        organization_id: " org-001 ".to_string(),
        operator_id: " user-001 ".to_string(),
    };

    service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");
    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: "workspace-001".to_string(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "hello" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    let job = service
        .create_ai_job(CreateAiJobCommand {
            context: padded_actor.clone(),
            workspace_id: " workspace-001 ".to_string(),
            job_type: " summarize ".to_string(),
            target_type: " page ".to_string(),
            target_id: Some(" page-001 ".to_string()),
            prompt: Some(" Summarize ".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: " ai-normalized-001 ".to_string(),
        })
        .await
        .expect("AI job should be created with normalized request values");

    let listed_jobs = service
        .list_ai_jobs(ListAiJobsQuery {
            context: padded_actor.clone(),
            workspace_id: Some(" workspace-001 ".to_string()),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("AI jobs should be listed with normalized workspace filter");
    assert_eq!(listed_jobs.items.len(), 1);
    assert_eq!(listed_jobs.items[0].id, job.id);

    service
        .get_ai_job(&padded_actor, &format!(" {} ", job.id))
        .await
        .expect("AI job should be retrieved with normalized id");
    service
        .claim_ai_job(ClaimAiJobCommand {
            context: padded_actor.clone(),
            ai_job_id: format!(" {} ", job.id),
        })
        .await
        .expect("AI job should be claimed with normalized id");
    service
        .complete_ai_job(CompleteAiJobCommand {
            context: padded_actor.clone(),
            ai_job_id: format!(" {} ", job.id),
            suggestions: vec![CompleteAiSuggestionInput {
                page_id: Some(" page-001 ".to_string()),
                suggestion_type: " summary ".to_string(),
                payload: json!({
                    "content": { "blocks": [{ "type": "paragraph", "text": "AI draft" }] },
                    "contentType": " application/vnd.sdkwork.notes.page+json ",
                    "contentSchemaVersion": " 1 "
                }),
            }],
        })
        .await
        .expect("AI job should complete with normalized suggestion inputs");

    let suggestions = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: padded_actor.clone(),
            page_id: " page-001 ".to_string(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("AI suggestions should be listed with normalized page id");
    assert_eq!(suggestions.items.len(), 1);
    let suggestion = suggestions.items[0].clone();
    assert_eq!(suggestion.page_id, page.id);

    service
        .accept_ai_suggestion(AcceptAiSuggestionCommand {
            context: padded_actor.clone(),
            ai_suggestion_id: format!(" {} ", suggestion.id),
        })
        .await
        .expect("AI suggestion should be accepted with normalized id");
    let content = service
        .apply_ai_suggestion(ApplyAiSuggestionCommand {
            context: padded_actor.clone(),
            ai_suggestion_id: format!(" {} ", suggestion.id),
            expected_drive_version_id: Some(" drive-version-page-001-v1 ".to_string()),
            create_checkpoint: true,
        })
        .await
        .expect("AI suggestion should apply with normalized ids and Drive expectation");
    assert_eq!(content.page_id, "page-001");
    assert_eq!(content.content["blocks"][0]["text"], "AI draft");

    let feedback = service
        .create_ai_feedback(CreateAiFeedbackCommand {
            context: padded_actor.clone(),
            ai_suggestion_id: format!(" {} ", suggestion.id),
            feedback_type: " helpful ".to_string(),
            feedback_text: Some(" Useful ".to_string()),
        })
        .await
        .expect("AI feedback should be recorded with normalized suggestion id");
    assert_eq!(feedback.feedback_text.as_deref(), Some("Useful"));

    let feedback_page = service
        .list_ai_suggestion_feedback(ListAiSuggestionFeedbackQuery {
            context: padded_actor,
            ai_suggestion_id: format!(" {} ", suggestion.id),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("AI feedback should be listed with normalized suggestion id");
    assert_eq!(feedback_page.items.len(), 1);
    assert_eq!(feedback_page.items[0].id, feedback.id);

    assert_eq!(drive.update_count("page-001").await, 1);
}

#[tokio::test]
async fn backend_ai_job_admin_lists_retrieves_and_cancels_jobs() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "admin-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "admin-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "hello" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    let job = service
        .create_ai_job(CreateAiJobCommand {
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            job_type: "summarize".to_string(),
            target_type: "page".to_string(),
            target_id: Some(page.id),
            prompt: Some("Summarize this page".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: "ai-job-admin-001".to_string(),
        })
        .await
        .expect("AI job should be created");

    let jobs = service
        .list_ai_jobs(ListAiJobsQuery {
            context: actor.clone(),
            workspace_id: Some(workspace.id.clone()),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("AI jobs should be listed");
    assert_eq!(jobs.items.len(), 1);
    assert_eq!(jobs.items[0].id, job.id);
    assert_eq!(jobs.items[0].source_count, 1);
    assert_eq!(jobs.items[0].suggestion_count, 0);
    assert!(!jobs.page_info.has_more);

    let retrieved = service
        .get_ai_job(&actor, &job.id)
        .await
        .expect("AI job should be retrieved");
    assert_eq!(retrieved.id, job.id);
    assert_eq!(retrieved.status, "queued");
    assert_eq!(retrieved.source_count, 1);

    let canceled = service
        .cancel_ai_job(&actor, &job.id)
        .await
        .expect("AI job should cancel");
    assert_eq!(canceled.status, "canceled");
    assert_eq!(canceled.source_count, 1);

    let second_cancel = service
        .cancel_ai_job(&actor, &job.id)
        .await
        .expect("canceling an already canceled AI job should be idempotent");
    assert_eq!(second_cancel.status, "canceled");
}

#[tokio::test]
async fn ai_job_worker_claims_completes_and_lists_page_suggestions() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "worker-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "worker-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "launch plan" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    service
        .update_page_content(UpdatePageContentCommand {
            context: actor.clone(),
            page_id: page.id.clone(),
            content: json!({ "blocks": [{ "type": "paragraph", "text": "launch plan v2" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Content selected for AI".to_string()),
            expected_drive_version_id: page.current_drive_version_id.clone(),
            create_checkpoint: true,
        })
        .await
        .expect("page content should update before AI job is created");

    let job = service
        .create_ai_job(CreateAiJobCommand {
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            job_type: "summarize".to_string(),
            target_type: "page".to_string(),
            target_id: Some(page.id.clone()),
            prompt: Some("Summarize this page".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: "ai-job-worker-001".to_string(),
        })
        .await
        .expect("AI job should be created");

    let claimed = service
        .claim_ai_job(ClaimAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id.clone(),
        })
        .await
        .expect("AI job should be claimed");
    assert_eq!(claimed.status, "running");
    assert_eq!(claimed.suggestion_count, 0);

    let completed = service
        .complete_ai_job(CompleteAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id.clone(),
            suggestions: vec![CompleteAiSuggestionInput {
                page_id: Some(page.id.clone()),
                suggestion_type: "summary".to_string(),
                payload: json!({
                    "summary": "Launch plan v2 is ready for review.",
                    "confidence": "high"
                }),
            }],
        })
        .await
        .expect("AI job should complete with a suggestion");
    assert_eq!(completed.status, "succeeded");
    assert_eq!(completed.source_count, 1);
    assert_eq!(completed.suggestion_count, 1);

    let suggestions = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: actor.clone(),
            page_id: page.id.clone(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page AI suggestions should be listed");
    assert_eq!(suggestions.items.len(), 1);
    assert_eq!(suggestions.items[0].page_id, page.id);
    assert_eq!(suggestions.items[0].ai_job_id, job.id);
    assert_eq!(suggestions.items[0].suggestion_type, "summary");
    assert_eq!(suggestions.items[0].status, "proposed");
    assert_eq!(
        suggestions.items[0].source_drive_version_id.as_deref(),
        Some("drive-version-page-001-v2")
    );
    assert_eq!(suggestions.items[0].source_drive_version_no, Some(2));
    assert_eq!(
        suggestions.items[0].payload["summary"],
        "Launch plan v2 is ready for review."
    );
    assert!(!suggestions.page_info.has_more);

    let second_complete = service
        .complete_ai_job(CompleteAiJobCommand {
            context: actor,
            ai_job_id: job.id,
            suggestions: vec![CompleteAiSuggestionInput {
                page_id: Some("page-001".to_string()),
                suggestion_type: "summary".to_string(),
                payload: json!({ "summary": "duplicate" }),
            }],
        })
        .await;
    assert!(matches!(
        second_complete,
        Err(NotesProductError::Conflict(_))
    ));
}

#[tokio::test]
async fn ai_suggestion_decisions_accept_reject_and_conflict() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "launch plan" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    let job = service
        .create_ai_job(CreateAiJobCommand {
            context: actor.clone(),
            workspace_id: workspace.id,
            job_type: "summarize".to_string(),
            target_type: "page".to_string(),
            target_id: Some(page.id.clone()),
            prompt: Some("Summarize and tag this page".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: "ai-suggestion-decision-001".to_string(),
        })
        .await
        .expect("AI job should be created");

    service
        .claim_ai_job(ClaimAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id.clone(),
        })
        .await
        .expect("AI job should be claimed");
    service
        .complete_ai_job(CompleteAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id,
            suggestions: vec![
                CompleteAiSuggestionInput {
                    page_id: Some(page.id.clone()),
                    suggestion_type: "summary".to_string(),
                    payload: json!({ "summary": "Launch plan is ready." }),
                },
                CompleteAiSuggestionInput {
                    page_id: Some(page.id.clone()),
                    suggestion_type: "tag".to_string(),
                    payload: json!({ "tag": "launch" }),
                },
            ],
        })
        .await
        .expect("AI job should complete with suggestions");

    let suggestions = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: actor.clone(),
            page_id: page.id.clone(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page suggestions should be listed");
    assert_eq!(suggestions.items.len(), 2);
    let summary_suggestion = suggestions
        .items
        .iter()
        .find(|suggestion| suggestion.suggestion_type == "summary")
        .expect("summary suggestion should exist");
    let tag_suggestion = suggestions
        .items
        .iter()
        .find(|suggestion| suggestion.suggestion_type == "tag")
        .expect("tag suggestion should exist");
    assert_eq!(summary_suggestion.status, "proposed");
    assert_eq!(tag_suggestion.status, "proposed");

    let accepted = service
        .accept_ai_suggestion(AcceptAiSuggestionCommand {
            context: actor.clone(),
            ai_suggestion_id: summary_suggestion.id.clone(),
        })
        .await
        .expect("summary suggestion should be accepted");
    assert_eq!(accepted.status, "accepted");
    assert_eq!(accepted.page_id, page.id);

    let accepted_replay = service
        .accept_ai_suggestion(AcceptAiSuggestionCommand {
            context: actor.clone(),
            ai_suggestion_id: summary_suggestion.id.clone(),
        })
        .await
        .expect("accepting an accepted suggestion should be idempotent");
    assert_eq!(accepted_replay.status, "accepted");

    let rejected = service
        .reject_ai_suggestion(RejectAiSuggestionCommand {
            context: actor.clone(),
            ai_suggestion_id: tag_suggestion.id.clone(),
        })
        .await
        .expect("tag suggestion should be rejected");
    assert_eq!(rejected.status, "rejected");

    let conflicting_reject = service
        .reject_ai_suggestion(RejectAiSuggestionCommand {
            context: actor,
            ai_suggestion_id: summary_suggestion.id.clone(),
        })
        .await;
    assert!(matches!(
        conflicting_reject,
        Err(NotesProductError::Conflict(_))
    ));
}

#[tokio::test]
async fn accepted_ai_suggestion_applies_drive_backed_page_content() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "launch plan" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    let job = service
        .create_ai_job(CreateAiJobCommand {
            context: actor.clone(),
            workspace_id: workspace.id,
            job_type: "summarize".to_string(),
            target_type: "page".to_string(),
            target_id: Some(page.id.clone()),
            prompt: Some("Rewrite this page into concise launch notes".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: "ai-suggestion-apply-001".to_string(),
        })
        .await
        .expect("AI job should be created");

    service
        .claim_ai_job(ClaimAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id.clone(),
        })
        .await
        .expect("AI job should be claimed");
    service
        .complete_ai_job(CompleteAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id,
            suggestions: vec![CompleteAiSuggestionInput {
                page_id: Some(page.id.clone()),
                suggestion_type: "summary".to_string(),
                payload: json!({
                    "contentType": "application/vnd.sdkwork.notes.page+json",
                    "contentSchemaVersion": "1",
                    "content": {
                        "blocks": [
                            { "type": "heading", "text": "Launch notes" },
                            { "type": "paragraph", "text": "Launch plan is ready for review." }
                        ]
                    }
                }),
            }],
        })
        .await
        .expect("AI job should complete with an applicable suggestion");

    let suggestions = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: actor.clone(),
            page_id: page.id.clone(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page suggestions should be listed");
    let suggestion = suggestions
        .items
        .iter()
        .find(|suggestion| suggestion.suggestion_type == "summary")
        .expect("summary suggestion should exist");

    service
        .accept_ai_suggestion(AcceptAiSuggestionCommand {
            context: actor.clone(),
            ai_suggestion_id: suggestion.id.clone(),
        })
        .await
        .expect("summary suggestion should be accepted");

    let applied = service
        .apply_ai_suggestion(ApplyAiSuggestionCommand {
            context: actor.clone(),
            ai_suggestion_id: suggestion.id.clone(),
            expected_drive_version_id: page.current_drive_version_id.clone(),
            create_checkpoint: true,
        })
        .await
        .expect("accepted suggestion should apply through Drive");
    assert_eq!(applied.page_id, page.id);
    assert_eq!(applied.drive_node_id, "drive-node-page-001");
    assert_eq!(applied.drive_version_id, "drive-version-page-001-v2");
    assert_eq!(applied.drive_version_no, 2);
    assert_eq!(applied.content["blocks"][0]["text"], "Launch notes");

    let refreshed_suggestions = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: actor.clone(),
            page_id: page.id.clone(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page suggestions should be listed after apply");
    let applied_suggestion = refreshed_suggestions
        .items
        .iter()
        .find(|item| item.id == suggestion.id)
        .expect("applied suggestion should still be listed");
    assert_eq!(applied_suggestion.status, "applied");

    let refreshed_page = service
        .get_page(&actor, &page.id)
        .await
        .expect("page should be readable after suggestion apply");
    assert_eq!(
        refreshed_page.current_drive_version_id.as_deref(),
        Some("drive-version-page-001-v2")
    );
}

#[tokio::test]
async fn stale_ai_suggestion_apply_requires_current_drive_version() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");
    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [{ "type": "paragraph", "text": "initial" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");
    let job = service
        .create_ai_job(CreateAiJobCommand {
            context: actor.clone(),
            workspace_id: workspace.id,
            job_type: "rewrite".to_string(),
            target_type: "page".to_string(),
            target_id: Some(page.id.clone()),
            prompt: Some("Rewrite".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: "ai-suggestion-stale-apply-001".to_string(),
        })
        .await
        .expect("AI job should be created from page version 1");
    service
        .claim_ai_job(ClaimAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id.clone(),
        })
        .await
        .expect("AI job should be claimed");
    service
        .complete_ai_job(CompleteAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id,
            suggestions: vec![CompleteAiSuggestionInput {
                page_id: Some(page.id.clone()),
                suggestion_type: "rewrite".to_string(),
                payload: json!({
                    "content": { "blocks": [{ "type": "paragraph", "text": "stale rewrite" }] }
                }),
            }],
        })
        .await
        .expect("AI job should complete with suggestion");
    let suggestion = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: actor.clone(),
            page_id: page.id.clone(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page suggestions should be listed")
        .items[0]
        .clone();
    service
        .accept_ai_suggestion(AcceptAiSuggestionCommand {
            context: actor.clone(),
            ai_suggestion_id: suggestion.id.clone(),
        })
        .await
        .expect("suggestion should be accepted");

    service
        .update_page_content(UpdatePageContentCommand {
            context: actor.clone(),
            page_id: page.id.clone(),
            content: json!({ "blocks": [{ "type": "paragraph", "text": "manual v2" }] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Manual update".to_string()),
            expected_drive_version_id: page.current_drive_version_id.clone(),
            create_checkpoint: false,
        })
        .await
        .expect("manual edit should advance page to version 2");

    let apply_result = service
        .apply_ai_suggestion(ApplyAiSuggestionCommand {
            context: actor.clone(),
            ai_suggestion_id: suggestion.id.clone(),
            expected_drive_version_id: None,
            create_checkpoint: true,
        })
        .await;
    assert!(matches!(apply_result, Err(NotesProductError::Conflict(_))));

    let still_accepted = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: actor.clone(),
            page_id: page.id.clone(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page suggestions should remain readable")
        .items
        .into_iter()
        .find(|item| item.id == suggestion.id)
        .expect("stale suggestion should remain present");
    assert_eq!(still_accepted.status, "accepted");

    let content = service
        .get_page_content(&actor, &page.id)
        .await
        .expect("page content should still be readable");
    assert_eq!(content.content["blocks"][0]["text"], "manual v2");
}

#[tokio::test]
async fn proposed_ai_suggestion_cannot_be_applied() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");
    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");
    let job = service
        .create_ai_job(CreateAiJobCommand {
            context: actor.clone(),
            workspace_id: workspace.id,
            job_type: "summarize".to_string(),
            target_type: "page".to_string(),
            target_id: Some(page.id.clone()),
            prompt: Some("Summarize".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: "ai-suggestion-apply-conflict-001".to_string(),
        })
        .await
        .expect("AI job should be created");
    service
        .claim_ai_job(ClaimAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id.clone(),
        })
        .await
        .expect("AI job should be claimed");
    service
        .complete_ai_job(CompleteAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id,
            suggestions: vec![CompleteAiSuggestionInput {
                page_id: Some(page.id.clone()),
                suggestion_type: "summary".to_string(),
                payload: json!({
                    "content": { "blocks": [{ "type": "paragraph", "text": "proposed" }] }
                }),
            }],
        })
        .await
        .expect("AI job should complete with a suggestion");

    let suggestions = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: actor.clone(),
            page_id: page.id.clone(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page suggestions should be listed");
    let suggestion = suggestions.items[0].clone();

    let apply_result = service
        .apply_ai_suggestion(ApplyAiSuggestionCommand {
            context: actor,
            ai_suggestion_id: suggestion.id,
            expected_drive_version_id: page.current_drive_version_id,
            create_checkpoint: true,
        })
        .await;
    assert!(matches!(apply_result, Err(NotesProductError::Conflict(_))));
}

#[tokio::test]
async fn ai_suggestion_feedback_is_recorded_for_quality_loop() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    let workspace = service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");

    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");

    let job = service
        .create_ai_job(CreateAiJobCommand {
            context: actor.clone(),
            workspace_id: workspace.id.clone(),
            job_type: "summarize".to_string(),
            target_type: "page".to_string(),
            target_id: Some(page.id.clone()),
            prompt: Some("Summarize this page".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: "ai-suggestion-feedback-001".to_string(),
        })
        .await
        .expect("AI job should be created");
    service
        .claim_ai_job(ClaimAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id.clone(),
        })
        .await
        .expect("AI job should be claimed");
    service
        .complete_ai_job(CompleteAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id.clone(),
            suggestions: vec![CompleteAiSuggestionInput {
                page_id: Some(page.id.clone()),
                suggestion_type: "summary".to_string(),
                payload: json!({ "summary": "Roadmap is ready." }),
            }],
        })
        .await
        .expect("AI job should complete with suggestion");

    let suggestions = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: actor.clone(),
            page_id: page.id.clone(),
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page suggestions should be listed");
    let suggestion = suggestions.items[0].clone();

    let feedback = service
        .create_ai_feedback(CreateAiFeedbackCommand {
            context: actor.clone(),
            ai_suggestion_id: suggestion.id.clone(),
            feedback_type: "helpful".to_string(),
            feedback_text: Some("Useful summary for launch review".to_string()),
        })
        .await
        .expect("AI suggestion feedback should be recorded");
    assert_eq!(feedback.workspace_id, workspace.id);
    assert_eq!(feedback.job_id, job.id);
    assert_eq!(
        feedback.suggestion_id.as_deref(),
        Some(suggestion.id.as_str())
    );
    assert_eq!(feedback.feedback_type, "helpful");
    assert_eq!(
        feedback.feedback_text.as_deref(),
        Some("Useful summary for launch review")
    );

    let replay = service
        .create_ai_feedback(CreateAiFeedbackCommand {
            context: actor.clone(),
            ai_suggestion_id: suggestion.id.clone(),
            feedback_type: "helpful".to_string(),
            feedback_text: Some("Useful summary for launch review".to_string()),
        })
        .await
        .expect("same feedback payload should be idempotent");
    assert_eq!(replay.id, feedback.id);

    let feedback_page = service
        .list_ai_suggestion_feedback(ListAiSuggestionFeedbackQuery {
            context: actor,
            ai_suggestion_id: suggestion.id,
            page: 1,
            page_size: 20,
        })
        .await
        .expect("AI suggestion feedback should be listed");
    assert_eq!(feedback_page.items.len(), 1);
    assert_eq!(feedback_page.items[0].id, feedback.id);
    assert!(!feedback_page.page_info.has_more);
}

#[tokio::test]
async fn invalid_ai_suggestion_feedback_type_is_rejected() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let service = NotesService::new(
        SqlNotesStore::new(pool),
        FakeDrivePageContentPort::default(),
    );
    let actor = NotesActorContext {
        tenant_id: "tenant-001".to_string(),
        organization_id: "org-001".to_string(),
        operator_id: "user-001".to_string(),
    };

    service
        .create_workspace(CreateWorkspaceCommand {
            id: "workspace-001".to_string(),
            context: actor.clone(),
            owner_subject_type: "user".to_string(),
            owner_subject_id: "user-001".to_string(),
            name: "Product Lab".to_string(),
            description: None,
            drive_space_id: "drive-space-001".to_string(),
            default_page_content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            default_page_schema_version: "1".to_string(),
            ai_index_policy_code: "default".to_string(),
        })
        .await
        .expect("workspace should be created");
    let page = service
        .create_page(CreatePageCommand {
            id: "page-001".to_string(),
            context: actor.clone(),
            workspace_id: "workspace-001".to_string(),
            title: "Roadmap".to_string(),
            page_kind: PageKind::Doc,
            parent_page_id: None,
            folder_drive_node_id: None,
            initial_content: json!({ "blocks": [] }),
            content_type: "application/vnd.sdkwork.notes.page+json".to_string(),
            content_schema_version: "1".to_string(),
            change_summary: Some("Initial page".to_string()),
        })
        .await
        .expect("page should be created");
    let job = service
        .create_ai_job(CreateAiJobCommand {
            context: actor.clone(),
            workspace_id: "workspace-001".to_string(),
            job_type: "summarize".to_string(),
            target_type: "page".to_string(),
            target_id: Some(page.id.clone()),
            prompt: Some("Summarize".to_string()),
            context_policy: Some(json!({ "source": "current_page" })),
            idempotency_key: "ai-suggestion-feedback-invalid-001".to_string(),
        })
        .await
        .expect("AI job should be created");
    service
        .claim_ai_job(ClaimAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id.clone(),
        })
        .await
        .expect("AI job should be claimed");
    service
        .complete_ai_job(CompleteAiJobCommand {
            context: actor.clone(),
            ai_job_id: job.id,
            suggestions: vec![CompleteAiSuggestionInput {
                page_id: Some(page.id.clone()),
                suggestion_type: "summary".to_string(),
                payload: json!({ "summary": "Roadmap is ready." }),
            }],
        })
        .await
        .expect("AI job should complete with suggestion");

    let suggestions = service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: actor.clone(),
            page_id: page.id,
            page: 1,
            page_size: 20,
        })
        .await
        .expect("page suggestions should be listed");

    let result = service
        .create_ai_feedback(CreateAiFeedbackCommand {
            context: actor,
            ai_suggestion_id: suggestions.items[0].id.clone(),
            feedback_type: "confusing".to_string(),
            feedback_text: None,
        })
        .await;
    assert!(matches!(result, Err(NotesProductError::Validation(_))));
}

#[derive(Clone, Default)]
struct FakeDrivePageContentPort {
    records: Arc<Mutex<BTreeMap<String, DrivePageContentSnapshot>>>,
    update_counts: Arc<Mutex<BTreeMap<String, usize>>>,
    last_version_list_request: Arc<Mutex<Option<ListDrivePageContentVersionsCommand>>>,
}

impl FakeDrivePageContentPort {
    async fn last_version_list_request(&self) -> Option<ListDrivePageContentVersionsCommand> {
        self.last_version_list_request.lock().await.clone()
    }

    async fn has_page(&self, page_id: &str) -> bool {
        self.records.lock().await.contains_key(page_id)
    }

    async fn update_count(&self, page_id: &str) -> usize {
        self.update_counts
            .lock()
            .await
            .get(page_id)
            .copied()
            .unwrap_or(0)
    }
}

#[async_trait]
impl DrivePageContentPort for FakeDrivePageContentPort {
    async fn create_page_content(
        &self,
        command: CreateDrivePageContentCommand,
    ) -> Result<DrivePageContentSnapshot, sdkwork_notes_product::error::NotesProductError> {
        let snapshot = DrivePageContentSnapshot {
            drive_space_id: command.drive_space_id.clone(),
            drive_node_id: format!("drive-node-{}", command.page_id),
            drive_uri: format!(
                "drive://spaces/{}/nodes/drive-node-{}",
                command.drive_space_id, command.page_id
            ),
            drive_version_id: format!("drive-version-{}-v1", command.page_id),
            drive_version_no: 1,
            content_type: command.content_type,
            content_schema_version: command.content_schema_version,
            content_hash: Some("sha256:first".to_string()),
            snippet: Some("hello".to_string()),
            word_count: 1,
            task_count: 0,
            content: command.content,
        };
        self.records
            .lock()
            .await
            .insert(command.page_id, snapshot.clone());
        Ok(snapshot)
    }

    async fn update_page_content(
        &self,
        command: UpdateDrivePageContentCommand,
    ) -> Result<DrivePageContentSnapshot, sdkwork_notes_product::error::NotesProductError> {
        {
            let mut update_counts = self.update_counts.lock().await;
            let count = update_counts.entry(command.page_id.clone()).or_insert(0);
            *count += 1;
        }

        let snapshot = DrivePageContentSnapshot {
            drive_space_id: command.drive_space_id.clone(),
            drive_node_id: command.drive_node_id.clone(),
            drive_uri: command.drive_uri.clone(),
            drive_version_id: format!("drive-version-{}-v2", command.page_id),
            drive_version_no: 2,
            content_type: command.content_type,
            content_schema_version: command.content_schema_version,
            content_hash: Some("sha256:second".to_string()),
            snippet: Some("hello v2".to_string()),
            word_count: 2,
            task_count: 0,
            content: command.content,
        };
        self.records
            .lock()
            .await
            .insert(command.page_id, snapshot.clone());
        Ok(snapshot)
    }

    async fn read_page_content(
        &self,
        command: ReadDrivePageContentCommand,
    ) -> Result<DrivePageContentSnapshot, sdkwork_notes_product::error::NotesProductError> {
        self.records
            .lock()
            .await
            .get(&command.page_id)
            .cloned()
            .ok_or_else(|| {
                sdkwork_notes_product::error::NotesProductError::NotFound(
                    "page content not found".to_string(),
                )
            })
    }

    async fn list_page_content_versions(
        &self,
        command: ListDrivePageContentVersionsCommand,
    ) -> Result<DriveVersionPage, sdkwork_notes_product::error::NotesProductError> {
        let current = self
            .records
            .lock()
            .await
            .get(&command.page_id)
            .cloned()
            .ok_or_else(|| {
                sdkwork_notes_product::error::NotesProductError::NotFound(
                    "page content not found".to_string(),
                )
            })?;

        self.last_version_list_request
            .lock()
            .await
            .replace(command.clone());

        let mut items = vec![DriveVersionSummary {
            drive_version_id: current.drive_version_id,
            drive_version_no: current.drive_version_no,
            version_kind: "auto".to_string(),
            version_label: Some("Autosave".to_string()),
            change_summary: Some("Autosave".to_string()),
            created_at: "2026-06-08T00:00:02Z".to_string(),
        }];

        if command.page == 1 && command.page_size > 1 {
            items.push(DriveVersionSummary {
                drive_version_id: format!("drive-version-{}-v1", command.page_id),
                drive_version_no: 1,
                version_kind: "initial".to_string(),
                version_label: Some("Initial".to_string()),
                change_summary: Some("Initial page".to_string()),
                created_at: "2026-06-08T00:00:01Z".to_string(),
            });
        }

        Ok(DriveVersionPage {
            items,
            page_info: PageInfo {
                page: command.page,
                page_size: command.page_size,
                has_more: false,
                next_cursor: None,
            },
        })
    }
}
