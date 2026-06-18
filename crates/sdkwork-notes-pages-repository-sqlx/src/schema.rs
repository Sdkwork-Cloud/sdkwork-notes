use sqlx::Row;

pub const SQLITE_CORE_SQL: &str = include_str!("sqlite_core.sql");

pub async fn install_sqlite_schema(pool: &sqlx::AnyPool) -> Result<(), sqlx::Error> {
    for statement in SQLITE_CORE_SQL.split(';') {
        let statement = statement.trim();
        if statement.is_empty() {
            continue;
        }
        sqlx::query(statement).execute(pool).await?;
    }
    assert_notes_page_current_drive_version_schema(pool).await?;
    Ok(())
}

async fn assert_notes_page_current_drive_version_schema(
    pool: &sqlx::AnyPool,
) -> Result<(), sqlx::Error> {
    let rows = sqlx::query("PRAGMA table_info(notes_page)")
        .fetch_all(pool)
        .await?;
    let mut incompatible_columns = Vec::new();
    for required_column in ["current_drive_version_id", "current_drive_version_no"] {
        let is_not_null = rows.iter().any(|row| {
            let column_name: String = row.get("name");
            let not_null: i64 = row.get("notnull");
            column_name == required_column && not_null == 1
        });
        if !is_not_null {
            incompatible_columns.push(format!("notes_page.{required_column}"));
        }
    }

    if incompatible_columns.is_empty() {
        return Ok(());
    }

    Err(sqlx::Error::Protocol(format!(
        "incompatible SDKWork Notes sqlite schema: {} must be NOT NULL; run a Drive-backed page version migration/backfill before installing the current schema",
        incompatible_columns.join(", ")
    )))
}
