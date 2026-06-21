use serde::{Deserialize, Serialize};

use crate::models::{AiFeedback, PageInfo};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AiFeedbackPage {
    pub items: Vec<AiFeedback>,

    #[serde(rename = "pageInfo")]
    pub page_info: PageInfo,
}
