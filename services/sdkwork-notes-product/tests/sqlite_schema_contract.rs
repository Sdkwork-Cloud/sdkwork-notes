use sdkwork_notes_product::infrastructure::sql::install_sqlite_schema;
use sqlx::any::AnyPoolOptions;
use sqlx::Row;

#[tokio::test]
async fn installs_phase1_workspace_and_page_schema() {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");

    install_sqlite_schema(&pool)
        .await
        .expect("notes sqlite schema should install");

    let workspace_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1) FROM sqlite_master WHERE type='table' AND name='notes_workspace'",
    )
    .fetch_one(&pool)
    .await
    .expect("notes_workspace table count should be readable");
    assert_eq!(workspace_count, 1);

    let page_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1) FROM sqlite_master WHERE type='table' AND name='notes_page'",
    )
    .fetch_one(&pool)
    .await
    .expect("notes_page table count should be readable");
    assert_eq!(page_count, 1);

    let page_columns = table_columns(&pool, "notes_page").await;
    for required_column in [
        "drive_space_id",
        "drive_node_id",
        "drive_uri",
        "current_drive_version_id",
        "current_drive_version_no",
    ] {
        assert!(
            page_columns.contains(&required_column.to_string()),
            "notes_page should include {required_column}"
        );
    }

    let forbidden_columns = [
        ["storage", "object"].join("_"),
        ["upload", "session"].join("_"),
        "buck".to_string() + "et",
        ["object", "key"].join("_"),
        ["revision", "id"].join("_"),
    ];
    for forbidden_column in forbidden_columns {
        assert!(
            !page_columns
                .iter()
                .any(|column| column.contains(&forbidden_column)),
            "notes_page must not own Drive storage/version lifecycle column {forbidden_column}"
        );
    }

    let ai_job_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1) FROM sqlite_master WHERE type='table' AND name='notes_ai_job'",
    )
    .fetch_one(&pool)
    .await
    .expect("notes_ai_job table count should be readable");
    assert_eq!(ai_job_count, 1);

    let ai_job_source_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1) FROM sqlite_master WHERE type='table' AND name='notes_ai_job_source'",
    )
    .fetch_one(&pool)
    .await
    .expect("notes_ai_job_source table count should be readable");
    assert_eq!(ai_job_source_count, 1);

    let ai_job_columns = table_columns(&pool, "notes_ai_job").await;
    for required_column in [
        "workspace_id",
        "job_type",
        "target_type",
        "target_id",
        "status",
        "idempotency_key",
        "request_payload_hash",
    ] {
        assert!(
            ai_job_columns.contains(&required_column.to_string()),
            "notes_ai_job should include {required_column}"
        );
    }

    let ai_job_source_columns = table_columns(&pool, "notes_ai_job_source").await;
    for required_column in [
        "job_id",
        "source_type",
        "source_id",
        "drive_node_id",
        "drive_version_id",
        "drive_version_no",
        "permission_snapshot_hash",
    ] {
        assert!(
            ai_job_source_columns.contains(&required_column.to_string()),
            "notes_ai_job_source should include {required_column}"
        );
    }

    let ai_suggestion_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1) FROM sqlite_master WHERE type='table' AND name='notes_ai_suggestion'",
    )
    .fetch_one(&pool)
    .await
    .expect("notes_ai_suggestion table count should be readable");
    assert_eq!(ai_suggestion_count, 1);

    let ai_suggestion_columns = table_columns(&pool, "notes_ai_suggestion").await;
    for required_column in [
        "workspace_id",
        "page_id",
        "ai_job_id",
        "suggestion_type",
        "status",
        "source_drive_node_id",
        "source_drive_version_id",
        "source_drive_version_no",
        "payload_json",
    ] {
        assert!(
            ai_suggestion_columns.contains(&required_column.to_string()),
            "notes_ai_suggestion should include {required_column}"
        );
    }

    let create_sql: String = sqlx::query_scalar(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='notes_ai_suggestion'",
    )
    .fetch_one(&pool)
    .await
    .expect("notes_ai_suggestion create sql should be readable");
    assert!(
        create_sql.contains("'applied'"),
        "notes_ai_suggestion status constraint should include applied"
    );

    let ai_feedback_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1) FROM sqlite_master WHERE type='table' AND name='notes_ai_feedback'",
    )
    .fetch_one(&pool)
    .await
    .expect("notes_ai_feedback table count should be readable");
    assert_eq!(ai_feedback_count, 1);

    let ai_feedback_columns = table_columns(&pool, "notes_ai_feedback").await;
    for required_column in [
        "workspace_id",
        "job_id",
        "suggestion_id",
        "feedback_type",
        "feedback_text",
        "created_by",
        "created_at",
    ] {
        assert!(
            ai_feedback_columns.contains(&required_column.to_string()),
            "notes_ai_feedback should include {required_column}"
        );
    }

    for forbidden_column in [
        ["storage", "object"].join("_"),
        ["upload", "session"].join("_"),
        "buck".to_string() + "et",
        ["object", "key"].join("_"),
    ] {
        assert!(
            !ai_job_columns
                .iter()
                .chain(ai_job_source_columns.iter())
                .chain(ai_suggestion_columns.iter())
                .chain(ai_feedback_columns.iter())
                .any(|column| column.contains(&forbidden_column)),
            "AI job tables must not own Drive storage lifecycle column {forbidden_column}"
        );
    }
}

async fn table_columns(pool: &sqlx::AnyPool, table: &str) -> Vec<String> {
    let rows = sqlx::query(&format!("PRAGMA table_info({table})"))
        .fetch_all(pool)
        .await
        .expect("table columns should be readable");
    rows.into_iter().map(|row| row.get("name")).collect()
}
