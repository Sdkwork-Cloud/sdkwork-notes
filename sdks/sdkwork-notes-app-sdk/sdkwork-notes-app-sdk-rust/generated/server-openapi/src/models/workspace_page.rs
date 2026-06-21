use serde::{Deserialize, Serialize};

use crate::models::{PageInfo, Workspace};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct WorkspacePage {
    pub items: Vec<Workspace>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
