use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct DriveVersionSummary {
    #[serde(rename = "driveVersionId")]
    pub drive_version_id: String,

    #[serde(rename = "driveVersionNo")]
    pub drive_version_no: String,

    #[serde(rename = "versionKind")]
    pub version_kind: String,

    #[serde(rename = "versionLabel")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version_label: Option<String>,

    #[serde(rename = "changeSummary")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub change_summary: Option<String>,

    #[serde(rename = "createdAt")]
    pub created_at: String,
}
