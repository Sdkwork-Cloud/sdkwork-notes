//! Gateway bootstrap for sdkwork-notes.

use std::sync::Arc;

use axum::Router;
use sdkwork_notes_pages_service::service::NotesService;
pub use sdkwork_web_bootstrap::ApiAssemblyContribution;
use sdkwork_web_core::HttpRouteManifest;

/// Indivisible host-neutral API assembly contribution (web-bootstrap contract,
/// API_ASSEMBLY_SPEC.md section 4).
pub type ApiAssembly = ApiAssemblyContribution;

/// Boots the notes product service from the process environment and assembles
/// the complete host-neutral contribution (API_ASSEMBLY_SPEC §3/§6.1).
/// Consuming gateways call this entrypoint instead of importing
/// `sdkwork-notes-pages-service` or `sdkwork-notes-pages-repository-sqlx`
/// directly.
pub async fn assemble_api_router_from_env() -> Result<ApiAssembly, String> {
    let service = crate::service::database::assemble_notes_service_from_env().await?;
    Ok(assemble_api_router(service))
}

pub fn assemble_api_router<R, D>(service: NotesService<R, D>) -> ApiAssembly
where
    R: sdkwork_notes_pages_service::ports::NotesRepository,
    D: sdkwork_notes_pages_service::ports::DrivePageContentPort,
{
    let app_router = sdkwork_routes_notes_app_api::gateway_mount(service.clone());
    let backend_router = sdkwork_routes_notes_backend_api::gateway_mount(service);
    let auth_router = sdkwork_routes_notes_http_auth::gateway_mount();
    let router = Router::new()
        .merge(app_router)
        .merge(backend_router)
        .merge(auth_router);

    let routes = [
        sdkwork_routes_notes_app_api::app_route_manifest(),
        sdkwork_routes_notes_backend_api::backend_route_manifest(),
    ]
    .into_iter()
    .flat_map(|manifest| manifest.routes().to_vec())
    .collect();

    ApiAssemblyContribution::from_manifest(
        "sdkwork-notes",
        "SDKWork Notes API",
        router,
        HttpRouteManifest::from_owned_routes(routes),
        Vec::new(),
        Arc::new(sdkwork_web_bootstrap::AlwaysReady),
    )
    .expect("notes assembly contribution contract is valid")
}
