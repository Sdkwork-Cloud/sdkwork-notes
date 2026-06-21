use serde::{Deserialize, Serialize};

use crate::models::{ObjectTypeSummary, PageSummary, Workspace};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct WorkspaceBootstrap {
    pub workspace: Workspace,

    #[serde(rename = "rootPages")]
    pub root_pages: Vec<PageSummary>,

    #[serde(rename = "objectTypes")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub object_types: Option<Vec<ObjectTypeSummary>>,

    #[serde(rename = "changeToken")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub change_token: Option<String>,
}
