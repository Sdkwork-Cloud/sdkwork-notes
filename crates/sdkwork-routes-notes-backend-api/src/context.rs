use crate::dto::{
    AiFeedbackListQuery, AiJobListQuery, AiSuggestionApplyRequest, AiSuggestionDecisionRequest,
    BackendContextQuery, FailAiJobRequest,
};
use crate::error::{map_api_problem, ApiResult};
use sdkwork_notes_pages_service::domain::NotesActorContext;
use sdkwork_web_core::WebRequestContext;
use sdkwork_routes_notes_http_auth::{
    actor_context::{
        actor_context_from_web_request, ensure_actor_matches_claims,
        ensure_optional_operator_matches,
    },
    permissions::require_permission,
};

pub fn authenticated_backend_query(
    app_ctx: &WebRequestContext,
    permission: &str,
    query: BackendContextQuery,
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

pub fn authenticated_list_query(
    app_ctx: &WebRequestContext,
    permission: &str,
    query: &AiJobListQuery,
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

pub fn authenticated_feedback_list_query(
    app_ctx: &WebRequestContext,
    permission: &str,
    query: &AiFeedbackListQuery,
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

pub fn authenticated_fail_body(
    app_ctx: &WebRequestContext,
    permission: &str,
    payload: &FailAiJobRequest,
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
