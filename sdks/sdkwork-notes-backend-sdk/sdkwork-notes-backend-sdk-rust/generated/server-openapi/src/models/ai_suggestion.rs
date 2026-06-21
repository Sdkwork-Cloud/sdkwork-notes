use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AiSuggestion {
    pub id: String,

    #[serde(rename = "workspaceId")]
    pub workspace_id: String,

    #[serde(rename = "pageId")]
    pub page_id: String,

    #[serde(rename = "aiJobId")]
    pub ai_job_id: String,

    #[serde(rename = "suggestionType")]
    pub suggestion_type: String,

    pub status: String,

    #[serde(rename = "sourceDriveNodeId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_drive_node_id: Option<String>,

    #[serde(rename = "sourceDriveVersionId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_drive_version_id: Option<String>,

    #[serde(rename = "sourceDriveVersionNo")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_drive_version_no: Option<String>,

    pub payload: std::collections::HashMap<String, serde_json::Value>,

    #[serde(rename = "createdAt")]
    pub created_at: String,
}
