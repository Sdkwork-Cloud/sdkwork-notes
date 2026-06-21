use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct Page {
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

    #[serde(rename = "driveSpaceId")]
    pub drive_space_id: String,

    #[serde(rename = "driveUri")]
    pub drive_uri: String,

    #[serde(rename = "currentDriveVersionId")]
    pub current_drive_version_id: String,

    #[serde(rename = "contentType")]
    pub content_type: String,

    #[serde(rename = "contentSchemaVersion")]
    pub content_schema_version: String,

    #[serde(rename = "lifecycleStatus")]
    pub lifecycle_status: String,
}
