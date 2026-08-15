use sqlx::any::AnyPoolOptions;
use sdkwork_database_config::DatabaseConfig;

use sdkwork_notes_pages_repository_sqlx::install_sqlite_schema;
use sdkwork_notes_pages_repository_sqlx::notes_store::SqlNotesStore;
use sdkwork_notes_pages_service::service::NotesService;

use super::drive_port::NotesApiDrivePort;

pub async fn assemble_notes_service_from_env(
) -> Result<NotesService<SqlNotesStore, NotesApiDrivePort>, String> {
    sqlx::any::install_default_drivers();
    let config = DatabaseConfig::from_env("notes")
        .map_err(|error| format!("resolve notes database config failed: {error}"))?;
    let pool = AnyPoolOptions::new()
        .max_connections(config.max_connections)
        .min_connections(config.min_connections)
        .acquire_timeout(config.acquire_timeout())
        .idle_timeout(config.idle_timeout())
        .max_lifetime(config.max_lifetime())
        .connect(&config.url)
        .await
        .map_err(|error| format!("connect notes database failed: {error}"))?;
    install_sqlite_schema(&pool)
        .await
        .map_err(|error| format!("install notes schema failed: {error}"))?;

    Ok(NotesService::new(
        SqlNotesStore::new(pool),
        NotesApiDrivePort::from_env(),
    ))
}
