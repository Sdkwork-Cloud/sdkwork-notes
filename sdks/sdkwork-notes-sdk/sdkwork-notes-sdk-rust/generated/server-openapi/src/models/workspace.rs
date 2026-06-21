use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct Workspace {
    pub id: String,

    pub name: String,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    #[serde(rename = "driveSpaceId")]
    pub drive_space_id: String,

    #[serde(rename = "lifecycleStatus")]
    pub lifecycle_status: String,
}
