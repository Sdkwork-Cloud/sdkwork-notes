use serde::{Deserialize, Serialize};

use crate::models::{AiJob, PageInfo};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AiJobPage {
    pub items: Vec<AiJob>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
