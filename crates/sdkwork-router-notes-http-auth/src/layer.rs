use axum::Router;
use sdkwork_iam_web_adapter::build_web_framework_layer;
use sdkwork_router_iam_app_api::iam_app_api_route_manifest;
use sdkwork_web_axum::with_web_request_context;
use sdkwork_web_core::DefaultWebRequestContextResolver;

pub fn notes_public_path_prefixes() -> Vec<String> {
    vec!["/app/v3/api/system/health".to_string()]
}

pub fn with_notes_request_context(router: Router) -> Router {
    let layer = build_web_framework_layer(
        DefaultWebRequestContextResolver::default(),
        iam_app_api_route_manifest(),
        notes_public_path_prefixes(),
    );
    with_web_request_context(router, layer)
}
