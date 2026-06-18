use axum::Router;
use sdkwork_iam_web_adapter::{build_web_framework_layer, iam_database_resolver_from_env};
use sdkwork_router_iam_app_api::iam_app_api_route_manifest;
use sdkwork_web_axum::with_web_request_context;

pub fn notes_public_path_prefixes() -> Vec<String> {
    vec!["/app/v3/api/system/health".to_string()]
}

pub async fn build_protected_router(router: Router) -> Router {
    let resolver = iam_database_resolver_from_env().await;
    let layer = build_web_framework_layer(
        resolver,
        iam_app_api_route_manifest(),
        notes_public_path_prefixes(),
    );
    with_web_request_context(router, layer)
}
