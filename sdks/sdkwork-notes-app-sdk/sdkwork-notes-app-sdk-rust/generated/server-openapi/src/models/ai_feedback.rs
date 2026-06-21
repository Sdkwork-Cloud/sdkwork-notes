use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AiFeedback {
    pub id: String,

    #[serde(rename = "workspaceId")]
    pub workspace_id: String,

    #[serde(rename = "jobId")]
    pub job_id: String,

    #[serde(rename = "suggestionId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub suggestion_id: Option<String>,

    #[serde(rename = "feedbackType")]
    pub feedback_type: String,

    #[serde(rename = "feedbackText")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub feedback_text: Option<String>,

    #[serde(rename = "createdBy")]
    pub created_by: String,

    #[serde(rename = "createdAt")]
    pub created_at: String,
}
