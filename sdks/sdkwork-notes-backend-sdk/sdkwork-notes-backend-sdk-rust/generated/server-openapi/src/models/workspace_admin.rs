use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct WorkspaceAdmin {
    pub id: String,

    #[serde(rename = "tenantId")]
    pub tenant_id: String,

    #[serde(rename = "organizationId")]
    pub organization_id: String,

    pub name: String,

    #[serde(rename = "driveSpaceId")]
    pub drive_space_id: String,

    #[serde(rename = "aiIndexPolicyCode")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ai_index_policy_code: Option<String>,

    #[serde(rename = "pageCount")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_count: Option<String>,

    #[serde(rename = "projectionLagCount")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub projection_lag_count: Option<String>,

    #[serde(rename = "lifecycleStatus")]
    pub lifecycle_status: String,
}
