use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AdminUpdateWorkspaceRequest {
    #[serde(rename = "aiIndexPolicyCode")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ai_index_policy_code: Option<String>,

    #[serde(rename = "lifecycleStatus")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub lifecycle_status: Option<String>,

    #[serde(rename = "expectedVersion")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expected_version: Option<String>,
}
