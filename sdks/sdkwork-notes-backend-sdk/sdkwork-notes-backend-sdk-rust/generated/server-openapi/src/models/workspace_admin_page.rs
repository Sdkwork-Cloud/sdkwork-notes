use serde::{Deserialize, Serialize};

use crate::models::{PageInfo, WorkspaceAdmin};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct WorkspaceAdminPage {
    pub items: Vec<WorkspaceAdmin>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
