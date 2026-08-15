//! Notes product service construction (API_ASSEMBLY_SPEC §3/§6.1).
//! The assembly owns the notes pages service bootstrap — repository, drive
//! port, and database lifecycle — so consuming gateways never import
//! `sdkwork-notes-pages-service` or `sdkwork-notes-pages-repository-sqlx`
//! directly.

pub mod database;
pub mod drive_app_sdk_facade;
pub mod drive_port;
