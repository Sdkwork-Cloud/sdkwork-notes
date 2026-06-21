use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ExportJob {
    pub id: String,

    #[serde(rename = "workspaceId")]
    pub workspace_id: String,

    #[serde(rename = "targetType")]
    pub target_type: String,

    #[serde(rename = "targetId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_id: Option<String>,

    #[serde(rename = "exportFormat")]
    pub export_format: String,

    #[serde(rename = "outputDriveNodeId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub output_drive_node_id: Option<String>,

    #[serde(rename = "outputDriveUri")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub output_drive_uri: Option<String>,

    pub status: String,
}
