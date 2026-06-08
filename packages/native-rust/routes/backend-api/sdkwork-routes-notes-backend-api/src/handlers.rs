use crate::dto::{
    AiFeedbackListQuery, AiFeedbackPageResponse, AiJobListQuery, AiJobPageResponse, AiJobResponse,
    AiSuggestionApplyRequest, AiSuggestionDecisionRequest, AiSuggestionResponse,
    BackendContextQuery, CompleteAiJobRequest, PageContentResponse,
};
use crate::error::{map_product_error, ApiResult};
use crate::state::NotesBackendState;
use axum::extract::{Path, Query, State};
use axum::Json;
use sdkwork_notes_product::domain::{
    AcceptAiSuggestionCommand, ApplyAiSuggestionCommand, ClaimAiJobCommand, CompleteAiJobCommand,
    CompleteAiSuggestionInput, ListAiJobsQuery, ListAiSuggestionFeedbackQuery, NotesActorContext,
    RejectAiSuggestionCommand,
};
use sdkwork_notes_product::ports::{DrivePageContentPort, NotesRepository};

pub(crate) async fn list_ai_jobs<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    Query(query): Query<AiJobListQuery>,
) -> ApiResult<Json<AiJobPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let page = state
        .service
        .list_ai_jobs(ListAiJobsQuery {
            context: context_from_list_query(&query),
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
    Path(ai_job_id): Path<String>,
    Query(query): Query<BackendContextQuery>,
) -> ApiResult<Json<AiJobResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let job = state
        .service
        .get_ai_job(&context_from_query(query), &ai_job_id)
        .await
        .map_err(map_product_error)?;

    Ok(Json(job.into()))
}

pub(crate) async fn cancel_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    Path(ai_job_id): Path<String>,
    Query(query): Query<BackendContextQuery>,
) -> ApiResult<Json<AiJobResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let job = state
        .service
        .cancel_ai_job(&context_from_query(query), &ai_job_id)
        .await
        .map_err(map_product_error)?;

    Ok(Json(job.into()))
}

pub(crate) async fn claim_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    Path(ai_job_id): Path<String>,
    Query(query): Query<BackendContextQuery>,
) -> ApiResult<Json<AiJobResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let job = state
        .service
        .claim_ai_job(ClaimAiJobCommand {
            context: context_from_query(query),
            ai_job_id,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(job.into()))
}

pub(crate) async fn complete_ai_job<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    Path(ai_job_id): Path<String>,
    Query(query): Query<BackendContextQuery>,
    Json(payload): Json<CompleteAiJobRequest>,
) -> ApiResult<Json<AiJobResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let job = state
        .service
        .complete_ai_job(CompleteAiJobCommand {
            context: context_from_query(query),
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

pub(crate) async fn accept_ai_suggestion<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiSuggestionDecisionRequest>,
) -> ApiResult<Json<AiSuggestionResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let suggestion = state
        .service
        .accept_ai_suggestion(AcceptAiSuggestionCommand {
            context: NotesActorContext {
                tenant_id: payload.tenant_id,
                organization_id: payload.organization_id,
                operator_id: payload.operator_id,
            },
            ai_suggestion_id,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(suggestion.into()))
}

pub(crate) async fn reject_ai_suggestion<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiSuggestionDecisionRequest>,
) -> ApiResult<Json<AiSuggestionResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let suggestion = state
        .service
        .reject_ai_suggestion(RejectAiSuggestionCommand {
            context: NotesActorContext {
                tenant_id: payload.tenant_id,
                organization_id: payload.organization_id,
                operator_id: payload.operator_id,
            },
            ai_suggestion_id,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(suggestion.into()))
}

pub(crate) async fn apply_ai_suggestion<R, D>(
    State(state): State<NotesBackendState<R, D>>,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiSuggestionApplyRequest>,
) -> ApiResult<Json<PageContentResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let content = state
        .service
        .apply_ai_suggestion(ApplyAiSuggestionCommand {
            context: NotesActorContext {
                tenant_id: payload.tenant_id,
                organization_id: payload.organization_id,
                operator_id: payload.operator_id,
            },
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
    Path(ai_suggestion_id): Path<String>,
    Query(query): Query<AiFeedbackListQuery>,
) -> ApiResult<Json<AiFeedbackPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let page = state
        .service
        .list_ai_suggestion_feedback(ListAiSuggestionFeedbackQuery {
            context: context_from_feedback_query(&query),
            ai_suggestion_id,
            page: query.page.unwrap_or(1),
            page_size: query.page_size.unwrap_or(20),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(page.into()))
}

fn context_from_query(query: BackendContextQuery) -> NotesActorContext {
    NotesActorContext {
        tenant_id: query.tenant_id,
        organization_id: query.organization_id,
        operator_id: query
            .operator_id
            .unwrap_or_else(|| "operator-unset".to_string()),
    }
}

fn context_from_list_query(query: &AiJobListQuery) -> NotesActorContext {
    NotesActorContext {
        tenant_id: query.tenant_id.clone(),
        organization_id: query.organization_id.clone(),
        operator_id: query
            .operator_id
            .clone()
            .unwrap_or_else(|| "operator-unset".to_string()),
    }
}

fn context_from_feedback_query(query: &AiFeedbackListQuery) -> NotesActorContext {
    NotesActorContext {
        tenant_id: query.tenant_id.clone(),
        organization_id: query.organization_id.clone(),
        operator_id: query
            .operator_id
            .clone()
            .unwrap_or_else(|| "operator-unset".to_string()),
    }
}
