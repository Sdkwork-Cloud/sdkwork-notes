use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct UpdatePageContentRequest {
    #[serde(rename = "tenantId")]
    pub tenant_id: String,

    #[serde(rename = "organizationId")]
    pub organization_id: String,

    #[serde(rename = "operatorId")]
    pub operator_id: String,

    pub content: std::collections::HashMap<String, serde_json::Value>,

    #[serde(rename = "contentType")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,

    #[serde(rename = "contentSchemaVersion")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content_schema_version: Option<String>,

    #[serde(rename = "changeSummary")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub change_summary: Option<String>,

    #[serde(rename = "expectedDriveVersionId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expected_drive_version_id: Option<String>,

    #[serde(rename = "createCheckpoint")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub create_checkpoint: Option<bool>,
}
