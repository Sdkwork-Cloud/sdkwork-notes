use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ObjectTypeSummary {
    pub id: String,

    pub code: String,

    pub name: String,
}
