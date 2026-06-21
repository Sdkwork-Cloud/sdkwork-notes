use serde::{Deserialize, Serialize};

use crate::models::{CompleteAiSuggestionInput};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct CompleteAiJobRequest {
    pub suggestions: Vec<CompleteAiSuggestionInput>,
}
