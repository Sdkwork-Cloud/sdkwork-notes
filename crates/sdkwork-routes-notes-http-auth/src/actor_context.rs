use http::StatusCode;
use sdkwork_notes_pages_service::domain::NotesActorContext;
use sdkwork_utils_rust::string::trim;
use sdkwork_web_core::WebRequestContext;

#[derive(Debug, Clone)]
pub struct ApiProblem {
    pub status: StatusCode,
    pub title: String,
    pub detail: String,
    pub code: String,
}

impl ApiProblem {
    pub fn new(status: StatusCode, code: impl Into<String>, detail: impl Into<String>) -> Self {
        let code = code.into();
        let title = code.replace('_', " ");
        Self {
            status,
            title,
            detail: detail.into(),
            code,
        }
    }
}

pub fn actor_context_from_web_request(
    context: &WebRequestContext,
) -> Result<NotesActorContext, ApiProblem> {
    let principal = context.principal.as_ref().ok_or_else(|| {
        ApiProblem::new(
            StatusCode::UNAUTHORIZED,
            "notes.auth.missing_principal",
            "authenticated request context is required",
        )
    })?;

    let organization_id = principal
        .organization_id()
        .map(str::to_owned)
        .unwrap_or_else(|| "0".to_string());

    Ok(NotesActorContext {
        tenant_id: principal.tenant_id().to_owned(),
        organization_id,
        operator_id: principal.user_id().to_owned(),
    })
}

pub fn ensure_actor_matches_claims(
    actor: &NotesActorContext,
    tenant_id: &str,
    organization_id: &str,
    operator_id: &str,
) -> Result<(), ApiProblem> {
    if actor.tenant_id != trim(tenant_id) {
        return Err(ApiProblem::new(
            StatusCode::FORBIDDEN,
            "notes.auth.tenant_mismatch",
            "request tenantId must match authenticated tenant context",
        ));
    }
    if actor.organization_id != trim(organization_id) {
        return Err(ApiProblem::new(
            StatusCode::FORBIDDEN,
            "notes.auth.organization_mismatch",
            "request organizationId must match authenticated organization context",
        ));
    }
    if actor.operator_id != trim(operator_id) {
        return Err(ApiProblem::new(
            StatusCode::FORBIDDEN,
            "notes.auth.operator_mismatch",
            "request operatorId must match authenticated user context",
        ));
    }
    Ok(())
}

pub fn ensure_optional_operator_matches(
    actor: &NotesActorContext,
    tenant_id: &str,
    organization_id: &str,
    operator_id: Option<&str>,
) -> Result<(), ApiProblem> {
    ensure_actor_matches_claims(actor, tenant_id, organization_id, actor.operator_id.as_str())?;
    if let Some(operator_id) = operator_id {
        if actor.operator_id != trim(operator_id) {
            return Err(ApiProblem::new(
                StatusCode::FORBIDDEN,
                "notes.auth.operator_mismatch",
                "request operatorId must match authenticated user context",
            ));
        }
    }
    Ok(())
}
