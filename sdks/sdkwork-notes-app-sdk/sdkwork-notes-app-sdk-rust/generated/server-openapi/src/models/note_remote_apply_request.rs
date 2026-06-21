use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct NoteRemoteApplyRequest {
    #[serde(rename = "tenantId")]
    pub tenant_id: String,

    #[serde(rename = "organizationId")]
    pub organization_id: String,

    #[serde(rename = "operatorId")]
    pub operator_id: String,

    #[serde(rename = "idempotencyKey")]
    pub idempotency_key: String,

    #[serde(rename = "taskId")]
    pub task_id: String,

    #[serde(rename = "entityType")]
    pub entity_type: String,

    #[serde(rename = "entityId")]
    pub entity_id: String,

    pub operation: String,

    #[serde(rename = "localRevision")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub local_revision: Option<i64>,

    #[serde(rename = "baseRemoteCursor")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub base_remote_cursor: Option<String>,

    pub mutation: std::collections::HashMap<String, serde_json::Value>,
}
