use sqlx::any::AnyPoolOptions;

use sdkwork_notes_product::infrastructure::sql::install_sqlite_schema;
use sdkwork_notes_product::infrastructure::sql::notes_store::SqlNotesStore;
use sdkwork_notes_product::service::NotesService;

use super::drive_port::NotesApiDrivePort;

pub async fn build_notes_service(
) -> Result<NotesService<SqlNotesStore, NotesApiDrivePort>, String> {
    sqlx::any::install_default_drivers();
    let database_url = std::env::var("SDKWORK_NOTES_DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://./.sdkwork/notes/product.db".to_string());
    let pool = AnyPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
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
