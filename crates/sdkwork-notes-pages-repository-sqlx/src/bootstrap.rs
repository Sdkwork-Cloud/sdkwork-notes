//! SDKWork Notes database pool bootstrap via `sdkwork-database`.

use sdkwork_database_config::DatabaseConfig;
use sdkwork_database_sqlx::{create_pool_from_config, DatabasePool, PoolError};

pub use sdkwork_notes_database_host::{
    bootstrap_notes_database, bootstrap_notes_database_from_env, NotesDatabaseHost,
};

pub type NotesDatabasePool = DatabasePool;

pub async fn connect_notes_database_pool_from_env() -> Result<NotesDatabasePool, PoolError> {
    let config = DatabaseConfig::from_env("NOTES")?;
    create_pool_from_config(config).await
}

pub async fn connect_and_bootstrap_notes_database_from_env() -> Result<NotesDatabaseHost, String> {
    let pool = connect_notes_database_pool_from_env()
        .await
        .map_err(|error| error.to_string())?;
    bootstrap_notes_database(pool).await
}
