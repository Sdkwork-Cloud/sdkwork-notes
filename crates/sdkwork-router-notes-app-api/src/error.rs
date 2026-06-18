use axum::Json;
use http::StatusCode;
use sdkwork_notes_pages_service::error::NotesProductError;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProblemDetail {
    #[serde(rename = "type")]
    pub problem_type: String,
    pub title: String,
    pub status: u16,
    pub detail: String,
    pub code: String,
}

pub type ApiResult<T> = Result<T, (StatusCode, Json<ProblemDetail>)>;

pub fn problem(
    status: StatusCode,
    title: impl Into<String>,
    detail: impl Into<String>,
    code: impl Into<String>,
) -> (StatusCode, Json<ProblemDetail>) {
    (
        status,
        Json(ProblemDetail {
            problem_type: "about:blank".to_string(),
            title: title.into(),
            status: status.as_u16(),
            detail: detail.into(),
            code: code.into(),
        }),
    )
}

pub fn map_api_problem(problem: sdkwork_router_notes_http_auth::actor_context::ApiProblem) -> (StatusCode, Json<ProblemDetail>) {
    (
        problem.status,
        Json(ProblemDetail {
            problem_type: "about:blank".to_string(),
            title: problem.title,
            status: problem.status.as_u16(),
            detail: problem.detail,
            code: problem.code,
        }),
    )
}

pub fn map_product_error(error: NotesProductError) -> (StatusCode, Json<ProblemDetail>) {
    match error {
        NotesProductError::Validation(detail) => problem(
            StatusCode::BAD_REQUEST,
            "validation failed",
            detail,
            "notes.validation.failed",
        ),
        NotesProductError::Conflict(detail) => {
            problem(StatusCode::CONFLICT, "conflict", detail, "notes.conflict")
        }
        NotesProductError::NotFound(detail) => problem(
            StatusCode::NOT_FOUND,
            "not found",
            detail,
            "notes.not_found",
        ),
        NotesProductError::PermissionDenied(detail) => problem(
            StatusCode::FORBIDDEN,
            "permission denied",
            detail,
            "notes.permission_denied",
        ),
        NotesProductError::Internal(_) => problem(
            StatusCode::INTERNAL_SERVER_ERROR,
            "internal error",
            "An unexpected error occurred".to_string(),
            "notes.internal",
        ),
    }
}
