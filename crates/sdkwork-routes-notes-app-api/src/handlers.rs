use crate::context::authenticated_actor;
use crate::dto::{
    AiFeedbackCreateRequest, AiFeedbackResponse, AiJobResponse, AiSuggestionApplyRequest,
    AiSuggestionResponse, CreateAiJobRequest, CreatePageRequest,
    CreateWorkspaceRequest, DriveVersionSummaryResponse, NoteRemoteApplyMutationRequest,
    NoteRemoteApplyRequest, NoteRemoteApplyResultResponse, NotesPageQuery, NotesSearchQuery,
    PageContentResponse, PageResponse, PageSummaryResponse, RestorePageVersionRequest,
    SearchResultResponse, UpdatePageContentRequest, UpdatePageRequest,
    WorkspaceBootstrapResponse, WorkspaceResponse,
    DEFAULT_PAGE_CONTENT_TYPE, DEFAULT_PAGE_SCHEMA_VERSION,
};
use crate::envelope::{page_data, resource_data};
use crate::error::{map_product_error, ApiProblem, ApiResult};
use axum::extract::{Path, Query, State};
use axum::http::HeaderMap;
use axum::response::Response;
use sdkwork_notes_pages_service::domain::{
    AcceptAiSuggestionCommand, ApplyAiSuggestionCommand, CreateAiFeedbackCommand,
    CreateAiJobCommand, CreatePageCommand, CreateWorkspaceCommand, ListPageAiSuggestionsQuery,
    ListPageVersionsQuery, ListPagesQuery, ListWorkspacesQuery, PageKind,
    RejectAiSuggestionCommand, RemoteApplyMutation, RemoteApplyPageCommand,
    RemoteApplyPageResult, RestorePageVersionCommand, SearchQuery, UpdatePageContentCommand,
    UpdatePageMetadataCommand,
};
use sdkwork_notes_pages_service::ports::{DrivePageContentPort, NotesRepository};
use sdkwork_routes_notes_http_auth::{
    finish_accepted_json, finish_api_json, finish_created_json,
};
use sdkwork_utils_rust::string::{is_blank, trim};
use sdkwork_utils_rust::SdkWorkResourceData;
use sdkwork_web_core::WebRequestContext;
use crate::state::NotesAppState;
use serde_json::json;

pub(crate) async fn list_workspaces<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Query(query): Query<NotesPageQuery>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<_> = async {
        let context = authenticated_actor(&app_ctx, "notes.workspaces.read")?;
        let page = state
            .service
            .list_workspaces(ListWorkspacesQuery {
                context,
                page: query.page.unwrap_or(1),
                page_size: query.page_size.unwrap_or(20),
            })
            .await
            .map_err(map_product_error)?;
        Ok(page_data(
            page.items.into_iter().map(WorkspaceResponse::from).collect(),
            page.page_info,
        ))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn create_workspace<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    axum::Json(payload): axum::Json<CreateWorkspaceRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<WorkspaceResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.workspaces.write")?;
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

        Ok(resource_data(workspace.into()))
    }
    .await;
    finish_created_json(&app_ctx, result)
}

pub(crate) async fn get_workspace_bootstrap<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(workspace_id): Path<String>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<WorkspaceBootstrapResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.workspaces.read")?;
        let bootstrap = state
            .service
            .get_workspace_bootstrap(&context, &workspace_id)
            .await
            .map_err(map_product_error)?;

        Ok(resource_data(bootstrap.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn list_pages<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(workspace_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<_> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.read")?;
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
        Ok(page_data(
            page.items.into_iter().map(PageSummaryResponse::from).collect(),
            page.page_info,
        ))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn create_page<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(workspace_id): Path<String>,
    axum::Json(payload): axum::Json<CreatePageRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<PageResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.write")?;
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

        Ok(resource_data(page.into()))
    }
    .await;
    finish_created_json(&app_ctx, result)
}

pub(crate) async fn get_page<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<PageResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.read")?;
        let page = state
            .service
            .get_page(&context, &page_id)
            .await
            .map_err(map_product_error)?;
        Ok(resource_data(page.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn update_page<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    axum::Json(payload): axum::Json<UpdatePageRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<PageResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.write")?;
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

        Ok(resource_data(page.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn remote_apply_page<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    axum::Json(payload): axum::Json<NoteRemoteApplyRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<NoteRemoteApplyResultResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.write")?;
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

        Ok(resource_data(result.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

fn map_remote_apply_mutation(
    mutation: NoteRemoteApplyMutationRequest,
) -> Result<RemoteApplyMutation, ApiProblem> {
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
            _ => Err(ApiProblem::bad_request(format!(
                "unsupported remote apply intent \"{intent}\""
            ))),
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
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<PageContentResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.content.read")?;
        let content = state
            .service
            .get_page_content(&context, &page_id)
            .await
            .map_err(map_product_error)?;
        Ok(resource_data(content.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn update_page_content<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    axum::Json(payload): axum::Json<UpdatePageContentRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<PageContentResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.content.write")?;
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
        Ok(resource_data(content.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn list_page_versions<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<_> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.versions.read")?;
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
        Ok(page_data(
            versions
                .items
                .into_iter()
                .map(DriveVersionSummaryResponse::from)
                .collect(),
            versions.page_info,
        ))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn restore_page_version<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path((page_id, drive_version_id)): Path<(String, String)>,
    axum::Json(payload): axum::Json<RestorePageVersionRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<PageContentResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.versions.write")?;
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
        Ok(resource_data(content.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn list_page_ai_suggestions<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(page_id): Path<String>,
    Query(query): Query<NotesPageQuery>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<_> = async {
        let context = authenticated_actor(&app_ctx, "notes.pages.ai_suggestions.read")?;
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
        Ok(page_data(
            suggestions
                .items
                .into_iter()
                .map(AiSuggestionResponse::from)
                .collect(),
            suggestions.page_info,
        ))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn accept_ai_suggestion<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiSuggestionResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.ai_suggestions.write")?;
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
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiSuggestionResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.ai_suggestions.write")?;
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
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    axum::Json(payload): axum::Json<AiSuggestionApplyRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<PageContentResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.ai_suggestions.write")?;
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

pub(crate) async fn create_ai_suggestion_feedback<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Path(ai_suggestion_id): Path<String>,
    axum::Json(payload): axum::Json<AiFeedbackCreateRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiFeedbackResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.ai_suggestions.feedback.write")?;
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
        Ok(resource_data(feedback.into()))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn query_search<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    Query(query): Query<NotesSearchQuery>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<_> = async {
        let context = authenticated_actor(&app_ctx, "notes.search.query")?;
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
        Ok(page_data(
            result
                .items
                .into_iter()
                .map(SearchResultResponse::from)
                .collect(),
            result.page_info,
        ))
    }
    .await;
    finish_api_json(&app_ctx, result)
}

pub(crate) async fn create_ai_job<R, D>(
    State(state): State<NotesAppState<R, D>>,
    app_ctx: WebRequestContext,
    headers: HeaderMap,
    axum::Json(payload): axum::Json<CreateAiJobRequest>,
) -> Response
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let result: ApiResult<SdkWorkResourceData<AiJobResponse>> = async {
        let context = authenticated_actor(&app_ctx, "notes.ai_jobs.write")?;
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

        Ok(resource_data(job.into()))
    }
    .await;
    finish_accepted_json(&app_ctx, result)
}

fn parse_page_kind(raw: Option<&str>) -> Result<PageKind, ApiProblem> {
    match raw {
        Some(value) => PageKind::try_from_str(value)
            .ok_or_else(|| ApiProblem::bad_request("pageKind is invalid".to_string())),
        None => Ok(PageKind::Doc),
    }
}

fn idempotency_key_from_headers(headers: &HeaderMap) -> Result<String, ApiProblem> {
    let Some(value) = headers.get("Idempotency-Key") else {
        return Err(ApiProblem::bad_request(
            "Idempotency-Key header is required".to_string(),
        ));
    };
    let value = value.to_str().map_err(|_| {
        ApiProblem::bad_request("Idempotency-Key header must be valid UTF-8".to_string())
    })?;
    if is_blank(Some(value)) {
        return Err(ApiProblem::bad_request(
            "Idempotency-Key header is required".to_string(),
        ));
    }
    Ok(trim(value))
}
