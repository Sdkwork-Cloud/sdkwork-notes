use axum::Router;
use tower_http::cors::CorsLayer;

use crate::bootstrap::auth::build_protected_router;
use crate::bootstrap::database::build_notes_service;
use crate::health;

pub async fn build_router() -> Result<Router, Box<dyn std::error::Error + Send + Sync>> {
    let service = build_notes_service()
        .await
        .map_err(|error| -> Box<dyn std::error::Error + Send + Sync> { error.into() })?;

    sdkwork_iam_database_host::bootstrap_iam_database_from_env()
        .await
        .map_err(|error| -> Box<dyn std::error::Error + Send + Sync> { error.into() })?;
    crate::bootstrap::iam_application_bootstrap::ensure_notes_tenant_application_bootstrap()
        .await
        .map_err(|error| -> Box<dyn std::error::Error + Send + Sync> { error.into() })?;

    let iam_router = sdkwork_router_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .map_err(|error| -> Box<dyn std::error::Error + Send + Sync> { error.into() })?;

    let notes_app_router = sdkwork_router_notes_app_api::routes::build_router(service.clone());
    let notes_backend_router =
        sdkwork_router_notes_backend_api::routes::build_router(service);

    let protected = Router::new()
        .merge(notes_app_router)
        .merge(notes_backend_router);

    let app = Router::new()
        .merge(iam_router)
        .merge(build_protected_router(protected).await)
        .route("/health", axum::routing::get(health::health_check))
        .route("/healthz", axum::routing::get(health::health_check))
        .layer(CorsLayer::permissive());

    Ok(app)
}
