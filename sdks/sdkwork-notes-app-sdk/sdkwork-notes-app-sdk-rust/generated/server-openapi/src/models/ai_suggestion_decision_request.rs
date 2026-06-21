use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AiSuggestionDecisionRequest {
    #[serde(rename = "tenantId")]
    pub tenant_id: String,

    #[serde(rename = "organizationId")]
    pub organization_id: String,

    #[serde(rename = "operatorId")]
    pub operator_id: String,
}
