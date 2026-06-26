use axum::Router;

/// Deprecated: apply [`sdkwork_routes_notes_app_api::wrap_router_with_dev_web_framework`]
/// or [`sdkwork_routes_notes_backend_api::wrap_router_with_dev_web_framework`] at the call site.
pub fn with_notes_request_context(router: Router) -> Router {
    router
}
