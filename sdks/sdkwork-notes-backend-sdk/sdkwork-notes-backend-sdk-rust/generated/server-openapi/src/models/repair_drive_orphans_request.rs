use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct RepairDriveOrphansRequest {
    #[serde(rename = "workspaceId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub workspace_id: Option<String>,

    #[serde(rename = "pageIds")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_ids: Option<Vec<String>>,

    #[serde(rename = "dryRun")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dry_run: Option<bool>,
}
