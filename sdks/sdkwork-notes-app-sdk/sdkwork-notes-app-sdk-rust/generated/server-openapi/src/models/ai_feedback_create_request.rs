use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AiFeedbackCreateRequest {
    #[serde(rename = "tenantId")]
    pub tenant_id: String,

    #[serde(rename = "organizationId")]
    pub organization_id: String,

    #[serde(rename = "operatorId")]
    pub operator_id: String,

    #[serde(rename = "feedbackType")]
    pub feedback_type: String,

    #[serde(rename = "feedbackText")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub feedback_text: Option<String>,
}
