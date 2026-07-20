//! Gateway bootstrap for sdkwork-notes.

use axum::Router;
use sdkwork_notes_pages_service::service::NotesService;

pub struct ApiAssembly {
    pub router: Router,
}

pub fn assemble_api_router<R, D>(service: NotesService<R, D>) -> ApiAssembly
where
    R: sdkwork_notes_pages_service::ports::NotesRepository,
    D: sdkwork_notes_pages_service::ports::DrivePageContentPort,
{
    let app_router = sdkwork_routes_notes_app_api::gateway_mount(service.clone());
    let backend_router = sdkwork_routes_notes_backend_api::gateway_mount(service);
    let auth_router = sdkwork_routes_notes_http_auth::gateway_mount();
    ApiAssembly {
        router: Router::new()
            .merge(app_router)
            .merge(backend_router)
            .merge(auth_router),
    }
}
