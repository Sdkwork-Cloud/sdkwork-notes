pub mod actor_context;
pub mod layer;
pub mod permissions;
pub mod test_support;

pub fn gateway_mount() -> axum::Router {
    axum::Router::new()
}
