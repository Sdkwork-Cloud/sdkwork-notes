use crate::handlers;
use crate::paths;
use crate::state::NotesBackendState;
use axum::routing::{get, post};
use axum::Router;
use sdkwork_notes_product::ports::{DrivePageContentPort, NotesRepository};
use sdkwork_notes_product::service::NotesService;

pub fn build_router<R, D>(service: NotesService<R, D>) -> Router
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    let router = Router::new()
        .route(paths::AI_JOBS, get(handlers::list_ai_jobs::<R, D>))
        .route(paths::AI_JOB, get(handlers::get_ai_job::<R, D>))
        .route(paths::AI_JOB_CANCEL, post(handlers::cancel_ai_job::<R, D>))
        .route(paths::AI_JOB_CLAIM, post(handlers::claim_ai_job::<R, D>))
        .route(
            paths::AI_JOB_COMPLETE,
            post(handlers::complete_ai_job::<R, D>),
        )
        .route(paths::AI_JOB_FAIL, post(handlers::fail_ai_job::<R, D>))
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
            get(handlers::list_ai_suggestion_feedback::<R, D>),
        )
        .with_state(NotesBackendState::new(service));
    sdkwork_router_notes_http_auth::layer::with_notes_request_context(router)
}
