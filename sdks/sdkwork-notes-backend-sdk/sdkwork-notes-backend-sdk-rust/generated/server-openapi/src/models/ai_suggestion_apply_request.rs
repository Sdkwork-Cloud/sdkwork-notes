use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AiSuggestionApplyRequest {
    #[serde(rename = "expectedDriveVersionId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expected_drive_version_id: Option<String>,

    #[serde(rename = "createCheckpoint")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub create_checkpoint: Option<bool>,
}
