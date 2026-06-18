pub const BACKEND_API_PREFIX: &str = "/backend/v3/api";
pub const NOTES_PREFIX: &str = "/backend/v3/api/notes";

pub const AI_JOBS: &str = "/backend/v3/api/notes/ai_jobs";
pub const AI_JOB: &str = "/backend/v3/api/notes/ai_jobs/{ai_job_id}";
pub const AI_JOB_CANCEL: &str = "/backend/v3/api/notes/ai_jobs/{ai_job_id}/cancel";
pub const AI_JOB_CLAIM: &str = "/backend/v3/api/notes/ai_jobs/{ai_job_id}/claim";
pub const AI_JOB_COMPLETE: &str = "/backend/v3/api/notes/ai_jobs/{ai_job_id}/complete";
pub const AI_JOB_FAIL: &str = "/backend/v3/api/notes/ai_jobs/{ai_job_id}/fail";
pub const AI_SUGGESTION_ACCEPT: &str =
    "/backend/v3/api/notes/ai_suggestions/{ai_suggestion_id}/accept";
pub const AI_SUGGESTION_REJECT: &str =
    "/backend/v3/api/notes/ai_suggestions/{ai_suggestion_id}/reject";
pub const AI_SUGGESTION_APPLY: &str =
    "/backend/v3/api/notes/ai_suggestions/{ai_suggestion_id}/apply";
pub const AI_SUGGESTION_FEEDBACK: &str =
    "/backend/v3/api/notes/ai_suggestions/{ai_suggestion_id}/feedback";
