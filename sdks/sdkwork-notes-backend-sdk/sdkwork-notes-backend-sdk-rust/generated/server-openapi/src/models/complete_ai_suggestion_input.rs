use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct CompleteAiSuggestionInput {
    #[serde(rename = "pageId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_id: Option<String>,

    #[serde(rename = "suggestionType")]
    pub suggestion_type: String,

    pub payload: std::collections::HashMap<String, serde_json::Value>,
}
