//! Notes persistence entities for `sdkwork-database-repository`.
//!
//! These entities align with `database/contract/table-registry.json` and provide
//! canonical table metadata for repository integration. `SqlNotesStore` continues
//! to own complex query paths while table contracts live here.

use sdkwork_database_repository::{impl_entity_string_pk, Entity};
use serde::{Deserialize, Serialize};

pub const NOTES_REGISTRY_TABLES: &[&str] = &[
    "notes_workspace",
    "notes_page",
    "notes_page_search_projection",
    "notes_ai_job",
    "notes_ai_job_source",
    "notes_ai_suggestion",
    "notes_ai_feedback",
];

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NotesWorkspaceEntity {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub owner_subject_type: String,
    pub owner_subject_id: String,
    pub name: String,
    pub description: Option<String>,
    pub drive_space_id: String,
    pub default_page_content_type: String,
    pub default_page_schema_version: String,
    pub ai_index_policy_code: String,
    pub lifecycle_status: String,
    pub version: i64,
    pub created_by: String,
    pub updated_by: String,
    pub created_at: String,
    pub updated_at: String,
}

impl_entity_string_pk!(
    NotesWorkspaceEntity,
    "notes_workspace",
    id,
    [
        id,
        tenant_id,
        organization_id,
        owner_subject_type,
        owner_subject_id,
        name,
        description,
        drive_space_id,
        default_page_content_type,
        default_page_schema_version,
        ai_index_policy_code,
        lifecycle_status,
        version,
        created_by,
        updated_by,
        created_at,
        updated_at
    ]
);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NotesPageEntity {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub workspace_id: String,
    pub title: String,
    pub page_kind: String,
    pub parent_page_id: Option<String>,
    pub folder_drive_node_id: Option<String>,
    pub drive_space_id: String,
    pub drive_node_id: String,
    pub drive_uri: String,
    pub current_drive_version_id: String,
    pub current_drive_version_no: i64,
    pub content_type: String,
    pub content_schema_version: String,
    pub content_hash: Option<String>,
    pub snippet: Option<String>,
    pub icon: Option<String>,
    pub cover_asset_id: Option<String>,
    pub favorite: i64,
    pub archive_status: String,
    pub publish_status: String,
    pub word_count: i64,
    pub task_count: i64,
    pub drive_lifecycle_status_snapshot: Option<String>,
    pub lifecycle_status: String,
    pub version: i64,
    pub created_by: String,
    pub updated_by: String,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

impl_entity_string_pk!(
    NotesPageEntity,
    "notes_page",
    id,
    [
        id,
        tenant_id,
        organization_id,
        workspace_id,
        title,
        page_kind,
        parent_page_id,
        folder_drive_node_id,
        drive_space_id,
        drive_node_id,
        drive_uri,
        current_drive_version_id,
        current_drive_version_no,
        content_type,
        content_schema_version,
        content_hash,
        snippet,
        icon,
        cover_asset_id,
        favorite,
        archive_status,
        publish_status,
        word_count,
        task_count,
        drive_lifecycle_status_snapshot,
        lifecycle_status,
        version,
        created_by,
        updated_by,
        created_at,
        updated_at,
        deleted_at
    ]
);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NotesPageSearchProjectionEntity {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub workspace_id: String,
    pub page_id: String,
    pub drive_node_id: String,
    pub source_drive_version_id: String,
    pub source_drive_version_no: i64,
    pub title_snapshot: String,
    pub plain_text: String,
    pub snippet: Option<String>,
    pub tags_snapshot: Option<String>,
    pub object_types_snapshot: Option<String>,
    pub property_values_snapshot: Option<String>,
    pub language: Option<String>,
    pub index_status: String,
    pub indexed_at: Option<String>,
    pub rebuild_version: i64,
}

impl_entity_string_pk!(
    NotesPageSearchProjectionEntity,
    "notes_page_search_projection",
    id,
    [
        id,
        tenant_id,
        organization_id,
        workspace_id,
        page_id,
        drive_node_id,
        source_drive_version_id,
        source_drive_version_no,
        title_snapshot,
        plain_text,
        snippet,
        tags_snapshot,
        object_types_snapshot,
        property_values_snapshot,
        language,
        index_status,
        indexed_at,
        rebuild_version
    ]
);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NotesAiJobEntity {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub workspace_id: String,
    pub job_type: String,
    pub target_type: String,
    pub target_id: Option<String>,
    pub prompt_snapshot: Option<String>,
    pub context_policy_snapshot: String,
    pub model_provider: Option<String>,
    pub model_name: Option<String>,
    pub status: String,
    pub result_json: Option<String>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub idempotency_key: String,
    pub request_payload_hash: String,
    pub lifecycle_status: String,
    pub version: i64,
    pub created_by: String,
    pub updated_by: String,
    pub created_at: String,
    pub updated_at: String,
}

impl_entity_string_pk!(
    NotesAiJobEntity,
    "notes_ai_job",
    id,
    [
        id,
        tenant_id,
        organization_id,
        workspace_id,
        job_type,
        target_type,
        target_id,
        prompt_snapshot,
        context_policy_snapshot,
        model_provider,
        model_name,
        status,
        result_json,
        error_code,
        error_message,
        idempotency_key,
        request_payload_hash,
        lifecycle_status,
        version,
        created_by,
        updated_by,
        created_at,
        updated_at
    ]
);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NotesAiJobSourceEntity {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub workspace_id: String,
    pub job_id: String,
    pub source_type: String,
    pub source_id: Option<String>,
    pub drive_node_id: Option<String>,
    pub drive_version_id: Option<String>,
    pub drive_version_no: Option<i64>,
    pub excerpt_hash: Option<String>,
    pub permission_snapshot_hash: String,
    pub created_at: String,
}

impl_entity_string_pk!(
    NotesAiJobSourceEntity,
    "notes_ai_job_source",
    id,
    [
        id,
        tenant_id,
        organization_id,
        workspace_id,
        job_id,
        source_type,
        source_id,
        drive_node_id,
        drive_version_id,
        drive_version_no,
        excerpt_hash,
        permission_snapshot_hash,
        created_at
    ]
);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NotesAiSuggestionEntity {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub workspace_id: String,
    pub page_id: String,
    pub ai_job_id: String,
    pub suggestion_type: String,
    pub status: String,
    pub source_drive_node_id: Option<String>,
    pub source_drive_version_id: Option<String>,
    pub source_drive_version_no: Option<i64>,
    pub payload_json: String,
    pub lifecycle_status: String,
    pub version: i64,
    pub created_by: String,
    pub updated_by: String,
    pub created_at: String,
    pub updated_at: String,
}

impl_entity_string_pk!(
    NotesAiSuggestionEntity,
    "notes_ai_suggestion",
    id,
    [
        id,
        tenant_id,
        organization_id,
        workspace_id,
        page_id,
        ai_job_id,
        suggestion_type,
        status,
        source_drive_node_id,
        source_drive_version_id,
        source_drive_version_no,
        payload_json,
        lifecycle_status,
        version,
        created_by,
        updated_by,
        created_at,
        updated_at
    ]
);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NotesAiFeedbackEntity {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub workspace_id: String,
    pub job_id: String,
    pub suggestion_id: Option<String>,
    pub feedback_type: String,
    pub feedback_text: Option<String>,
    pub created_by: String,
    pub created_at: String,
}

impl_entity_string_pk!(
    NotesAiFeedbackEntity,
    "notes_ai_feedback",
    id,
    [
        id,
        tenant_id,
        organization_id,
        workspace_id,
        job_id,
        suggestion_id,
        feedback_type,
        feedback_text,
        created_by,
        created_at
    ]
);

pub fn registered_entity_table_names() -> Vec<&'static str> {
    vec![
        NotesWorkspaceEntity::table_name(),
        NotesPageEntity::table_name(),
        NotesPageSearchProjectionEntity::table_name(),
        NotesAiJobEntity::table_name(),
        NotesAiJobSourceEntity::table_name(),
        NotesAiSuggestionEntity::table_name(),
        NotesAiFeedbackEntity::table_name(),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn registry_tables_match_database_contract() {
        assert_eq!(registered_entity_table_names(), NOTES_REGISTRY_TABLES);
    }

    #[test]
    fn workspace_entity_declares_primary_key_column() {
        assert_eq!(NotesWorkspaceEntity::primary_key_column(), "id");
        assert_eq!(NotesWorkspaceEntity::table_name(), "notes_workspace");
    }
}
