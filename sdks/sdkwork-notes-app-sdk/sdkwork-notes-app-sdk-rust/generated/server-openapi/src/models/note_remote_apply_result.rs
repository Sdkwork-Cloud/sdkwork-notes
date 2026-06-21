use serde::{Deserialize, Serialize};

use crate::models::{NoteRemoteApplyConflict};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct NoteRemoteApplyResult {
    pub outcome: String,

    #[serde(rename = "taskId")]
    pub task_id: String,

    #[serde(rename = "remoteCursor")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub remote_cursor: Option<String>,

    #[serde(rename = "appliedAt")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub applied_at: Option<String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub conflict: Option<NoteRemoteApplyConflict>,
}
