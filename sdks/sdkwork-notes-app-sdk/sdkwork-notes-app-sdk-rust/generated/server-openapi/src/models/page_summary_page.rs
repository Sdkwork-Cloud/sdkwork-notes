use serde::{Deserialize, Serialize};

use crate::models::{PageInfo, PageSummary};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct PageSummaryPage {
    pub items: Vec<PageSummary>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
