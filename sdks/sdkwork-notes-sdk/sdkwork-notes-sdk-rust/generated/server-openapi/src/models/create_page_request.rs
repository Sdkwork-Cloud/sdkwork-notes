use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct CreatePageRequest {
    #[serde(rename = "workspaceId")]
    pub workspace_id: String,

    pub title: String,

    #[serde(rename = "parentPageId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_page_id: Option<String>,

    #[serde(rename = "initialContent")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub initial_content: Option<std::collections::HashMap<String, serde_json::Value>>,

    #[serde(rename = "contentType")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,

    #[serde(rename = "contentSchemaVersion")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content_schema_version: Option<String>,
}
