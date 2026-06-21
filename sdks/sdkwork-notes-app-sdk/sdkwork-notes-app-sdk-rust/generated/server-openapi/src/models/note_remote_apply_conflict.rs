use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct NoteRemoteApplyConflict {
    pub code: String,

    pub message: String,

    #[serde(rename = "occurredAt")]
    pub occurred_at: String,
}
