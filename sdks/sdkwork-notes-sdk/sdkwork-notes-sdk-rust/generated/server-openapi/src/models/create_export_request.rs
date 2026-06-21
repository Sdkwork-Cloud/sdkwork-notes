use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct CreateExportRequest {
    #[serde(rename = "workspaceId")]
    pub workspace_id: String,

    #[serde(rename = "targetType")]
    pub target_type: String,

    #[serde(rename = "targetId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_id: Option<String>,

    #[serde(rename = "exportFormat")]
    pub export_format: String,
}
