//! API assembly for sdkwork-notes.
//! Application bootstrap lives in `bootstrap.rs`; route inventory is in `assembly-manifest.json`.

mod bootstrap;
mod generated;
pub mod service;

pub use bootstrap::{
    assemble_api_router, assemble_api_router_from_env, ApiAssembly, ApiAssemblyContribution,
};

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}
