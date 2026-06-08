pub mod notes_store;

pub const SQLITE_CORE_SQL: &str = include_str!("sqlite_core.sql");

pub async fn install_sqlite_schema(pool: &sqlx::AnyPool) -> Result<(), sqlx::Error> {
    for statement in SQLITE_CORE_SQL.split(';') {
        let statement = statement.trim();
        if statement.is_empty() {
            continue;
        }
        sqlx::query(statement).execute(pool).await?;
    }
    Ok(())
}
