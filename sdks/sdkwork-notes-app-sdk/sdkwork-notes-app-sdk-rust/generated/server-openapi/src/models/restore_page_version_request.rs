use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct RestorePageVersionRequest {
    #[serde(rename = "tenantId")]
    pub tenant_id: String,

    #[serde(rename = "organizationId")]
    pub organization_id: String,

    #[serde(rename = "operatorId")]
    pub operator_id: String,

    #[serde(rename = "expectedCurrentDriveVersionId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expected_current_drive_version_id: Option<String>,
}
