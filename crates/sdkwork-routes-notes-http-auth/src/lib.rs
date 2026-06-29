pub mod actor_context;
pub mod auth;
pub mod layer;
pub mod permissions;
pub mod response;
pub mod test_support;

pub use auth::authenticated_actor;
pub use response::{
    accepted_json, created_json, finish_accepted_json, finish_api_json, finish_created_json,
    map_product_error, success_json, ApiProblem, ApiResult,
};

pub fn gateway_mount() -> axum::Router {
    axum::Router::new()
}
