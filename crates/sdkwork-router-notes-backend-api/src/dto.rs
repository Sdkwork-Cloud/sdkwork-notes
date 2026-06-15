use sdkwork_notes_product::domain::{
    AiFeedback, AiFeedbackPage, AiJob, AiJobPage, AiSuggestion, PageContent, PageInfo,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendContextQuery {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiJobListQuery {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: Option<String>,
    #[serde(rename = "workspace_id")]
    pub workspace_id: Option<String>,
    pub page: Option<i64>,
    #[serde(rename = "page_size")]
    pub page_size: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiFeedbackListQuery {
    pub tenant_id: String,
    pub organization_id: String,
    pub operator_id: Option<String>,
    pub page: Option<i64>,
    #[serde(rename = "page_size")]
    pub page_size: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteAiJobRequest {
    pub suggestions: Vec<CompleteAiSuggestionRequest>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteAiSuggestionRequest {
    pub page_id: Option<String>,
    pub suggestion_type: String,
    pub payload: Value,
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
pub struct AiJobResponse {
    pub id: String,
    pub workspace_id: String,
    pub job_type: String,
    pub target_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_id: Option<String>,
    pub status: String,
    pub source_count: String,
    pub suggestion_count: String,
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
            source_count: job.source_count.to_string(),
            suggestion_count: job.suggestion_count.to_string(),
            created_at: job.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiJobPageResponse {
    pub items: Vec<AiJobResponse>,
    pub page_info: PageInfoResponse,
}

impl From<AiJobPage> for AiJobPageResponse {
    fn from(page: AiJobPage) -> Self {
        Self {
            items: page.items.into_iter().map(AiJobResponse::from).collect(),
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
pub struct AiFeedbackPageResponse {
    pub items: Vec<AiFeedbackResponse>,
    pub page_info: PageInfoResponse,
}

impl From<AiFeedbackPage> for AiFeedbackPageResponse {
    fn from(page: AiFeedbackPage) -> Self {
        Self {
            items: page
                .items
                .into_iter()
                .map(AiFeedbackResponse::from)
                .collect(),
            page_info: page.page_info.into(),
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
