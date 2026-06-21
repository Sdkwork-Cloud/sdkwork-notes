use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct PageSummary {
    pub id: String,

    #[serde(rename = "workspaceId")]
    pub workspace_id: String,

    pub title: String,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub snippet: Option<String>,

    #[serde(rename = "driveNodeId")]
    pub drive_node_id: String,

    #[serde(rename = "currentDriveVersionNo")]
    pub current_drive_version_no: String,
}
