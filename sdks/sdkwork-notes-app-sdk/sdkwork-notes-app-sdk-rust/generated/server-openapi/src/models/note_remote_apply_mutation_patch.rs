use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct NoteRemoteApplyMutationPatch {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,

    #[serde(rename = "parentId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,

    #[serde(rename = "isFavorite")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub is_favorite: Option<bool>,

    #[serde(rename = "publishStatus")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub publish_status: Option<String>,
}
