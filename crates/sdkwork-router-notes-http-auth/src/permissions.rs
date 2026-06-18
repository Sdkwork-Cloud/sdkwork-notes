use http::StatusCode;
use sdkwork_web_core::WebRequestContext;

use crate::actor_context::ApiProblem;

pub fn require_permission(context: &WebRequestContext, permission: &str) -> Result<(), ApiProblem> {
    let principal = context.principal.as_ref().ok_or_else(|| {
        ApiProblem::new(
            StatusCode::UNAUTHORIZED,
            "notes.auth.missing_principal",
            "authenticated request context is required",
        )
    })?;

    if principal
        .scopes
        .permission_scope
        .iter()
        .any(|scope| scope == permission || scope == "notes.*" || scope == "*")
    {
        return Ok(());
    }

    Err(ApiProblem::new(
        StatusCode::FORBIDDEN,
        "notes.permission_denied",
        format!("permission `{permission}` is required"),
    ))
}
