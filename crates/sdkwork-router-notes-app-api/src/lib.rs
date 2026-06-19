pub mod context;
pub mod dto;
pub mod error;
pub mod handlers;
pub mod http_route_manifest;
pub mod manifest;
pub mod paths;
pub mod routes;
pub mod state;
pub mod web_bootstrap;

pub use http_route_manifest::app_route_manifest;
pub use web_bootstrap::{
    notes_app_public_path_prefixes, wrap_router_with_dev_web_framework,
    wrap_router_with_web_framework, wrap_router_with_web_framework_from_env,
};
