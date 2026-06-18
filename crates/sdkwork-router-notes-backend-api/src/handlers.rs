use crate::context::{
    authenticated_apply_body, authenticated_backend_query, authenticated_fail_body,
    authenticated_feedback_list_query, authenticated_list_query, authenticated_suggestion_body,
};
use crate::dto::{
    AiFeedbackListQuery, AiFeedbackPageResponse, AiJobListQuery, AiJobPageResponse, AiJobResponse,
    AiSuggestionApplyRequest, AiSuggestionDecisionRequest, AiSuggestionResponse,
    BackendContextQuery, CompleteAiJobRequest, FailAiJobRequest, PageContentResponse,
};
use crate::error::{map_product_error, ApiResult};
use crate::state::NotesBackendState;
use axum::extract::{Path, Query, State};
use axum::Json;
use sdkwork_notes_product::domain::{
    AcceptAiSuggestionCommand, ApplyAiSuggestionCommand, ClaimAiJobCommand, CompleteAiJobCommand,
    CompleteAiSuggestionInput, FailAiJobCommand, ListAiJobsQuery, ListAiSuggestionFeedbackQuery,
    RejectAiSuggestionCommand,
};
use sdkwork_notes_product::ports::{DrivePageContentPort, NotesRepository};
use sdkwork_web_core::WebRequestContext;
pub(crate) async fn list_ai_jobs<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Query(query): Query<AiJobListQuery>,
) -> ApiResult<Json<AiJobPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_list_query(&app_ctx, "notes.backend.ai_jobs.read", &query)?;
    let page = state
        .service
        .list_ai_jobs(ListAiJobsQuery {
            context,
            workspace_id: query.workspace_id,
            page: query.page.unwrap_or(1),
            page_size: query.page_size.unwrap_or(20),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(page.into()))
}

pub(crate) async fn get_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
    Query(query): Query<BackendContextQuery>,
) -> ApiResult<Json<AiJobResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_backend_query(&app_ctx, "notes.backend.ai_jobs.read", query)?;
    let job = state
        .service
        .get_ai_job(&context, &ai_job_id)
        .await
        .map_err(map_product_error)?;

    Ok(Json(job.into()))
}

pub(crate) async fn cancel_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
    Query(query): Query<BackendContextQuery>,
) -> ApiResult<Json<AiJobResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_backend_query(&app_ctx, "notes.backend.ai_jobs.write", query)?;
    let job = state
        .service
        .cancel_ai_job(&context, &ai_job_id)
        .await
        .map_err(map_product_error)?;

    Ok(Json(job.into()))
}

pub(crate) async fn claim_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
    Query(query): Query<BackendContextQuery>,
) -> ApiResult<Json<AiJobResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_backend_query(&app_ctx, "notes.backend.ai_jobs.write", query)?;
    let job = state
        .service
        .claim_ai_job(ClaimAiJobCommand {
            context,
            ai_job_id,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(job.into()))
}

pub(crate) async fn complete_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
    Query(query): Query<BackendContextQuery>,
    Json(payload): Json<CompleteAiJobRequest>,
) -> ApiResult<Json<AiJobResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_backend_query(&app_ctx, "notes.backend.ai_jobs.write", query)?;
    let job = state
        .service
        .complete_ai_job(CompleteAiJobCommand {
            context,
            ai_job_id,
            suggestions: payload
                .suggestions
                .into_iter()
                .map(|suggestion| CompleteAiSuggestionInput {
                    page_id: suggestion.page_id,
                    suggestion_type: suggestion.suggestion_type,
                    payload: suggestion.payload,
                })
                .collect(),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(job.into()))
}

pub(crate) async fn fail_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
    Json(payload): Json<FailAiJobRequest>,
) -> ApiResult<Json<AiJobResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_fail_body(&app_ctx, "notes.backend.ai_jobs.write", &payload)?;
    let job = state
        .service
        .fail_ai_job(FailAiJobCommand {
            context,
            ai_job_id,
            error_code: payload.error_code,
            error_message: payload.error_message,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(job.into()))
}

pub(crate) async fn accept_ai_suggestion<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiSuggestionDecisionRequest>,
) -> ApiResult<Json<AiSuggestionResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context =
        authenticated_suggestion_body(&app_ctx, "notes.backend.ai_suggestions.write", &payload)?;
    let suggestion = state
        .service
        .accept_ai_suggestion(AcceptAiSuggestionCommand {
            context,
            ai_suggestion_id,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(suggestion.into()))
}

pub(crate) async fn reject_ai_suggestion<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiSuggestionDecisionRequest>,
) -> ApiResult<Json<AiSuggestionResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context =
        authenticated_suggestion_body(&app_ctx, "notes.backend.ai_suggestions.write", &payload)?;
    let suggestion = state
        .service
        .reject_ai_suggestion(RejectAiSuggestionCommand {
            context,
            ai_suggestion_id,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(suggestion.into()))
}

pub(crate) async fn apply_ai_suggestion<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiSuggestionApplyRequest>,
) -> ApiResult<Json<PageContentResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context =
        authenticated_apply_body(&app_ctx, "notes.backend.ai_suggestions.write", &payload)?;
    let content = state
        .service
        .apply_ai_suggestion(ApplyAiSuggestionCommand {
            context,
            ai_suggestion_id,
            expected_drive_version_id: payload.expected_drive_version_id,
            create_checkpoint: payload.create_checkpoint.unwrap_or(true),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(content.into()))
}

pub(crate) async fn list_ai_suggestion_feedback<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    Query(query): Query<AiFeedbackListQuery>,
) -> ApiResult<Json<AiFeedbackPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_feedback_list_query(
        &app_ctx,
        "notes.backend.ai_suggestions.feedback.read",
        &query,
    )?;
    let page = state
        .service
        .list_ai_suggestion_feedback(ListAiSuggestionFeedbackQuery {
            context,
            ai_suggestion_id,
            page: query.page.unwrap_or(1),
            page_size: query.page_size.unwrap_or(20),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(page.into()))
}
