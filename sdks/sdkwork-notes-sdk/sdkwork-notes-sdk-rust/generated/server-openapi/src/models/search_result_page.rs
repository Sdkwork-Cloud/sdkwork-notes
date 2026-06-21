use serde::{Deserialize, Serialize};

use crate::models::{PageInfo, SearchResult};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct SearchResultPage {
    pub items: Vec<SearchResult>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
