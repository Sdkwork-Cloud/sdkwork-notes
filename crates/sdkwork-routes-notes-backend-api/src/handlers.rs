use crate::context::authenticated_actor;
use crate::dto::{
    AiFeedbackListQuery, AiFeedbackResponse, AiJobListQuery, AiJobResponse,
    AiSuggestionApplyRequest, AiSuggestionResponse, CompleteAiJobRequest, FailAiJobRequest,
    PageContentResponse,
};
use crate::envelope::{page_data, resource_data};
use crate::error::{map_product_error, ApiResult};
use crate::state::NotesBackendState;
use axum::extract::{Path, Query, State};
use axum::response::Response;
use sdkwork_notes_pages_service::domain::{
    AcceptAiSuggestionCommand, ApplyAiSuggestionCommand, ClaimAiJobCommand, CompleteAiJobCommand,
    CompleteAiSuggestionInput, FailAiJobCommand, ListAiJobsQuery, ListAiSuggestionFeedbackQuery,
    RejectAiSuggestionCommand,
};
use sdkwork_notes_pages_service::ports::{DrivePageContentPort, NotesRepository};
use sdkwork_routes_notes_http_auth::finish_api_json;
use sdkwork_utils_rust::SdkWorkResourceData;
use sdkwork_web_core::WebRequestContext;

pub(crate) async fn list_ai_jobs<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Query(query): Query<AiJobListQuery>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<_> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_jobs.read")?;
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
        Ok(page_data(
            page.items.into_iter().map(AiJobResponse::from).collect(),
            page.page_info,
        ))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn get_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiJobResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_jobs.read")?;
        let job = state
            .service
            .get_ai_job(&context, &ai_job_id)
            .await
            .map_err(map_product_error)?;
        Ok(resource_data(job.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn cancel_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiJobResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_jobs.write")?;
        let job = state
            .service
            .cancel_ai_job(&context, &ai_job_id)
            .await
            .map_err(map_product_error)?;
        Ok(resource_data(job.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn claim_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiJobResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_jobs.write")?;
        let job = state
            .service
            .claim_ai_job(ClaimAiJobCommand {
                context,
                ai_job_id,
            })
            .await
            .map_err(map_product_error)?;
        Ok(resource_data(job.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn complete_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
    axum::Json(payload): axum::Json<CompleteAiJobRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiJobResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_jobs.write")?;
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
        Ok(resource_data(job.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn fail_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_job_id): Path<String>,
    axum::Json(payload): axum::Json<FailAiJobRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiJobResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_jobs.write")?;
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
        Ok(resource_data(job.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn accept_ai_suggestion<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiSuggestionResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_suggestions.write")?;
        let suggestion = state
            .service
            .accept_ai_suggestion(AcceptAiSuggestionCommand {
                context,
                ai_suggestion_id,
            })
            .await
            .map_err(map_product_error)?;
        Ok(resource_data(suggestion.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn reject_ai_suggestion<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiSuggestionResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_suggestions.write")?;
        let suggestion = state
            .service
            .reject_ai_suggestion(RejectAiSuggestionCommand {
                context,
                ai_suggestion_id,
            })
            .await
            .map_err(map_product_error)?;
        Ok(resource_data(suggestion.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn apply_ai_suggestion<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    axum::Json(payload): axum::Json<AiSuggestionApplyRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<PageContentResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_suggestions.write")?;
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
        Ok(resource_data(content.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn list_ai_suggestion_feedback<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    Query(query): Query<AiFeedbackListQuery>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<_> = async {
        let context = authenticated_actor(&app_ctx, "notes.backend.ai_suggestions.feedback.read")?;
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
        Ok(page_data(
            page.items.into_iter().map(AiFeedbackResponse::from).collect(),
            page.page_info,
        ))
    }
    .await;
    finish_api_json(&app_ctx, result)
}
