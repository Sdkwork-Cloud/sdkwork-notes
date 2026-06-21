use crate::dto::{
    AiFeedbackCreateRequest, AiFeedbackResponse, AiJobResponse, AiSuggestionApplyRequest,
    AiSuggestionDecisionRequest, AiSuggestionPageResponse, AiSuggestionResponse,
    CreateAiJobRequest, CreatePageRequest, CreateWorkspaceRequest, DriveVersionPageResponse,
    NoteRemoteApplyMutationRequest, NoteRemoteApplyRequest, NoteRemoteApplyResultResponse,
    NotesContextQuery, NotesPageQuery, NotesSearchQuery, PageContentResponse, PageResponse,
    PageSummaryPageResponse, RestorePageVersionRequest, SearchResultPageResponse,
    UpdatePageContentRequest, UpdatePageRequest, WorkspaceBootstrapResponse, WorkspacePageResponse,
    WorkspaceResponse, DEFAULT_PAGE_CONTENT_TYPE, DEFAULT_PAGE_SCHEMA_VERSION,
};
use crate::context::{
    authenticated_ai_job_body, authenticated_apply_body, authenticated_context_query,
    authenticated_feedback_body, authenticated_page_body, authenticated_page_query,
    authenticated_remote_apply_body, authenticated_restore_body, authenticated_search_query,
    authenticated_suggestion_body, authenticated_update_content_body,
    authenticated_update_page_body, authenticated_workspace_body,
};
use crate::error::{map_product_error, problem, ApiResult, ProblemDetail};
use sdkwork_utils_rust::string::{is_blank, trim};
use sdkwork_web_core::WebRequestContext;
use axum::Json;
use http::{HeaderMap, StatusCode};
use sdkwork_notes_pages_service::domain::{
    AcceptAiSuggestionCommand, ApplyAiSuggestionCommand, CreateAiFeedbackCommand,
    CreateAiJobCommand, CreatePageCommand, CreateWorkspaceCommand, ListPageAiSuggestionsQuery,
    ListPageVersionsQuery, ListPagesQuery, ListWorkspacesQuery, PageKind,
    RejectAiSuggestionCommand, RemoteApplyMutation, RemoteApplyPageCommand,
    RemoteApplyPageResult, RestorePageVersionCommand, SearchQuery, UpdatePageContentCommand,
    UpdatePageMetadataCommand,
};
use crate::state::NotesAppState;
use axum::extract::{Path, Query, State};
use sdkwork_notes_pages_service::ports::{DrivePageContentPort, NotesRepository};
use serde_json::json;

pub(crate) async fn list_workspaces<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<WorkspacePageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_page_query(&app_ctx, "notes.workspaces.read", &query)?;
    let page = state
        .service
        .list_workspaces(ListWorkspacesQuery {
            context,
            page: query.page.unwrap_or(1),
            page_size: query.page_size.unwrap_or(20),
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(page.into()))
}

pub(crate) async fn create_workspace<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Json(payload): Json<CreateWorkspaceRequest>,
) -> ApiResult<(StatusCode, Json<WorkspaceResponse>)>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_workspace_body(&app_ctx, "notes.workspaces.write", &payload)?;
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
    app_ctx: WebRequestContext,
    Path(workspace_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<WorkspaceBootstrapResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_page_query(&app_ctx, "notes.workspaces.read", &query)?;
    let bootstrap = state
        .service
        .get_workspace_bootstrap(&context, &workspace_id)
        .await
        .map_err(map_product_error)?;

    Ok(Json(bootstrap.into()))
}

pub(crate) async fn list_pages<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(workspace_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<PageSummaryPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_page_query(&app_ctx, "notes.pages.read", &query)?;
    let page = state
        .service
        .list_pages(ListPagesQuery {
            context,
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
    app_ctx: WebRequestContext,
    Path(workspace_id): Path<String>,
    Json(payload): Json<CreatePageRequest>,
) -> ApiResult<(StatusCode, Json<PageResponse>)>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_page_body(&app_ctx, "notes.pages.write", &payload)?;
    let page_kind = parse_page_kind(payload.page_kind.as_deref())?;
    let page = state
        .service
        .create_page(CreatePageCommand {
            id: payload.id,
            context,
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
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    Query(query): Query<NotesContextQuery>,
) -> ApiResult<Json<PageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_context_query(&app_ctx, "notes.pages.read", query)?;
    let page = state
        .service
        .get_page(&context, &page_id)
        .await
        .map_err(map_product_error)?;
    Ok(Json(page.into()))
}

pub(crate) async fn update_page<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    Json(payload): Json<UpdatePageRequest>,
) -> ApiResult<Json<PageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_update_page_body(&app_ctx, "notes.pages.write", &payload)?;
    let page = state
        .service
        .update_page_metadata(UpdatePageMetadataCommand {
            context,
            page_id,
            title: payload.title,
            favorite: payload.favorite,
            archive_status: payload.archive_status,
            publish_status: payload.publish_status,
            parent_page_id: payload.parent_page_id,
            expected_version: payload.expected_version,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(page.into()))
}

pub(crate) async fn remote_apply_page<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    Json(payload): Json<NoteRemoteApplyRequest>,
) -> ApiResult<Json<NoteRemoteApplyResultResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_remote_apply_body(&app_ctx, "notes.pages.write", &payload)?;
    let result = state
        .service
        .remote_apply_page(RemoteApplyPageCommand {
            context,
            page_id,
            idempotency_key: payload.idempotency_key,
            task_id: payload.task_id,
            entity_type: payload.entity_type,
            entity_id: payload.entity_id,
            operation: payload.operation,
            local_revision: payload.local_revision,
            base_remote_cursor: payload.base_remote_cursor,
            mutation: map_remote_apply_mutation(payload.mutation)?,
        })
        .await
        .map_err(map_product_error)?;

    Ok(Json(result.into()))
}

fn map_remote_apply_mutation(
    mutation: NoteRemoteApplyMutationRequest,
) -> Result<RemoteApplyMutation, (StatusCode, Json<ProblemDetail>)> {
    match mutation {
        NoteRemoteApplyMutationRequest::Patch { patch } => Ok(RemoteApplyMutation::UpsertPatch {
            title: patch.title,
            content: patch.content,
            parent_id: patch.parent_id,
            is_favorite: patch.is_favorite,
            publish_status: patch.publish_status,
        }),
        NoteRemoteApplyMutationRequest::Move { target_parent_id } => {
            Ok(RemoteApplyMutation::Move { target_parent_id })
        }
        NoteRemoteApplyMutationRequest::Intent { intent } => match intent.as_str() {
            "move-to-trash" => Ok(RemoteApplyMutation::TrashIntent),
            "restore-from-trash" => Ok(RemoteApplyMutation::RestoreIntent),
            "permanent-delete" => Ok(RemoteApplyMutation::PermanentDeleteIntent),
            _ => Err(problem(
                StatusCode::BAD_REQUEST,
                "validation failed",
                format!("unsupported remote apply intent \"{intent}\""),
                "notes.validation.failed",
            )),
        },
    }
}

impl From<RemoteApplyPageResult> for NoteRemoteApplyResultResponse {
    fn from(result: RemoteApplyPageResult) -> Self {
        Self {
            outcome: result.outcome,
            task_id: result.task_id,
            remote_cursor: result.remote_cursor,
            applied_at: result.applied_at,
            conflict: result.conflict.map(|conflict| crate::dto::NoteRemoteApplyConflictResponse {
                code: conflict.code,
                message: conflict.message,
                occurred_at: conflict.occurred_at,
            }),
        }
    }
}

pub(crate) async fn get_page_content<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    Query(query): Query<NotesContextQuery>,
) -> ApiResult<Json<PageContentResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_context_query(&app_ctx, "notes.pages.content.read", query)?;
    let content = state
        .service
        .get_page_content(&context, &page_id)
        .await
        .map_err(map_product_error)?;
    Ok(Json(content.into()))
}

pub(crate) async fn update_page_content<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    Json(payload): Json<UpdatePageContentRequest>,
) -> ApiResult<Json<PageContentResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context =
        authenticated_update_content_body(&app_ctx, "notes.pages.content.write", &payload)?;
    let content = state
        .service
        .update_page_content(UpdatePageContentCommand {
            context,
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
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<DriveVersionPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_page_query(&app_ctx, "notes.pages.versions.read", &query)?;
    let versions = state
        .service
        .list_page_versions(ListPageVersionsQuery {
            context,
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
    app_ctx: WebRequestContext,
    Path((page_id, drive_version_id)): Path<(String, String)>,
    Json(payload): Json<RestorePageVersionRequest>,
) -> ApiResult<Json<PageContentResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_restore_body(&app_ctx, "notes.pages.versions.write", &payload)?;
    let content = state
        .service
        .restore_page_version(RestorePageVersionCommand {
            context,
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
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> ApiResult<Json<AiSuggestionPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context =
        authenticated_page_query(&app_ctx, "notes.pages.ai_suggestions.read", &query)?;
    let suggestions = state
        .service
        .list_page_ai_suggestions(ListPageAiSuggestionsQuery {
            context,
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
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiSuggestionDecisionRequest>,
) -> ApiResult<Json<AiSuggestionResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_suggestion_body(&app_ctx, "notes.ai_suggestions.write", &payload)?;
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
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiSuggestionDecisionRequest>,
) -> ApiResult<Json<AiSuggestionResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_suggestion_body(&app_ctx, "notes.ai_suggestions.write", &payload)?;
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
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiSuggestionApplyRequest>,
) -> ApiResult<Json<PageContentResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_apply_body(&app_ctx, "notes.ai_suggestions.write", &payload)?;
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

pub(crate) async fn create_ai_suggestion_feedback<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    Json(payload): Json<AiFeedbackCreateRequest>,
) -> ApiResult<Json<AiFeedbackResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context =
        authenticated_feedback_body(&app_ctx, "notes.ai_suggestions.feedback.write", &payload)?;
    let feedback = state
        .service
        .create_ai_feedback(CreateAiFeedbackCommand {
            context,
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
    app_ctx: WebRequestContext,
    Query(query): Query<NotesSearchQuery>,
) -> ApiResult<Json<SearchResultPageResponse>>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_search_query(&app_ctx, "notes.search.query", &query)?;
    let result = state
        .service
        .query_search(SearchQuery {
            context,
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
    app_ctx: WebRequestContext,
    headers: HeaderMap,
    Json(payload): Json<CreateAiJobRequest>,
) -> ApiResult<(StatusCode, Json<AiJobResponse>)>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let context = authenticated_ai_job_body(&app_ctx, "notes.ai_jobs.write", &payload)?;
    let idempotency_key = idempotency_key_from_headers(&headers)?;
    let job = state
        .service
        .create_ai_job(CreateAiJobCommand {
            context,
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
    if is_blank(Some(value)) {
        return Err(problem(
            StatusCode::BAD_REQUEST,
            "validation failed",
            "Idempotency-Key header is required",
            "notes.validation.idempotency_key_required",
        ));
    }
    Ok(trim(value))
}
