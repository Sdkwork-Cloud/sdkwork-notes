use sdkwork_notes_pages_service::domain::{
    AiFeedback, AiJob, AiSuggestion, AiSuggestionPage, DriveVersionPage, DriveVersionSummary,
    ObjectTypeSummary, Page, PageContent, PageInfo, PageSummary, PageSummaryPage, SearchResult,
    SearchResultPage, Workspace, WorkspaceBootstrap, WorkspacePage,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const DEFAULT_PAGE_CONTENT_TYPE: &str = "application/vnd.sdkwork.notes.page+json";
pub const DEFAULT_PAGE_SCHEMA_VERSION: &str = "1";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkspaceRequest {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
    pub owner_subject_type: Option<String>,
    pub owner_subject_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub drive_space_id: String,
    pub default_page_content_type: Option<String>,
    pub default_page_schema_version: Option<String>,
    pub ai_index_policy_code: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePageRequest {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
    pub title: String,
    pub page_kind: Option<String>,
    pub parent_page_id: Option<String>,
    pub folder_drive_node_id: Option<String>,
    pub initial_content: Option<Value>,
    pub content_type: Option<String>,
    pub content_schema_version: Option<String>,
    pub change_summary: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePageContentRequest {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
    pub content: Value,
    pub content_type: Option<String>,
    pub content_schema_version: Option<String>,
    pub change_summary: Option<String>,
    pub expected_drive_version_id: Option<String>,
    pub create_checkpoint: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestorePageVersionRequest {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
    pub expected_current_drive_version_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePageRequest {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
    pub title: Option<String>,
    pub favorite: Option<bool>,
    pub archive_status: Option<String>,
    pub publish_status: Option<String>,
    #[serde(default)]
    pub parent_page_id: Option<Option<String>>,
    pub expected_version: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteRemoteApplyMutationPatchRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub parent_id: Option<Option<String>>,
    pub is_favorite: Option<bool>,
    pub publish_status: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum NoteRemoteApplyMutationRequest {
    Patch {
        patch: NoteRemoteApplyMutationPatchRequest,
    },
    Intent {
        intent: String,
    },
    Move {
        target_parent_id: Option<String>,
    },
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteRemoteApplyRequest {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
    pub idempotency_key: String,
    pub task_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub operation: String,
    pub local_revision: Option<i64>,
    pub base_remote_cursor: Option<String>,
    pub mutation: NoteRemoteApplyMutationRequest,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteRemoteApplyConflictResponse {
    pub code: String,
    pub message: String,
    pub occurred_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteRemoteApplyResultResponse {
    pub outcome: String,
    pub task_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remote_cursor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub applied_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict: Option<NoteRemoteApplyConflictResponse>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAiJobRequest {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
    pub workspace_id: String,
    pub job_type: String,
    pub target_type: String,
    pub target_id: Option<String>,
    pub prompt: Option<String>,
    pub context_policy: Option<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSuggestionDecisionRequest {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSuggestionApplyRequest {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
    pub expected_drive_version_id: Option<String>,
    pub create_checkpoint: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiFeedbackCreateRequest {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: String,
    pub feedback_type: String,
    pub feedback_text: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotesContextQuery {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotesPageQuery {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: Option<String>,
    pub page: Option<i64>,
    #[serde(rename = "page_size")]
    pub page_size: Option<i64>,
    pub q: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotesSearchQuery {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: Option<String>,
    #[serde(rename = "workspace_id")]
    pub workspace_id: Option<String>,
    pub page: Option<i64>,
    #[serde(rename = "page_size")]
    pub page_size: Option<i64>,
    pub q: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub drive_space_id: String,
    pub default_page_content_type: String,
    pub default_page_schema_version: String,
    pub ai_index_policy_code: String,
    pub lifecycle_status: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Workspace> for WorkspaceResponse {
    fn from(workspace: Workspace) -> Self {
        Self {
            id: workspace.id,
            name: workspace.name,
            description: workspace.description,
            drive_space_id: workspace.drive_space_id,
            default_page_content_type: workspace.default_page_content_type,
            default_page_schema_version: workspace.default_page_schema_version,
            ai_index_policy_code: workspace.ai_index_policy_code,
            lifecycle_status: workspace.lifecycle_status,
            created_at: workspace.created_at,
            updated_at: workspace.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageInfoResponse {
    pub page: i64,
    pub page_size: i64,
    pub has_more: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
}

impl From<PageInfo> for PageInfoResponse {
    fn from(page_info: PageInfo) -> Self {
        Self {
            page: page_info.page,
            page_size: page_info.page_size,
            has_more: page_info.has_more,
            next_cursor: page_info.next_cursor,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspacePageResponse {
    pub items: Vec<WorkspaceResponse>,
    pub page_info: PageInfoResponse,
}

impl From<WorkspacePage> for WorkspacePageResponse {
    fn from(page: WorkspacePage) -> Self {
        Self {
            items: page
                .items
                .into_iter()
                .map(WorkspaceResponse::from)
                .collect(),
            page_info: page.page_info.into(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageResponse {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub snippet: Option<String>,
    pub page_kind: String,
    pub drive_node_id: String,
    pub current_drive_version_no: String,
    pub favorite: bool,
    pub updated_at: String,
    pub parent_page_id: Option<String>,
    pub folder_drive_node_id: Option<String>,
    pub drive_space_id: String,
    pub drive_uri: String,
    pub current_drive_version_id: String,
    pub content_type: String,
    pub content_schema_version: String,
    pub content_hash: Option<String>,
    pub archive_status: String,
    pub publish_status: String,
    pub lifecycle_status: String,
    pub created_at: String,
}

impl From<Page> for PageResponse {
    fn from(page: Page) -> Self {
        Self {
            id: page.id,
            workspace_id: page.workspace_id,
            title: page.title,
            snippet: page.snippet,
            page_kind: page.page_kind.as_str().to_string(),
            drive_node_id: page.drive_node_id,
            current_drive_version_no: page.current_drive_version_no.to_string(),
            favorite: page.favorite,
            updated_at: page.updated_at,
            parent_page_id: page.parent_page_id,
            folder_drive_node_id: page.folder_drive_node_id,
            drive_space_id: page.drive_space_id,
            drive_uri: page.drive_uri,
            current_drive_version_id: page.current_drive_version_id,
            content_type: page.content_type,
            content_schema_version: page.content_schema_version,
            content_hash: page.content_hash,
            archive_status: page.archive_status,
            publish_status: page.publish_status,
            lifecycle_status: page.lifecycle_status,
            created_at: page.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageSummaryResponse {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub snippet: Option<String>,
    pub page_kind: String,
    pub drive_node_id: String,
    pub current_drive_version_no: String,
    pub favorite: bool,
    pub updated_at: String,
}

impl From<PageSummary> for PageSummaryResponse {
    fn from(page: PageSummary) -> Self {
        Self {
            id: page.id,
            workspace_id: page.workspace_id,
            title: page.title,
            snippet: page.snippet,
            page_kind: page.page_kind.as_str().to_string(),
            drive_node_id: page.drive_node_id,
            current_drive_version_no: page.current_drive_version_no,
            favorite: page.favorite,
            updated_at: page.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageSummaryPageResponse {
    pub items: Vec<PageSummaryResponse>,
    pub page_info: PageInfoResponse,
}

impl From<PageSummaryPage> for PageSummaryPageResponse {
    fn from(page: PageSummaryPage) -> Self {
        Self {
            items: page
                .items
                .into_iter()
                .map(PageSummaryResponse::from)
                .collect(),
            page_info: page.page_info.into(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ObjectTypeSummaryResponse {
    pub id: String,
    pub code: String,
    pub name: String,
}

impl From<ObjectTypeSummary> for ObjectTypeSummaryResponse {
    fn from(object_type: ObjectTypeSummary) -> Self {
        Self {
            id: object_type.id,
            code: object_type.code,
            name: object_type.name,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceBootstrapResponse {
    pub workspace: WorkspaceResponse,
    pub root_pages: Vec<PageSummaryResponse>,
    pub object_types: Vec<ObjectTypeSummaryResponse>,
    pub change_token: Option<String>,
}

impl From<WorkspaceBootstrap> for WorkspaceBootstrapResponse {
    fn from(bootstrap: WorkspaceBootstrap) -> Self {
        Self {
            workspace: bootstrap.workspace.into(),
            root_pages: bootstrap
                .root_pages
                .into_iter()
                .map(PageSummaryResponse::from)
                .collect(),
            object_types: bootstrap
                .object_types
                .into_iter()
                .map(ObjectTypeSummaryResponse::from)
                .collect(),
            change_token: bootstrap.change_token,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageContentResponse {
    pub page_id: String,
    pub drive_node_id: String,
    pub drive_version_id: String,
    pub drive_version_no: String,
    pub content_type: String,
    pub content_schema_version: String,
    pub content: Value,
}

impl From<PageContent> for PageContentResponse {
    fn from(content: PageContent) -> Self {
        Self {
            page_id: content.page_id,
            drive_node_id: content.drive_node_id,
            drive_version_id: content.drive_version_id,
            drive_version_no: content.drive_version_no.to_string(),
            content_type: content.content_type,
            content_schema_version: content.content_schema_version,
            content: content.content,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveVersionSummaryResponse {
    pub drive_version_id: String,
    pub drive_version_no: String,
    pub version_kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub change_summary: Option<String>,
    pub created_at: String,
}

impl From<DriveVersionSummary> for DriveVersionSummaryResponse {
    fn from(version: DriveVersionSummary) -> Self {
        Self {
            drive_version_id: version.drive_version_id,
            drive_version_no: version.drive_version_no.to_string(),
            version_kind: version.version_kind,
            version_label: version.version_label,
            change_summary: version.change_summary,
            created_at: version.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveVersionPageResponse {
    pub items: Vec<DriveVersionSummaryResponse>,
    pub page_info: PageInfoResponse,
}

impl From<DriveVersionPage> for DriveVersionPageResponse {
    fn from(page: DriveVersionPage) -> Self {
        Self {
            items: page
                .items
                .into_iter()
                .map(DriveVersionSummaryResponse::from)
                .collect(),
            page_info: page.page_info.into(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSuggestionResponse {
    pub id: String,
    pub workspace_id: String,
    pub page_id: String,
    pub ai_job_id: String,
    pub suggestion_type: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_drive_node_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_drive_version_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_drive_version_no: Option<String>,
    pub payload: Value,
    pub created_at: String,
}

impl From<AiSuggestion> for AiSuggestionResponse {
    fn from(suggestion: AiSuggestion) -> Self {
        Self {
            id: suggestion.id,
            workspace_id: suggestion.workspace_id,
            page_id: suggestion.page_id,
            ai_job_id: suggestion.ai_job_id,
            suggestion_type: suggestion.suggestion_type,
            status: suggestion.status,
            source_drive_node_id: suggestion.source_drive_node_id,
            source_drive_version_id: suggestion.source_drive_version_id,
            source_drive_version_no: suggestion
                .source_drive_version_no
                .map(|version_no| version_no.to_string()),
            payload: suggestion.payload,
            created_at: suggestion.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSuggestionPageResponse {
    pub items: Vec<AiSuggestionResponse>,
    pub page_info: PageInfoResponse,
}

impl From<AiSuggestionPage> for AiSuggestionPageResponse {
    fn from(page: AiSuggestionPage) -> Self {
        Self {
            items: page
                .items
                .into_iter()
                .map(AiSuggestionResponse::from)
                .collect(),
            page_info: page.page_info.into(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiFeedbackResponse {
    pub id: String,
    pub workspace_id: String,
    pub job_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion_id: Option<String>,
    pub feedback_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feedback_text: Option<String>,
    pub created_by: String,
    pub created_at: String,
}

impl From<AiFeedback> for AiFeedbackResponse {
    fn from(feedback: AiFeedback) -> Self {
        Self {
            id: feedback.id,
            workspace_id: feedback.workspace_id,
            job_id: feedback.job_id,
            suggestion_id: feedback.suggestion_id,
            feedback_type: feedback.feedback_type,
            feedback_text: feedback.feedback_text,
            created_by: feedback.created_by,
            created_at: feedback.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResultResponse {
    pub page: PageSummaryResponse,
    pub highlights: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_drive_version_id: Option<String>,
    pub source_drive_version_no: String,
}

impl From<SearchResult> for SearchResultResponse {
    fn from(result: SearchResult) -> Self {
        Self {
            page: result.page.into(),
            highlights: result.highlights,
            source_drive_version_id: result.source_drive_version_id,
            source_drive_version_no: result.source_drive_version_no,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResultPageResponse {
    pub items: Vec<SearchResultResponse>,
    pub page_info: PageInfoResponse,
}

impl From<SearchResultPage> for SearchResultPageResponse {
    fn from(page: SearchResultPage) -> Self {
        Self {
            items: page
                .items
                .into_iter()
                .map(SearchResultResponse::from)
                .collect(),
            page_info: page.page_info.into(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiJobResponse {
    pub id: String,
    pub workspace_id: String,
    pub job_type: String,
    pub target_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_id: Option<String>,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    pub created_at: String,
}

impl From<AiJob> for AiJobResponse {
    fn from(job: AiJob) -> Self {
        Self {
            id: job.id,
            workspace_id: job.workspace_id,
            job_type: job.job_type,
            target_type: job.target_type,
            target_id: job.target_id,
            status: job.status,
            result: job.result,
            created_at: job.created_at,
        }
    }
}
