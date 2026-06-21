use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct DriveOrphanDiagnostic {
    #[serde(rename = "pageId")]
    pub page_id: String,

    #[serde(rename = "workspaceId")]
    pub workspace_id: String,

    #[serde(rename = "driveNodeId")]
    pub drive_node_id: String,

    #[serde(rename = "diagnosticCode")]
    pub diagnostic_code: String,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}
