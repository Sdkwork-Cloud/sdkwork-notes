use crate::dto::{
    AiFeedbackCreateRequest, AiSuggestionApplyRequest, AiSuggestionDecisionRequest,
    CreateAiJobRequest, CreatePageRequest, CreateWorkspaceRequest, NotesContextQuery,
    NotesPageQuery, NotesSearchQuery, NoteRemoteApplyRequest, RestorePageVersionRequest,
    UpdatePageContentRequest, UpdatePageRequest,
};
use crate::error::{map_api_problem, ApiResult};
use sdkwork_notes_product::domain::NotesActorContext;
use sdkwork_web_core::WebRequestContext;
use sdkwork_router_notes_http_auth::{
    actor_context::{
        actor_context_from_web_request, ensure_actor_matches_claims,
        ensure_optional_operator_matches,
    },
    permissions::require_permission,
};

pub fn authenticated_page_query(
    app_ctx: &WebRequestContext,
    permission: &str,
    query: &NotesPageQuery,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_optional_operator_matches(
        &actor,
        &query.tenant_id,
        &query.organization_id,
        query.operator_id.as_deref(),
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_context_query(
    app_ctx: &WebRequestContext,
    permission: &str,
    query: NotesContextQuery,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_optional_operator_matches(
        &actor,
        &query.tenant_id,
        &query.organization_id,
        query.operator_id.as_deref(),
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_search_query(
    app_ctx: &WebRequestContext,
    permission: &str,
    query: &NotesSearchQuery,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_optional_operator_matches(
        &actor,
        &query.tenant_id,
        &query.organization_id,
        query.operator_id.as_deref(),
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_workspace_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &CreateWorkspaceRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_page_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &CreatePageRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_update_page_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &UpdatePageRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_update_content_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &UpdatePageContentRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_restore_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &RestorePageVersionRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_suggestion_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &AiSuggestionDecisionRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_apply_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &AiSuggestionApplyRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_feedback_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &AiFeedbackCreateRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_ai_job_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &CreateAiJobRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}

pub fn authenticated_remote_apply_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &NoteRemoteApplyRequest,
) -> ApiResult<NotesActorContext> {
    require_permission(app_ctx, permission).map_err(map_api_problem)?;
    let actor = actor_context_from_web_request(app_ctx).map_err(map_api_problem)?;
    ensure_actor_matches_claims(
        &actor,
        &payload.tenant_id,
        &payload.organization_id,
        &payload.operator_id,
    )
    .map_err(map_api_problem)?;
    Ok(actor)
}
