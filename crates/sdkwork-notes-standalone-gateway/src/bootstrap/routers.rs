use axum::Router;

use crate::bootstrap::auth::build_protected_router;
use crate::bootstrap::database::build_notes_service;
use sdkwork_web_bootstrap::{service_router, ServiceRouterConfig};

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

    let iam_router = sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .map_err(|error| -> Box<dyn std::error::Error + Send + Sync> { error.into() })?;

    let domain = sdkwork_notes_gateway_assembly::assemble_application_business_router(service).router;

    let protected = build_protected_router(domain).await;

    let business = Router::new()
        .merge(iam_router)
        .merge(build_protected_router(protected).await)
        .layer(sdkwork_web_bootstrap::application_cors_layer_from_env(
            &["SDKWORK_NOTES_ENVIRONMENT"],
            &["SDKWORK_NOTES_CORS_ALLOWED_ORIGINS", "SDKWORK_CORS_ALLOWED_ORIGINS"],
        ));

    Ok(service_router(
        business,
        ServiceRouterConfig::default().with_always_ready(),
    ))
}
