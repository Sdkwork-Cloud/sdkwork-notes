use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct PageContent {
    #[serde(rename = "pageId")]
    pub page_id: String,

    #[serde(rename = "driveNodeId")]
    pub drive_node_id: String,

    #[serde(rename = "driveVersionId")]
    pub drive_version_id: String,

    #[serde(rename = "driveVersionNo")]
    pub drive_version_no: String,

    #[serde(rename = "contentType")]
    pub content_type: String,

    pub content: std::collections::HashMap<String, serde_json::Value>,

    #[serde(rename = "contentSchemaVersion")]
    pub content_schema_version: String,
}
