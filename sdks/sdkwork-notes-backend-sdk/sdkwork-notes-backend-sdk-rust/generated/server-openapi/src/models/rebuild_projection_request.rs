use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct RebuildProjectionRequest {
    #[serde(rename = "projectionType")]
    pub projection_type: String,

    #[serde(rename = "pageId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_id: Option<String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub force: Option<bool>,
}
