use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct UpdatePageRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub favorite: Option<bool>,

    #[serde(rename = "archiveStatus")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub archive_status: Option<String>,

    #[serde(rename = "publishStatus")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub publish_status: Option<String>,

    #[serde(rename = "parentPageId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_page_id: Option<String>,

    #[serde(rename = "expectedVersion")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expected_version: Option<String>,
}
