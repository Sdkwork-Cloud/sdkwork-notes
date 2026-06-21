use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AiJob {
    pub id: String,

    #[serde(rename = "workspaceId")]
    pub workspace_id: String,

    #[serde(rename = "jobType")]
    pub job_type: String,

    #[serde(rename = "targetType")]
    pub target_type: String,

    #[serde(rename = "targetId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_id: Option<String>,

    pub status: String,

    #[serde(rename = "sourceCount")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_count: Option<String>,

    #[serde(rename = "suggestionCount")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub suggestion_count: Option<String>,

    #[serde(rename = "createdAt")]
    pub created_at: String,
}
