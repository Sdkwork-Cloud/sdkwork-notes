use serde::{Deserialize, Serialize};

use crate::models::{AiSuggestion, PageInfo};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AiSuggestionPage {
    pub items: Vec<AiSuggestion>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
