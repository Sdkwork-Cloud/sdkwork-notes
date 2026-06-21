use serde::{Deserialize, Serialize};

use crate::models::{IndexJob, PageInfo};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct IndexJobPage {
    pub items: Vec<IndexJob>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
