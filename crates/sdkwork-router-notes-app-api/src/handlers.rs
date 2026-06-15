use crate::dto::{
    AiFeedbackCreateRequest, AiFeedbackResponse, AiJobResponse, AiSuggestionApplyRequest,
    AiSuggestionDecisionRequest, AiSuggestionPageResponse, AiSuggestionResponse,
    CreateAiJobRequest, CreatePageRequest, CreateWorkspaceRequest, DriveVersionPageResponse,
    NotesContextQuery, NotesPageQuery, NotesSearchQuery, PageContentResponse, PageResponse,
    PageSummaryPageResponse, RestorePageVersionRequest, SearchResultPageResponse,
    UpdatePageContentRequest, UpdatePageRequest, WorkspaceBootstrapResponse, WorkspacePageResponse,
    WorkspaceResponse, DEFAULT_PAGE_CONTENT_TYPE, DEFAULT_PAGE_SCHEMA_VERSION,
};
use crate::error::{map_product_error, problem, ApiResult, ProblemDetail};
use crate::state::NotesAppState;
use axum::extract::{Path, Query, State};
use axum::Json;
use http::{HeaderMap, StatusCode};
use sdkwork_notes_product::domain::{
    AcceptAiSuggestionCommand, ApplyAiSuggestionCommand, CreateAiFeedbackCommand,
    CreateAiJobCommand, CreatePageCommand, CreateWorkspaceCommand, ListPageAiSuggestionsQuery,
    ListPageVersionsQuery, ListPagesQuery, ListWorkspacesQuery, NotesActorContext, PageKind,
    RejectAiSuggestionCommand, RestorePageVersionCommand, SearchQuery, UpdatePageContentCommand,
    UpdatePageMetadataCommand,
};
use sdkwork_notes_product::ports::{DrivePageContentPort, NotesRepository};
use serde_json::json;

pub(crate) async fn list_workspaces<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<WorkspacePageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let page = state
        .service
        .list_workspaces(ListWorkspacesQuery {
            context: context_from_page_query(&query),
            page: query.page.unwrap_or(1),
            page_size: query.page_size.unwrap_or(20),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(page.into()))
}

pub(crate) async fn create_workspace<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Json(payload): Json<CreateWorkspaceRequest>,
) -> ApiResult<(StatusCode, Json<WorkspaceResponse>)>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = NotesActorContext {
        tenant_id: payload.tenant_id,
        organization_id: payload.organization_id,
        operator_id: payload.operator_id,
    };
    let owner_subject_type = payload
        .owner_subject_type
        .unwrap_or_else(|| "user".to_string());
    let owner_subject_id = payload
        .owner_subject_id
        .unwrap_or_else(|| context.operator_id.clone());

    let workspace = state
        .service
        .create_workspace(CreateWorkspaceCommand {
            id: payload.id,
            context,
            owner_subject_type,
            owner_subject_id,
            name: payload.name,
            description: payload.description,
            drive_space_id: payload.drive_space_id,
            default_page_content_type: payload
                .default_page_content_type
                .unwrap_or_else(|| DEFAULT_PAGE_CONTENT_TYPE.to_string()),
            default_page_schema_version: payload
                .default_page_schema_version
                .unwrap_or_else(|| DEFAULT_PAGE_SCHEMA_VERSION.to_string()),
            ai_index_policy_code: payload
                .ai_index_policy_code
                .unwrap_or_else(|| "default".to_string()),
        })
        .await
        .map_err(map_product_error)?;

    Ok((StatusCode::CREATED, Json(workspace.into())))
}

pub(crate) async fn get_workspace_bootstrap<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(workspace_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<WorkspaceBootstrapResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let bootstrap = state
        .service
        .get_workspace_bootstrap(&context_from_page_query(&query), &workspace_id)
        .await
        .map_err(map_product_error)?;

    Ok(Json(bootstrap.into()))
}

pub(crate) async fn list_pages<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(workspace_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<PageSummaryPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let page = state
        .service
        .list_pages(ListPagesQuery {
            context: context_from_page_query(&query),
            workspace_id,
            page: query.page.unwrap_or(1),
            page_size: query.page_size.unwrap_or(20),
            q: query.q,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(page.into()))
}

pub(crate) async fn create_page<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(workspace_id): Path<String>,
    Json(payload): Json<CreatePageRequest>,
) -> ApiResult<(StatusCode, Json<PageResponse>)>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let page_kind = parse_page_kind(payload.page_kind.as_deref())?;
    let page = state
        .service
        .create_page(CreatePageCommand {
            id: payload.id,
            context: NotesActorContext {
                tenant_id: payload.tenant_id,
                organization_id: payload.organization_id,
                operator_id: payload.operator_id,
            },
            workspace_id,
            title: payload.title,
            page_kind,
            parent_page_id: payload.parent_page_id,
            folder_drive_node_id: payload.folder_drive_node_id,
            initial_content: payload
                .initial_content
                .unwrap_or_else(|| json!({ "blocks": [] })),
            content_type: payload
                .content_type
                .unwrap_or_else(|| DEFAULT_PAGE_CONTENT_TYPE.to_string()),
            content_schema_version: payload
                .content_schema_version
                .unwrap_or_else(|| DEFAULT_PAGE_SCHEMA_VERSION.to_string()),
            change_summary: payload.change_summary,
        })
        .await
        .map_err(map_product_error)?;

    Ok((StatusCode::CREATED, Json(page.into())))
}

pub(crate) async fn get_page<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(page_id): Path<String>,
    Query(query): Query<NotesContextQuery>,
) -> ApiResult<Json<PageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let page = state
        .service
        .get_page(&context_from_query(query), &page_id)
        .await
        .map_err(map_product_error)?;
    Ok(Json(page.into()))
}

pub(crate) async fn update_page<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(page_id): Path<String>,
    Json(payload): Json<UpdatePageRequest>,
) -> ApiResult<Json<PageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let page = state
        .service
        .update_page_metadata(UpdatePageMetadataCommand {
            context: NotesActorContext {
                tenant_id: payload.tenant_id,
                organization_id: payload.organization_id,
                operator_id: payload.operator_id,
            },
            page_id,
            title: payload.title,
            favorite: payload.favorite,
            archive_status: payload.archive_status,
            publish_status: payload.publish_status,
            expected_version: payload.expected_version,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(page.into()))
}

pub(crate) async fn get_page_content<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(page_id): Path<String>,
    Query(query): Query<NotesContextQuery>,
) -> ApiResult<Json<PageContentResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let content = state
        .service
        .get_page_content(&context_from_query(query), &page_id)
        .await
        .map_err(map_product_error)?;
    Ok(Json(content.into()))
}

pub(crate) async fn update_page_content<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(page_id): Path<String>,
    Json(payload): Json<UpdatePageContentRequest>,
) -> ApiResult<Json<PageContentResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let content = state
        .service
        .update_page_content(UpdatePageContentCommand {
            context: NotesActorContext {
                tenant_id: payload.tenant_id,
                organization_id: payload.organization_id,
                operator_id: payload.operator_id,
            },
            page_id,
            content: payload.content,
            content_type: payload.content_type,
            content_schema_version: payload.content_schema_version,
            change_summary: payload.change_summary,
            expected_drive_version_id: payload.expected_drive_version_id,
            create_checkpoint: payload.create_checkpoint.unwrap_or(false),
        })
        .await
        .map_err(map_product_error)?;
    Ok(Json(content.into()))
}

pub(crate) async fn list_page_versions<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(page_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<DriveVersionPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let versions = state
        .service
        .list_page_versions(ListPageVersionsQuery {
            context: context_from_page_query(&query),
            page_id,
            page: query.page.unwrap_or(1),
            page_size: query.page_size.unwrap_or(20),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(versions.into()))
}

pub(crate) async fn restore_page_version<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path((page_id, drive_version_id)): Path<(String, String)>,
    Json(payload): Json<RestorePageVersionRequest>,
) -> ApiResult<Json<PageContentResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let content = state
        .service
        .restore_page_version(RestorePageVersionCommand {
            context: NotesActorContext {
                tenant_id: payload.tenant_id,
                organization_id: payload.organization_id,
                operator_id: payload.operator_id,
            },
            page_id,
            drive_version_id,
            expected_current_drive_version_id: payload.expected_current_drive_version_id,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(content.into()))
}

pub(crate) async fn list_page_ai_suggestions<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(page_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<AiSuggestionPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let suggestions = state
        .service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context: context_from_page_query(&query),
            page_id,
            page: query.page.unwrap_or(1),
            page_size: query.page_size.unwrap_or(20),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(suggestions.into()))
}

pub(crate) async fn accept_ai_suggestion<R, D>(
    State(state): State<NotesAppState<R, D>>,
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
    State(state): State<NotesAppState<R, D>>,
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
    State(state): State<NotesAppState<R, D>>,
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

pub(crate) async fn create_ai_suggestion_feedback<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiFeedbackCreateRequest>,
) -> ApiResult<Json<AiFeedbackResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let feedback = state
        .service
        .create_ai_feedback(CreateAiFeedbackCommand {
            context: NotesActorContext {
                tenant_id: payload.tenant_id,
                organization_id: payload.organization_id,
                operator_id: payload.operator_id,
            },
            ai_suggestion_id,
            feedback_type: payload.feedback_type,
            feedback_text: payload.feedback_text,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(feedback.into()))
}

pub(crate) async fn query_search<R, D>(
    State(state): State<NotesAppState<R, D>>,
    Query(query): Query<NotesSearchQuery>,
) -> ApiResult<Json<SearchResultPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result = state
        .service
        .query_search(SearchQuery {
            context: context_from_search_query(&query),
            workspace_id: query.workspace_id,
            q: query.q,
            page: query.page.unwrap_or(1),
            page_size: query.page_size.unwrap_or(20),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(result.into()))
}

pub(crate) async fn create_ai_job<R, D>(
    State(state): State<NotesAppState<R, D>>,
    headers: HeaderMap,
    Json(payload): Json<CreateAiJobRequest>,
) -> ApiResult<(StatusCode, Json<AiJobResponse>)>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let idempotency_key = idempotency_key_from_headers(&headers)?;
    let job = state
        .service
        .create_ai_job(CreateAiJobCommand {
            context: NotesActorContext {
                tenant_id: payload.tenant_id,
                organization_id: payload.organization_id,
                operator_id: payload.operator_id,
            },
            workspace_id: payload.workspace_id,
            job_type: payload.job_type,
            target_type: payload.target_type,
            target_id: payload.target_id,
            prompt: payload.prompt,
            context_policy: payload.context_policy,
            idempotency_key,
        })
        .await
        .map_err(map_product_error)?;

    Ok((StatusCode::ACCEPTED, Json(job.into())))
}

fn parse_page_kind(raw: Option<&str>) -> Result<PageKind, (StatusCode, Json<ProblemDetail>)> {
    match raw {
        Some(value) => PageKind::try_from_str(value).ok_or_else(|| {
            problem(
                StatusCode::BAD_REQUEST,
                "validation failed",
                "pageKind is invalid",
                "notes.validation.page_kind_invalid",
            )
        }),
        None => Ok(PageKind::Doc),
    }
}

fn idempotency_key_from_headers(
    headers: &HeaderMap,
) -> Result<String, (StatusCode, Json<ProblemDetail>)> {
    let Some(value) = headers.get("Idempotency-Key") else {
        return Err(problem(
            StatusCode::BAD_REQUEST,
            "validation failed",
            "Idempotency-Key header is required",
            "notes.validation.idempotency_key_required",
        ));
    };
    let value = value.to_str().map_err(|_| {
        problem(
            StatusCode::BAD_REQUEST,
            "validation failed",
            "Idempotency-Key header must be valid UTF-8",
            "notes.validation.idempotency_key_invalid",
        )
    })?;
    if value.trim().is_empty() {
        return Err(problem(
            StatusCode::BAD_REQUEST,
            "validation failed",
            "Idempotency-Key header is required",
            "notes.validation.idempotency_key_required",
        ));
    }
    Ok(value.trim().to_string())
}

fn context_from_query(query: NotesContextQuery) -> NotesActorContext {
    NotesActorContext {
        tenant_id: query.tenant_id,
        organization_id: query.organization_id,
        operator_id: query
            .operator_id
            .unwrap_or_else(|| "operator-unset".to_string()),
    }
}

fn context_from_page_query(query: &NotesPageQuery) -> NotesActorContext {
    NotesActorContext {
        tenant_id: query.tenant_id.clone(),
        organization_id: query.organization_id.clone(),
        operator_id: query
            .operator_id
            .clone()
            .unwrap_or_else(|| "operator-unset".to_string()),
    }
}

fn context_from_search_query(query: &NotesSearchQuery) -> NotesActorContext {
    NotesActorContext {
        tenant_id: query.tenant_id.clone(),
        organization_id: query.organization_id.clone(),
        operator_id: query
            .operator_id
            .clone()
            .unwrap_or_else(|| "operator-unset".to_string()),
    }
}
