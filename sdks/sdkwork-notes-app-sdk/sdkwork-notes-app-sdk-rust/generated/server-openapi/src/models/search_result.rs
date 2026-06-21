use serde::{Deserialize, Serialize};

use crate::models::{PageSummary};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct SearchResult {
    pub page: PageSummary,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub highlights: Option<Vec<String>>,

    #[serde(rename = "sourceDriveVersionId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_drive_version_id: Option<String>,

    #[serde(rename = "sourceDriveVersionNo")]
    pub source_drive_version_no: String,
}
