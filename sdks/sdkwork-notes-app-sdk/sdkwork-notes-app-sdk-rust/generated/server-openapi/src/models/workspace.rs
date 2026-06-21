use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct Workspace {
    pub id: String,

    pub name: String,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    #[serde(rename = "driveSpaceId")]
    pub drive_space_id: String,

    #[serde(rename = "defaultPageContentType")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_page_content_type: Option<String>,

    #[serde(rename = "defaultPageSchemaVersion")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_page_schema_version: Option<String>,

    #[serde(rename = "aiIndexPolicyCode")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ai_index_policy_code: Option<String>,

    #[serde(rename = "lifecycleStatus")]
    pub lifecycle_status: String,

    #[serde(rename = "createdAt")]
    pub created_at: String,

    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}
