use serde::{Deserialize, Serialize};

use crate::models::{DriveVersionSummary, PageInfo};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct DriveVersionPage {
    pub items: Vec<DriveVersionSummary>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
