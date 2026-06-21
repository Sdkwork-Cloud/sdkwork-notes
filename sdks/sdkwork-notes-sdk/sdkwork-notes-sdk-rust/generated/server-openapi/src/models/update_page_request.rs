use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct UpdatePageRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub favorite: Option<bool>,

    #[serde(rename = "expectedVersion")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expected_version: Option<String>,
}
