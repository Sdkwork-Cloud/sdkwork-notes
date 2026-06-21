use serde::{Deserialize, Serialize};

use crate::models::{DriveOrphanDiagnostic, PageInfo};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct DriveOrphanDiagnosticPage {
    pub items: Vec<DriveOrphanDiagnostic>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
