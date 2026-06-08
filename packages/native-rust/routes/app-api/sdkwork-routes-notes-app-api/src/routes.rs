use crate::handlers;
use crate::paths;
use crate::state::NotesAppState;
use axum::routing::{get, post};
use axum::Router;
use sdkwork_notes_product::ports::{DrivePageContentPort, NotesRepository};
use sdkwork_notes_product::service::NotesService;

pub fn build_router<R, D>(service: NotesService<R, D>) -> Router
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    Router::new()
        .route(
            paths::WORKSPACES,
            get(handlers::list_workspaces::<R, D>).post(handlers::create_workspace::<R, D>),
        )
        .route(
            paths::WORKSPACE_BOOTSTRAP,
            get(handlers::get_workspace_bootstrap::<R, D>),
        )
        .route(
            paths::WORKSPACE_PAGES,
            get(handlers::list_pages::<R, D>).post(handlers::create_page::<R, D>),
        )
        .route(
            paths::PAGE,
            get(handlers::get_page::<R, D>).patch(handlers::update_page::<R, D>),
        )
        .route(
            paths::PAGE_CONTENT,
            get(handlers::get_page_content::<R, D>).put(handlers::update_page_content::<R, D>),
        )
        .route(
            paths::PAGE_VERSIONS,
            get(handlers::list_page_versions::<R, D>),
        )
        .route(
            paths::PAGE_AI_SUGGESTIONS,
            get(handlers::list_page_ai_suggestions::<R, D>),
        )
        .route(
            paths::AI_SUGGESTION_ACCEPT,
            post(handlers::accept_ai_suggestion::<R, D>),
        )
        .route(
            paths::AI_SUGGESTION_REJECT,
            post(handlers::reject_ai_suggestion::<R, D>),
        )
        .route(
            paths::AI_SUGGESTION_APPLY,
            post(handlers::apply_ai_suggestion::<R, D>),
        )
        .route(
            paths::AI_SUGGESTION_FEEDBACK,
            post(handlers::create_ai_suggestion_feedback::<R, D>),
        )
        .route(paths::SEARCH, get(handlers::query_search::<R, D>))
        .route(paths::AI_JOBS, post(handlers::create_ai_job::<R, D>))
        .with_state(NotesAppState::new(service))
}
