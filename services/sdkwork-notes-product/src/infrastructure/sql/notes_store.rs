use crate::domain::{
    AiFeedback, AiJob, AiJobSource, AiSuggestion, DrivePageContentSnapshot, NewAiFeedback,
    NewAiJob, NewAiSuggestion, NewPage, NewWorkspace, NotesActorContext, Page, PageKind,
    PageMetadataPatch, Workspace,
};
use crate::error::{internal_sql_error, NotesProductError};
use crate::ports::NotesRepository;
use async_trait::async_trait;
use sqlx::{AnyPool, Row};

#[derive(Clone)]
pub struct SqlNotesStore {
    pool: AnyPool,
}

impl SqlNotesStore {
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl NotesRepository for SqlNotesStore {
    async fn insert_workspace(
        &self,
        workspace: NewWorkspace,
    ) -> Result<Workspace, NotesProductError> {
        sqlx::query(
            "INSERT INTO notes_workspace (
                id, tenant_id, organization_id, owner_subject_type, owner_subject_id,
                name, description, drive_space_id, default_page_content_type,
                default_page_schema_version, ai_index_policy_code, lifecycle_status,
                version, created_by, updated_by
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                'active', 1, $12, $12
             )",
        )
        .bind(&workspace.id)
        .bind(&workspace.context.tenant_id)
        .bind(&workspace.context.organization_id)
        .bind(&workspace.owner_subject_type)
        .bind(&workspace.owner_subject_id)
        .bind(&workspace.name)
        .bind(&workspace.description)
        .bind(&workspace.drive_space_id)
        .bind(&workspace.default_page_content_type)
        .bind(&workspace.default_page_schema_version)
        .bind(&workspace.ai_index_policy_code)
        .bind(&workspace.context.operator_id)
        .execute(&self.pool)
        .await
        .map_err(map_insert_error("insert notes_workspace failed"))?;

        self.find_workspace(&workspace.context, &workspace.id).await
    }

    async fn find_workspace(
        &self,
        context: &NotesActorContext,
        workspace_id: &str,
    ) -> Result<Workspace, NotesProductError> {
        let row = sqlx::query(
            "SELECT id, tenant_id, organization_id, owner_subject_type, owner_subject_id,
                    name, description, drive_space_id, default_page_content_type,
                    default_page_schema_version, ai_index_policy_code, lifecycle_status,
                    version, created_by, updated_by, created_at, updated_at
             FROM notes_workspace
             WHERE tenant_id=$1
               AND organization_id=$2
               AND id=$3
               AND lifecycle_status IN ('active', 'archived')
             LIMIT 1",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(workspace_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(internal_sql_error("find notes_workspace failed"))?;

        row.as_ref()
            .map(map_workspace)
            .ok_or_else(|| NotesProductError::NotFound("workspace not found".to_string()))
    }

    async fn list_workspaces(
        &self,
        context: &NotesActorContext,
        page: i64,
        page_size: i64,
    ) -> Result<Vec<Workspace>, NotesProductError> {
        let limit = page_size + 1;
        let offset = (page - 1) * page_size;
        let rows = sqlx::query(
            "SELECT id, tenant_id, organization_id, owner_subject_type, owner_subject_id,
                    name, description, drive_space_id, default_page_content_type,
                    default_page_schema_version, ai_index_policy_code, lifecycle_status,
                    version, created_by, updated_by, created_at, updated_at
             FROM notes_workspace
             WHERE tenant_id=$1
               AND organization_id=$2
               AND lifecycle_status IN ('active', 'archived')
             ORDER BY updated_at DESC, id DESC
             LIMIT $3 OFFSET $4",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(internal_sql_error("list notes_workspace failed"))?;

        Ok(rows.iter().map(map_workspace).collect())
    }

    async fn insert_page(&self, page: NewPage) -> Result<Page, NotesProductError> {
        sqlx::query(
            "INSERT INTO notes_page (
                id, tenant_id, organization_id, workspace_id, title, page_kind,
                parent_page_id, folder_drive_node_id, drive_space_id, drive_node_id,
                drive_uri, current_drive_version_id, current_drive_version_no,
                content_type, content_schema_version, content_hash, snippet,
                word_count, task_count, lifecycle_status, version, created_by, updated_by
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, 'active', 1, $20, $20
             )",
        )
        .bind(&page.id)
        .bind(&page.context.tenant_id)
        .bind(&page.context.organization_id)
        .bind(&page.workspace_id)
        .bind(&page.title)
        .bind(page.page_kind.as_str())
        .bind(&page.parent_page_id)
        .bind(&page.folder_drive_node_id)
        .bind(&page.drive_snapshot.drive_space_id)
        .bind(&page.drive_snapshot.drive_node_id)
        .bind(&page.drive_snapshot.drive_uri)
        .bind(&page.drive_snapshot.drive_version_id)
        .bind(page.drive_snapshot.drive_version_no)
        .bind(&page.drive_snapshot.content_type)
        .bind(&page.drive_snapshot.content_schema_version)
        .bind(&page.drive_snapshot.content_hash)
        .bind(&page.drive_snapshot.snippet)
        .bind(page.drive_snapshot.word_count)
        .bind(page.drive_snapshot.task_count)
        .bind(&page.context.operator_id)
        .execute(&self.pool)
        .await
        .map_err(map_insert_error("insert notes_page failed"))?;

        self.find_page(&page.context, &page.id).await
    }

    async fn page_id_is_reserved(&self, page_id: &str) -> Result<bool, NotesProductError> {
        let exists: Option<String> = sqlx::query_scalar(
            "SELECT id
             FROM notes_page
             WHERE id=$1
             LIMIT 1",
        )
        .bind(page_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(internal_sql_error("check notes_page id reservation failed"))?;

        Ok(exists.is_some())
    }

    async fn find_page(
        &self,
        context: &NotesActorContext,
        page_id: &str,
    ) -> Result<Page, NotesProductError> {
        let row = sqlx::query(
            "SELECT id, tenant_id, organization_id, workspace_id, title, page_kind,
                    parent_page_id, folder_drive_node_id, drive_space_id, drive_node_id,
                    drive_uri, current_drive_version_id, current_drive_version_no,
                    content_type, content_schema_version, content_hash, snippet, icon,
                    cover_asset_id, favorite, archive_status, publish_status, word_count,
                    task_count, drive_lifecycle_status_snapshot, lifecycle_status, version,
                    created_by, updated_by, created_at, updated_at, deleted_at
             FROM notes_page
             WHERE tenant_id=$1
               AND organization_id=$2
               AND id=$3
               AND lifecycle_status='active'
             LIMIT 1",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(page_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(internal_sql_error("find notes_page failed"))?;

        row.as_ref()
            .map(map_page)
            .transpose()?
            .ok_or_else(|| NotesProductError::NotFound("page not found".to_string()))
    }

    async fn list_pages(
        &self,
        context: &NotesActorContext,
        workspace_id: &str,
        page: i64,
        page_size: i64,
        q: Option<&str>,
    ) -> Result<Vec<Page>, NotesProductError> {
        let limit = page_size + 1;
        let offset = (page - 1) * page_size;
        let like_query = q.map(like_contains_pattern);
        let rows = sqlx::query(
            "SELECT id, tenant_id, organization_id, workspace_id, title, page_kind,
                    parent_page_id, folder_drive_node_id, drive_space_id, drive_node_id,
                    drive_uri, current_drive_version_id, current_drive_version_no,
                    content_type, content_schema_version, content_hash, snippet, icon,
                    cover_asset_id, favorite, archive_status, publish_status, word_count,
                    task_count, drive_lifecycle_status_snapshot, lifecycle_status, version,
                    created_by, updated_by, created_at, updated_at, deleted_at
             FROM notes_page
             WHERE tenant_id=$1
               AND organization_id=$2
               AND workspace_id=$3
               AND lifecycle_status='active'
               AND ($4 IS NULL
                    OR lower(title) LIKE $4 ESCAPE '\\'
                    OR lower(COALESCE(snippet, '')) LIKE $4 ESCAPE '\\')
             ORDER BY updated_at DESC, id DESC
             LIMIT $5 OFFSET $6",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(workspace_id)
        .bind(&like_query)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(internal_sql_error("list notes_page failed"))?;

        rows.iter().map(map_page).collect()
    }

    async fn list_root_pages(
        &self,
        context: &NotesActorContext,
        workspace_id: &str,
        limit: i64,
    ) -> Result<Vec<Page>, NotesProductError> {
        let rows = sqlx::query(
            "SELECT id, tenant_id, organization_id, workspace_id, title, page_kind,
                    parent_page_id, folder_drive_node_id, drive_space_id, drive_node_id,
                    drive_uri, current_drive_version_id, current_drive_version_no,
                    content_type, content_schema_version, content_hash, snippet, icon,
                    cover_asset_id, favorite, archive_status, publish_status, word_count,
                    task_count, drive_lifecycle_status_snapshot, lifecycle_status, version,
                    created_by, updated_by, created_at, updated_at, deleted_at
             FROM notes_page
             WHERE tenant_id=$1
               AND organization_id=$2
               AND workspace_id=$3
               AND parent_page_id IS NULL
               AND folder_drive_node_id IS NULL
               AND lifecycle_status='active'
             ORDER BY updated_at DESC, id DESC
             LIMIT $4",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(workspace_id)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(internal_sql_error("list root notes_page failed"))?;

        rows.iter().map(map_page).collect()
    }

    async fn search_pages(
        &self,
        context: &NotesActorContext,
        workspace_id: Option<&str>,
        q: Option<&str>,
        page: i64,
        page_size: i64,
    ) -> Result<Vec<Page>, NotesProductError> {
        let limit = page_size + 1;
        let offset = (page - 1) * page_size;
        let like_query = q.map(like_contains_pattern);
        let rows = if let Some(workspace_id) = workspace_id {
            sqlx::query(
                "SELECT p.id, p.tenant_id, p.organization_id, p.workspace_id, p.title, p.page_kind,
                        p.parent_page_id, p.folder_drive_node_id, p.drive_space_id, p.drive_node_id,
                        p.drive_uri, p.current_drive_version_id, p.current_drive_version_no,
                        p.content_type, p.content_schema_version, p.content_hash,
                        COALESCE(sp.snippet, p.snippet) AS snippet,
                        p.icon, p.cover_asset_id, p.favorite, p.archive_status, p.publish_status,
                        p.word_count, p.task_count, p.drive_lifecycle_status_snapshot,
                        p.lifecycle_status, p.version, p.created_by, p.updated_by, p.created_at,
                        p.updated_at, p.deleted_at
                 FROM notes_page p
                 LEFT JOIN notes_page_search_projection sp
                   ON sp.tenant_id=p.tenant_id
                  AND sp.organization_id=p.organization_id
                  AND sp.workspace_id=p.workspace_id
                  AND sp.page_id=p.id
                  AND sp.source_drive_version_id=p.current_drive_version_id
                  AND sp.source_drive_version_no=p.current_drive_version_no
                  AND sp.index_status='indexed'
                 WHERE p.tenant_id=$1
                   AND p.organization_id=$2
                   AND p.workspace_id=$3
                   AND p.lifecycle_status='active'
                   AND ($4 IS NULL
                        OR lower(p.title) LIKE $4 ESCAPE '\\'
                        OR lower(COALESCE(p.snippet, '')) LIKE $4 ESCAPE '\\'
                        OR lower(COALESCE(sp.title_snapshot, '')) LIKE $4 ESCAPE '\\'
                        OR lower(COALESCE(sp.plain_text, '')) LIKE $4 ESCAPE '\\'
                        OR lower(COALESCE(sp.snippet, '')) LIKE $4 ESCAPE '\\')
                 ORDER BY p.updated_at DESC, p.id DESC
                 LIMIT $5 OFFSET $6",
            )
            .bind(&context.tenant_id)
            .bind(&context.organization_id)
            .bind(workspace_id)
            .bind(&like_query)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
        } else {
            sqlx::query(
                "SELECT p.id, p.tenant_id, p.organization_id, p.workspace_id, p.title, p.page_kind,
                        p.parent_page_id, p.folder_drive_node_id, p.drive_space_id, p.drive_node_id,
                        p.drive_uri, p.current_drive_version_id, p.current_drive_version_no,
                        p.content_type, p.content_schema_version, p.content_hash,
                        COALESCE(sp.snippet, p.snippet) AS snippet,
                        p.icon, p.cover_asset_id, p.favorite, p.archive_status, p.publish_status,
                        p.word_count, p.task_count, p.drive_lifecycle_status_snapshot,
                        p.lifecycle_status, p.version, p.created_by, p.updated_by, p.created_at,
                        p.updated_at, p.deleted_at
                 FROM notes_page p
                 LEFT JOIN notes_page_search_projection sp
                   ON sp.tenant_id=p.tenant_id
                  AND sp.organization_id=p.organization_id
                  AND sp.workspace_id=p.workspace_id
                  AND sp.page_id=p.id
                  AND sp.source_drive_version_id=p.current_drive_version_id
                  AND sp.source_drive_version_no=p.current_drive_version_no
                  AND sp.index_status='indexed'
                 WHERE p.tenant_id=$1
                   AND p.organization_id=$2
                   AND p.lifecycle_status='active'
                   AND ($3 IS NULL
                        OR lower(p.title) LIKE $3 ESCAPE '\\'
                        OR lower(COALESCE(p.snippet, '')) LIKE $3 ESCAPE '\\'
                        OR lower(COALESCE(sp.title_snapshot, '')) LIKE $3 ESCAPE '\\'
                        OR lower(COALESCE(sp.plain_text, '')) LIKE $3 ESCAPE '\\'
                        OR lower(COALESCE(sp.snippet, '')) LIKE $3 ESCAPE '\\')
                 ORDER BY p.updated_at DESC, p.id DESC
                 LIMIT $4 OFFSET $5",
            )
            .bind(&context.tenant_id)
            .bind(&context.organization_id)
            .bind(&like_query)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
        }
        .map_err(internal_sql_error("search notes_page failed"))?;

        rows.iter().map(map_page).collect()
    }

    async fn update_page_metadata(
        &self,
        context: &NotesActorContext,
        page_id: &str,
        patch: &PageMetadataPatch,
        expected_version: Option<i64>,
    ) -> Result<Page, NotesProductError> {
        let affected = sqlx::query(
            "UPDATE notes_page
             SET title=$1,
                 favorite=$2,
                 archive_status=$3,
                 publish_status=$4,
                 updated_by=$5,
                 updated_at=CURRENT_TIMESTAMP,
                 version=version + 1
             WHERE tenant_id=$6
               AND organization_id=$7
               AND id=$8
               AND lifecycle_status='active'
               AND ($9 IS NULL OR version=$9)",
        )
        .bind(&patch.title)
        .bind(if patch.favorite { 1_i64 } else { 0_i64 })
        .bind(&patch.archive_status)
        .bind(&patch.publish_status)
        .bind(&context.operator_id)
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(page_id)
        .bind(expected_version)
        .execute(&self.pool)
        .await
        .map_err(internal_sql_error("update notes_page metadata failed"))?
        .rows_affected();

        if affected == 0 {
            if expected_version.is_some() && self.find_page(context, page_id).await.is_ok() {
                return Err(NotesProductError::Conflict(
                    "page version has changed".to_string(),
                ));
            }
            return Err(NotesProductError::NotFound("page not found".to_string()));
        }

        self.find_page(context, page_id).await
    }

    async fn update_page_drive_snapshot(
        &self,
        context: &NotesActorContext,
        page_id: &str,
        snapshot: &DrivePageContentSnapshot,
        expected_current_drive_version_id: &str,
    ) -> Result<Page, NotesProductError> {
        let affected = sqlx::query(
            "UPDATE notes_page
             SET drive_space_id=$1,
                 drive_node_id=$2,
                 drive_uri=$3,
                 current_drive_version_id=$4,
                 current_drive_version_no=$5,
                 content_type=$6,
                 content_schema_version=$7,
                 content_hash=$8,
                 snippet=$9,
                 word_count=$10,
                 task_count=$11,
                 updated_by=$12,
                 updated_at=CURRENT_TIMESTAMP,
                 version=version + 1
             WHERE tenant_id=$13
               AND organization_id=$14
               AND id=$15
               AND lifecycle_status='active'
               AND current_drive_version_id=$16",
        )
        .bind(&snapshot.drive_space_id)
        .bind(&snapshot.drive_node_id)
        .bind(&snapshot.drive_uri)
        .bind(&snapshot.drive_version_id)
        .bind(snapshot.drive_version_no)
        .bind(&snapshot.content_type)
        .bind(&snapshot.content_schema_version)
        .bind(&snapshot.content_hash)
        .bind(&snapshot.snippet)
        .bind(snapshot.word_count)
        .bind(snapshot.task_count)
        .bind(&context.operator_id)
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(page_id)
        .bind(expected_current_drive_version_id)
        .execute(&self.pool)
        .await
        .map_err(internal_sql_error("update notes_page drive refs failed"))?
        .rows_affected();

        if affected == 0 {
            if self.find_page(context, page_id).await.is_ok() {
                return Err(NotesProductError::Conflict(
                    "page Drive version has changed".to_string(),
                ));
            }
            return Err(NotesProductError::NotFound("page not found".to_string()));
        }

        self.find_page(context, page_id).await
    }

    async fn find_ai_job_by_idempotency_key(
        &self,
        context: &NotesActorContext,
        idempotency_key: &str,
    ) -> Result<Option<AiJob>, NotesProductError> {
        let row = sqlx::query(
            "SELECT id
             FROM notes_ai_job
             WHERE tenant_id=$1
               AND organization_id=$2
               AND created_by=$3
               AND idempotency_key=$4
               AND lifecycle_status='active'
             LIMIT 1",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(&context.operator_id)
        .bind(idempotency_key)
        .fetch_optional(&self.pool)
        .await
        .map_err(internal_sql_error(
            "find notes_ai_job by idempotency failed",
        ))?;

        let Some(row) = row else {
            return Ok(None);
        };
        let ai_job_id: String = row.get("id");
        self.find_ai_job(context, &ai_job_id).await.map(Some)
    }

    async fn insert_ai_job(&self, job: NewAiJob) -> Result<AiJob, NotesProductError> {
        let context_policy_snapshot =
            serde_json::to_string(&job.context_policy_snapshot).map_err(|error| {
                NotesProductError::Internal(format!(
                    "serialize notes_ai_job context policy failed: {error}"
                ))
            })?;
        let mut transaction = self
            .pool
            .begin()
            .await
            .map_err(internal_sql_error("begin notes_ai_job transaction failed"))?;

        sqlx::query(
            "INSERT INTO notes_ai_job (
                id, tenant_id, organization_id, workspace_id, job_type, target_type,
                target_id, prompt_snapshot, context_policy_snapshot, status, result_json,
                idempotency_key, request_payload_hash, lifecycle_status, version,
                created_by, updated_by
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12,
                'active', 1, $13, $13
             )",
        )
        .bind(&job.id)
        .bind(&job.context.tenant_id)
        .bind(&job.context.organization_id)
        .bind(&job.workspace_id)
        .bind(&job.job_type)
        .bind(&job.target_type)
        .bind(&job.target_id)
        .bind(&job.prompt_snapshot)
        .bind(&context_policy_snapshot)
        .bind(&job.status)
        .bind(&job.idempotency_key)
        .bind(&job.request_payload_hash)
        .bind(&job.context.operator_id)
        .execute(&mut *transaction)
        .await
        .map_err(map_insert_error("insert notes_ai_job failed"))?;

        for source in &job.sources {
            sqlx::query(
                "INSERT INTO notes_ai_job_source (
                    id, tenant_id, organization_id, workspace_id, job_id, source_type,
                    source_id, drive_node_id, drive_version_id, drive_version_no,
                    permission_snapshot_hash
                 ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
                 )",
            )
            .bind(&source.id)
            .bind(&job.context.tenant_id)
            .bind(&job.context.organization_id)
            .bind(&job.workspace_id)
            .bind(&job.id)
            .bind(&source.source_type)
            .bind(&source.source_id)
            .bind(&source.drive_node_id)
            .bind(&source.drive_version_id)
            .bind(source.drive_version_no)
            .bind(&source.permission_snapshot_hash)
            .execute(&mut *transaction)
            .await
            .map_err(map_insert_error("insert notes_ai_job_source failed"))?;
        }

        transaction
            .commit()
            .await
            .map_err(internal_sql_error("commit notes_ai_job transaction failed"))?;

        self.find_ai_job_by_idempotency_key(&job.context, &job.idempotency_key)
            .await?
            .ok_or_else(|| NotesProductError::Internal("inserted AI job not found".to_string()))
    }

    async fn list_ai_jobs(
        &self,
        context: &NotesActorContext,
        workspace_id: Option<&str>,
        page: i64,
        page_size: i64,
    ) -> Result<Vec<AiJob>, NotesProductError> {
        let limit = page_size + 1;
        let offset = (page - 1) * page_size;
        let rows = if let Some(workspace_id) = workspace_id {
            sqlx::query(
                "SELECT j.id, j.tenant_id, j.organization_id, j.workspace_id, j.job_type,
                        j.target_type, j.target_id, j.status, j.result_json,
                        j.idempotency_key, j.request_payload_hash, j.created_by, j.created_at,
                        COUNT(DISTINCT s.id) AS source_count,
                        COUNT(DISTINCT sg.id) AS suggestion_count
                 FROM notes_ai_job j
                 LEFT JOIN notes_ai_job_source s
                   ON s.tenant_id=j.tenant_id
                  AND s.organization_id=j.organization_id
                  AND s.job_id=j.id
                 LEFT JOIN notes_ai_suggestion sg
                   ON sg.tenant_id=j.tenant_id
                  AND sg.organization_id=j.organization_id
                  AND sg.ai_job_id=j.id
                  AND sg.lifecycle_status='active'
                 WHERE j.tenant_id=$1
                   AND j.organization_id=$2
                   AND j.workspace_id=$3
                   AND j.lifecycle_status='active'
                 GROUP BY j.id, j.tenant_id, j.organization_id, j.workspace_id, j.job_type,
                          j.target_type, j.target_id, j.status, j.result_json,
                          j.idempotency_key, j.request_payload_hash, j.created_by, j.created_at
                 ORDER BY j.created_at DESC, j.id DESC
                 LIMIT $4 OFFSET $5",
            )
            .bind(&context.tenant_id)
            .bind(&context.organization_id)
            .bind(workspace_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
        } else {
            sqlx::query(
                "SELECT j.id, j.tenant_id, j.organization_id, j.workspace_id, j.job_type,
                        j.target_type, j.target_id, j.status, j.result_json,
                        j.idempotency_key, j.request_payload_hash, j.created_by, j.created_at,
                        COUNT(DISTINCT s.id) AS source_count,
                        COUNT(DISTINCT sg.id) AS suggestion_count
                 FROM notes_ai_job j
                 LEFT JOIN notes_ai_job_source s
                   ON s.tenant_id=j.tenant_id
                  AND s.organization_id=j.organization_id
                  AND s.job_id=j.id
                 LEFT JOIN notes_ai_suggestion sg
                   ON sg.tenant_id=j.tenant_id
                  AND sg.organization_id=j.organization_id
                  AND sg.ai_job_id=j.id
                  AND sg.lifecycle_status='active'
                 WHERE j.tenant_id=$1
                   AND j.organization_id=$2
                   AND j.lifecycle_status='active'
                 GROUP BY j.id, j.tenant_id, j.organization_id, j.workspace_id, j.job_type,
                          j.target_type, j.target_id, j.status, j.result_json,
                          j.idempotency_key, j.request_payload_hash, j.created_by, j.created_at
                 ORDER BY j.created_at DESC, j.id DESC
                 LIMIT $3 OFFSET $4",
            )
            .bind(&context.tenant_id)
            .bind(&context.organization_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
        }
        .map_err(internal_sql_error("list notes_ai_job failed"))?;

        rows.iter().map(map_ai_job).collect()
    }

    async fn find_ai_job(
        &self,
        context: &NotesActorContext,
        ai_job_id: &str,
    ) -> Result<AiJob, NotesProductError> {
        let row = sqlx::query(
            "SELECT j.id, j.tenant_id, j.organization_id, j.workspace_id, j.job_type,
                    j.target_type, j.target_id, j.status, j.result_json,
                    j.idempotency_key, j.request_payload_hash, j.created_by, j.created_at,
                    COUNT(DISTINCT s.id) AS source_count,
                    COUNT(DISTINCT sg.id) AS suggestion_count
             FROM notes_ai_job j
             LEFT JOIN notes_ai_job_source s
               ON s.tenant_id=j.tenant_id
              AND s.organization_id=j.organization_id
              AND s.job_id=j.id
             LEFT JOIN notes_ai_suggestion sg
              ON sg.tenant_id=j.tenant_id
             AND sg.organization_id=j.organization_id
             AND sg.ai_job_id=j.id
              AND sg.lifecycle_status='active'
             WHERE j.tenant_id=$1
               AND j.organization_id=$2
               AND j.id=$3
               AND j.lifecycle_status='active'
             GROUP BY j.id, j.tenant_id, j.organization_id, j.workspace_id, j.job_type,
                      j.target_type, j.target_id, j.status, j.result_json,
                      j.idempotency_key, j.request_payload_hash, j.created_by, j.created_at
             LIMIT 1",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_job_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(internal_sql_error("find notes_ai_job failed"))?;

        row.as_ref()
            .map(map_ai_job)
            .transpose()?
            .ok_or_else(|| NotesProductError::NotFound("AI job not found".to_string()))
    }

    async fn cancel_ai_job(
        &self,
        context: &NotesActorContext,
        ai_job_id: &str,
    ) -> Result<AiJob, NotesProductError> {
        let current = self.find_ai_job(context, ai_job_id).await?;
        match current.status.as_str() {
            "canceled" => return Ok(current),
            "queued" | "running" => {}
            "succeeded" | "failed" => {
                return Err(NotesProductError::Conflict(
                    "AI job is already terminal".to_string(),
                ));
            }
            other => {
                return Err(NotesProductError::Internal(format!(
                    "invalid persisted AI job status: {other}"
                )));
            }
        }

        let affected = sqlx::query(
            "UPDATE notes_ai_job
             SET status='canceled',
                 updated_by=$1,
                 updated_at=CURRENT_TIMESTAMP,
                 version=version + 1
             WHERE tenant_id=$2
               AND organization_id=$3
               AND id=$4
               AND status IN ('queued', 'running')
               AND lifecycle_status='active'",
        )
        .bind(&context.operator_id)
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_job_id)
        .execute(&self.pool)
        .await
        .map_err(internal_sql_error("cancel notes_ai_job failed"))?
        .rows_affected();

        if affected == 0 {
            let current = self.find_ai_job(context, ai_job_id).await?;
            match current.status.as_str() {
                "canceled" => return Ok(current),
                "running" => {
                    return Err(NotesProductError::Conflict(
                        "AI job is already running".to_string(),
                    ));
                }
                "succeeded" | "failed" => {
                    return Err(NotesProductError::Conflict(
                        "AI job is already terminal".to_string(),
                    ));
                }
                "queued" => {
                    return Err(NotesProductError::Conflict(
                        "AI job could not be canceled".to_string(),
                    ));
                }
                other => {
                    return Err(NotesProductError::Internal(format!(
                        "invalid persisted AI job status: {other}"
                    )));
                }
            }
        }

        self.find_ai_job(context, ai_job_id).await
    }

    async fn claim_ai_job(
        &self,
        context: &NotesActorContext,
        ai_job_id: &str,
    ) -> Result<AiJob, NotesProductError> {
        let current = self.find_ai_job(context, ai_job_id).await?;
        match current.status.as_str() {
            "queued" => {}
            "running" => {
                return Err(NotesProductError::Conflict(
                    "AI job is already running".to_string(),
                ));
            }
            "succeeded" | "failed" | "canceled" => {
                return Err(NotesProductError::Conflict(
                    "AI job is already terminal".to_string(),
                ));
            }
            other => {
                return Err(NotesProductError::Internal(format!(
                    "invalid persisted AI job status: {other}"
                )));
            }
        }

        let affected = sqlx::query(
            "UPDATE notes_ai_job
             SET status='running',
                 updated_by=$1,
                 updated_at=CURRENT_TIMESTAMP,
                 version=version + 1
             WHERE tenant_id=$2
               AND organization_id=$3
               AND id=$4
               AND status='queued'
               AND lifecycle_status='active'",
        )
        .bind(&context.operator_id)
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_job_id)
        .execute(&self.pool)
        .await
        .map_err(internal_sql_error("claim notes_ai_job failed"))?
        .rows_affected();

        if affected == 0 {
            let current = self.find_ai_job(context, ai_job_id).await?;
            match current.status.as_str() {
                "running" => {
                    return Err(NotesProductError::Conflict(
                        "AI job is already running".to_string(),
                    ));
                }
                "succeeded" | "failed" | "canceled" => {
                    return Err(NotesProductError::Conflict(
                        "AI job is already terminal".to_string(),
                    ));
                }
                "queued" => {
                    return Err(NotesProductError::Conflict(
                        "AI job could not be claimed".to_string(),
                    ));
                }
                other => {
                    return Err(NotesProductError::Internal(format!(
                        "invalid persisted AI job status: {other}"
                    )));
                }
            }
        }

        self.find_ai_job(context, ai_job_id).await
    }

    async fn list_ai_job_sources(
        &self,
        context: &NotesActorContext,
        ai_job_id: &str,
    ) -> Result<Vec<AiJobSource>, NotesProductError> {
        let rows = sqlx::query(
            "SELECT id, tenant_id, organization_id, workspace_id, job_id, source_type,
                    source_id, drive_node_id, drive_version_id, drive_version_no,
                    permission_snapshot_hash, created_at
             FROM notes_ai_job_source
             WHERE tenant_id=$1
               AND organization_id=$2
               AND job_id=$3
             ORDER BY created_at ASC, id ASC",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_job_id)
        .fetch_all(&self.pool)
        .await
        .map_err(internal_sql_error("list notes_ai_job_source failed"))?;

        Ok(rows.iter().map(map_ai_job_source).collect())
    }

    async fn complete_ai_job(
        &self,
        context: &NotesActorContext,
        ai_job_id: &str,
        suggestions: Vec<NewAiSuggestion>,
    ) -> Result<AiJob, NotesProductError> {
        let current = self.find_ai_job(context, ai_job_id).await?;
        if current.status != "running" {
            return Err(NotesProductError::Conflict(
                "AI job must be running before completion".to_string(),
            ));
        }

        let mut transaction = self.pool.begin().await.map_err(internal_sql_error(
            "begin complete notes_ai_job transaction failed",
        ))?;

        for suggestion in &suggestions {
            let payload_json = serde_json::to_string(&suggestion.payload).map_err(|error| {
                NotesProductError::Internal(format!(
                    "serialize notes_ai_suggestion payload failed: {error}"
                ))
            })?;
            sqlx::query(
                "INSERT INTO notes_ai_suggestion (
                    id, tenant_id, organization_id, workspace_id, page_id, ai_job_id,
                    suggestion_type, status, source_drive_node_id, source_drive_version_id,
                    source_drive_version_no, payload_json, lifecycle_status, version,
                    created_by, updated_by
                 ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, 'proposed', $8, $9, $10, $11,
                    'active', 1, $12, $12
                 )",
            )
            .bind(&suggestion.id)
            .bind(&suggestion.context.tenant_id)
            .bind(&suggestion.context.organization_id)
            .bind(&suggestion.workspace_id)
            .bind(&suggestion.page_id)
            .bind(&suggestion.ai_job_id)
            .bind(&suggestion.suggestion_type)
            .bind(&suggestion.source_drive_node_id)
            .bind(&suggestion.source_drive_version_id)
            .bind(suggestion.source_drive_version_no)
            .bind(&payload_json)
            .bind(&suggestion.context.operator_id)
            .execute(&mut *transaction)
            .await
            .map_err(map_insert_error("insert notes_ai_suggestion failed"))?;
        }

        let result_json = serde_json::json!({
            "suggestionCount": suggestions.len().to_string(),
            "completedBy": context.operator_id,
        });
        let result_json = serde_json::to_string(&result_json).map_err(|error| {
            NotesProductError::Internal(format!("serialize notes_ai_job result failed: {error}"))
        })?;
        let affected = sqlx::query(
            "UPDATE notes_ai_job
             SET status='succeeded',
                 result_json=$1,
                 updated_by=$2,
                 updated_at=CURRENT_TIMESTAMP,
                 version=version + 1
             WHERE tenant_id=$3
               AND organization_id=$4
               AND id=$5
               AND status='running'
               AND lifecycle_status='active'",
        )
        .bind(&result_json)
        .bind(&context.operator_id)
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_job_id)
        .execute(&mut *transaction)
        .await
        .map_err(internal_sql_error("complete notes_ai_job failed"))?
        .rows_affected();

        if affected == 0 {
            return Err(NotesProductError::Conflict(
                "AI job must be running before completion".to_string(),
            ));
        }

        transaction.commit().await.map_err(internal_sql_error(
            "commit complete notes_ai_job transaction failed",
        ))?;

        self.find_ai_job(context, ai_job_id).await
    }

    async fn list_page_ai_suggestions(
        &self,
        context: &NotesActorContext,
        page_id: &str,
        page: i64,
        page_size: i64,
    ) -> Result<Vec<AiSuggestion>, NotesProductError> {
        let limit = page_size + 1;
        let offset = (page - 1) * page_size;
        let rows = sqlx::query(
            "SELECT id, tenant_id, organization_id, workspace_id, page_id, ai_job_id,
                    suggestion_type, status, source_drive_node_id, source_drive_version_id,
                    source_drive_version_no, payload_json, created_by, created_at
             FROM notes_ai_suggestion
             WHERE tenant_id=$1
               AND organization_id=$2
               AND page_id=$3
               AND lifecycle_status='active'
             ORDER BY created_at DESC, id DESC
             LIMIT $4 OFFSET $5",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(page_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(internal_sql_error("list notes_ai_suggestion failed"))?;

        rows.iter().map(map_ai_suggestion).collect()
    }

    async fn find_ai_suggestion(
        &self,
        context: &NotesActorContext,
        ai_suggestion_id: &str,
    ) -> Result<AiSuggestion, NotesProductError> {
        let row = sqlx::query(
            "SELECT id, tenant_id, organization_id, workspace_id, page_id, ai_job_id,
                    suggestion_type, status, source_drive_node_id, source_drive_version_id,
                    source_drive_version_no, payload_json, created_by, created_at
             FROM notes_ai_suggestion
             WHERE tenant_id=$1
               AND organization_id=$2
               AND id=$3
               AND lifecycle_status='active'
             LIMIT 1",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_suggestion_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(internal_sql_error("find notes_ai_suggestion failed"))?;

        row.as_ref()
            .map(map_ai_suggestion)
            .transpose()?
            .ok_or_else(|| NotesProductError::NotFound("AI suggestion not found".to_string()))
    }

    async fn decide_ai_suggestion(
        &self,
        context: &NotesActorContext,
        ai_suggestion_id: &str,
        status: &str,
    ) -> Result<AiSuggestion, NotesProductError> {
        let affected = sqlx::query(
            "UPDATE notes_ai_suggestion
             SET status=$1,
                 updated_by=$2,
                 updated_at=CURRENT_TIMESTAMP,
                 version=version + 1
             WHERE tenant_id=$3
               AND organization_id=$4
               AND id=$5
               AND status='proposed'
               AND lifecycle_status='active'",
        )
        .bind(status)
        .bind(&context.operator_id)
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_suggestion_id)
        .execute(&self.pool)
        .await
        .map_err(internal_sql_error("decide notes_ai_suggestion failed"))?
        .rows_affected();

        if affected == 0 {
            return self.find_ai_suggestion(context, ai_suggestion_id).await;
        }

        self.find_ai_suggestion(context, ai_suggestion_id).await
    }

    async fn apply_ai_suggestion(
        &self,
        context: &NotesActorContext,
        ai_suggestion_id: &str,
        page_id: &str,
        snapshot: &DrivePageContentSnapshot,
        expected_current_drive_version_id: &str,
    ) -> Result<AiSuggestion, NotesProductError> {
        let mut transaction = self.pool.begin().await.map_err(internal_sql_error(
            "begin apply notes_ai_suggestion transaction failed",
        ))?;

        let page_affected = sqlx::query(
            "UPDATE notes_page
             SET drive_space_id=$1,
                 drive_node_id=$2,
                 drive_uri=$3,
                 current_drive_version_id=$4,
                 current_drive_version_no=$5,
                 content_type=$6,
                 content_schema_version=$7,
                 content_hash=$8,
                 snippet=$9,
                 word_count=$10,
                 task_count=$11,
                 updated_by=$12,
                 updated_at=CURRENT_TIMESTAMP,
                 version=version + 1
             WHERE tenant_id=$13
               AND organization_id=$14
               AND id=$15
               AND lifecycle_status='active'
               AND current_drive_version_id=$16",
        )
        .bind(&snapshot.drive_space_id)
        .bind(&snapshot.drive_node_id)
        .bind(&snapshot.drive_uri)
        .bind(&snapshot.drive_version_id)
        .bind(snapshot.drive_version_no)
        .bind(&snapshot.content_type)
        .bind(&snapshot.content_schema_version)
        .bind(&snapshot.content_hash)
        .bind(&snapshot.snippet)
        .bind(snapshot.word_count)
        .bind(snapshot.task_count)
        .bind(&context.operator_id)
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(page_id)
        .bind(expected_current_drive_version_id)
        .execute(&mut *transaction)
        .await
        .map_err(internal_sql_error(
            "apply notes_ai_suggestion page drive refs failed",
        ))?
        .rows_affected();

        if page_affected == 0 {
            let page_exists: Option<String> = sqlx::query_scalar(
                "SELECT id
                 FROM notes_page
                 WHERE tenant_id=$1
                   AND organization_id=$2
                   AND id=$3
                   AND lifecycle_status='active'
                 LIMIT 1",
            )
            .bind(&context.tenant_id)
            .bind(&context.organization_id)
            .bind(page_id)
            .fetch_optional(&mut *transaction)
            .await
            .map_err(internal_sql_error(
                "apply notes_ai_suggestion page conflict check failed",
            ))?;
            if page_exists.is_some() {
                return Err(NotesProductError::Conflict(
                    "page Drive version has changed".to_string(),
                ));
            }
            return Err(NotesProductError::NotFound("page not found".to_string()));
        }

        let suggestion_affected = sqlx::query(
            "UPDATE notes_ai_suggestion
             SET status='applied',
                 updated_by=$1,
                 updated_at=CURRENT_TIMESTAMP,
                 version=version + 1
             WHERE tenant_id=$2
               AND organization_id=$3
               AND id=$4
               AND status='accepted'
               AND lifecycle_status='active'",
        )
        .bind(&context.operator_id)
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_suggestion_id)
        .execute(&mut *transaction)
        .await
        .map_err(internal_sql_error("apply notes_ai_suggestion failed"))?
        .rows_affected();

        if suggestion_affected == 0 {
            let suggestion_exists: Option<String> = sqlx::query_scalar(
                "SELECT id
                 FROM notes_ai_suggestion
                 WHERE tenant_id=$1
                   AND organization_id=$2
                   AND id=$3
                   AND lifecycle_status='active'
                 LIMIT 1",
            )
            .bind(&context.tenant_id)
            .bind(&context.organization_id)
            .bind(ai_suggestion_id)
            .fetch_optional(&mut *transaction)
            .await
            .map_err(internal_sql_error(
                "apply notes_ai_suggestion conflict check failed",
            ))?;
            if suggestion_exists.is_some() {
                return Err(NotesProductError::Conflict(
                    "AI suggestion status changed before apply completed".to_string(),
                ));
            }
            return Err(NotesProductError::NotFound(
                "AI suggestion not found".to_string(),
            ));
        }

        transaction.commit().await.map_err(internal_sql_error(
            "commit apply notes_ai_suggestion transaction failed",
        ))?;

        self.find_ai_suggestion(context, ai_suggestion_id).await
    }

    async fn find_ai_feedback(
        &self,
        context: &NotesActorContext,
        ai_feedback_id: &str,
    ) -> Result<AiFeedback, NotesProductError> {
        let row = sqlx::query(
            "SELECT id, tenant_id, organization_id, workspace_id, job_id, suggestion_id,
                    feedback_type, feedback_text, created_by, created_at
             FROM notes_ai_feedback
             WHERE tenant_id=$1
               AND organization_id=$2
               AND id=$3
             LIMIT 1",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_feedback_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(internal_sql_error("find notes_ai_feedback failed"))?;

        row.as_ref()
            .map(map_ai_feedback)
            .ok_or_else(|| NotesProductError::NotFound("AI feedback not found".to_string()))
    }

    async fn insert_ai_feedback(
        &self,
        feedback: NewAiFeedback,
    ) -> Result<AiFeedback, NotesProductError> {
        sqlx::query(
            "INSERT INTO notes_ai_feedback (
                id, tenant_id, organization_id, workspace_id, job_id, suggestion_id,
                feedback_type, feedback_text, created_by
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
             )",
        )
        .bind(&feedback.id)
        .bind(&feedback.context.tenant_id)
        .bind(&feedback.context.organization_id)
        .bind(&feedback.workspace_id)
        .bind(&feedback.job_id)
        .bind(&feedback.suggestion_id)
        .bind(&feedback.feedback_type)
        .bind(&feedback.feedback_text)
        .bind(&feedback.context.operator_id)
        .execute(&self.pool)
        .await
        .map_err(map_insert_error("insert notes_ai_feedback failed"))?;

        self.find_ai_feedback(&feedback.context, &feedback.id).await
    }

    async fn list_ai_suggestion_feedback(
        &self,
        context: &NotesActorContext,
        ai_suggestion_id: &str,
        page: i64,
        page_size: i64,
    ) -> Result<Vec<AiFeedback>, NotesProductError> {
        let limit = page_size + 1;
        let offset = (page - 1) * page_size;
        let rows = sqlx::query(
            "SELECT id, tenant_id, organization_id, workspace_id, job_id, suggestion_id,
                    feedback_type, feedback_text, created_by, created_at
             FROM notes_ai_feedback
             WHERE tenant_id=$1
               AND organization_id=$2
               AND suggestion_id=$3
             ORDER BY created_at DESC, id DESC
             LIMIT $4 OFFSET $5",
        )
        .bind(&context.tenant_id)
        .bind(&context.organization_id)
        .bind(ai_suggestion_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(internal_sql_error("list notes_ai_feedback failed"))?;

        Ok(rows.iter().map(map_ai_feedback).collect())
    }
}

fn map_insert_error(context: &'static str) -> impl Fn(sqlx::Error) -> NotesProductError {
    move |error| match &error {
        sqlx::Error::Database(database_error)
            if database_error
                .message()
                .contains("UNIQUE constraint failed") =>
        {
            NotesProductError::Conflict(context.to_string())
        }
        _ => NotesProductError::Internal(format!("{context}: {error}")),
    }
}

fn like_contains_pattern(query: &str) -> String {
    let mut escaped = String::with_capacity(query.len() + 2);
    escaped.push('%');
    for character in query.to_lowercase().chars() {
        match character {
            '\\' | '%' | '_' => {
                escaped.push('\\');
                escaped.push(character);
            }
            _ => escaped.push(character),
        }
    }
    escaped.push('%');
    escaped
}

fn map_workspace(row: &sqlx::any::AnyRow) -> Workspace {
    Workspace {
        id: row.get("id"),
        tenant_id: row.get("tenant_id"),
        organization_id: row.get("organization_id"),
        owner_subject_type: row.get("owner_subject_type"),
        owner_subject_id: row.get("owner_subject_id"),
        name: row.get("name"),
        description: row.get("description"),
        drive_space_id: row.get("drive_space_id"),
        default_page_content_type: row.get("default_page_content_type"),
        default_page_schema_version: row.get("default_page_schema_version"),
        ai_index_policy_code: row.get("ai_index_policy_code"),
        lifecycle_status: row.get("lifecycle_status"),
        version: row.get("version"),
        created_by: row.get("created_by"),
        updated_by: row.get("updated_by"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

fn map_page(row: &sqlx::any::AnyRow) -> Result<Page, NotesProductError> {
    let page_kind: String = row.get("page_kind");
    let page_kind = PageKind::try_from_str(&page_kind).ok_or_else(|| {
        NotesProductError::Internal(format!("invalid persisted page_kind: {page_kind}"))
    })?;
    let favorite: i64 = row.get("favorite");

    Ok(Page {
        id: row.get("id"),
        tenant_id: row.get("tenant_id"),
        organization_id: row.get("organization_id"),
        workspace_id: row.get("workspace_id"),
        title: row.get("title"),
        page_kind,
        parent_page_id: row.get("parent_page_id"),
        folder_drive_node_id: row.get("folder_drive_node_id"),
        drive_space_id: row.get("drive_space_id"),
        drive_node_id: row.get("drive_node_id"),
        drive_uri: row.get("drive_uri"),
        current_drive_version_id: row.get("current_drive_version_id"),
        current_drive_version_no: row.get("current_drive_version_no"),
        content_type: row.get("content_type"),
        content_schema_version: row.get("content_schema_version"),
        content_hash: row.get("content_hash"),
        snippet: row.get("snippet"),
        icon: row.get("icon"),
        cover_asset_id: row.get("cover_asset_id"),
        favorite: favorite == 1,
        archive_status: row.get("archive_status"),
        publish_status: row.get("publish_status"),
        word_count: row.get("word_count"),
        task_count: row.get("task_count"),
        drive_lifecycle_status_snapshot: row.get("drive_lifecycle_status_snapshot"),
        lifecycle_status: row.get("lifecycle_status"),
        version: row.get("version"),
        created_by: row.get("created_by"),
        updated_by: row.get("updated_by"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        deleted_at: row.get("deleted_at"),
    })
}

fn map_ai_job(row: &sqlx::any::AnyRow) -> Result<AiJob, NotesProductError> {
    let result_json: Option<String> = row.get("result_json");
    let result = result_json
        .as_deref()
        .map(serde_json::from_str)
        .transpose()
        .map_err(|error| NotesProductError::Internal(format!("invalid result_json: {error}")))?;

    Ok(AiJob {
        id: row.get("id"),
        tenant_id: row.get("tenant_id"),
        organization_id: row.get("organization_id"),
        workspace_id: row.get("workspace_id"),
        job_type: row.get("job_type"),
        target_type: row.get("target_type"),
        target_id: row.get("target_id"),
        status: row.get("status"),
        result,
        source_count: row.try_get("source_count").unwrap_or(0_i64),
        suggestion_count: row.try_get("suggestion_count").unwrap_or(0_i64),
        idempotency_key: row.get("idempotency_key"),
        request_payload_hash: row.get("request_payload_hash"),
        created_by: row.get("created_by"),
        created_at: row.get("created_at"),
    })
}

fn map_ai_job_source(row: &sqlx::any::AnyRow) -> AiJobSource {
    AiJobSource {
        id: row.get("id"),
        tenant_id: row.get("tenant_id"),
        organization_id: row.get("organization_id"),
        workspace_id: row.get("workspace_id"),
        job_id: row.get("job_id"),
        source_type: row.get("source_type"),
        source_id: row.get("source_id"),
        drive_node_id: row.get("drive_node_id"),
        drive_version_id: row.get("drive_version_id"),
        drive_version_no: row.get("drive_version_no"),
        permission_snapshot_hash: row.get("permission_snapshot_hash"),
        created_at: row.get("created_at"),
    }
}

fn map_ai_suggestion(row: &sqlx::any::AnyRow) -> Result<AiSuggestion, NotesProductError> {
    let payload_json: String = row.get("payload_json");
    let payload = serde_json::from_str(&payload_json).map_err(|error| {
        NotesProductError::Internal(format!("invalid notes_ai_suggestion payload_json: {error}"))
    })?;

    Ok(AiSuggestion {
        id: row.get("id"),
        tenant_id: row.get("tenant_id"),
        organization_id: row.get("organization_id"),
        workspace_id: row.get("workspace_id"),
        page_id: row.get("page_id"),
        ai_job_id: row.get("ai_job_id"),
        suggestion_type: row.get("suggestion_type"),
        status: row.get("status"),
        source_drive_node_id: row.get("source_drive_node_id"),
        source_drive_version_id: row.get("source_drive_version_id"),
        source_drive_version_no: row.get("source_drive_version_no"),
        payload,
        created_by: row.get("created_by"),
        created_at: row.get("created_at"),
    })
}

fn map_ai_feedback(row: &sqlx::any::AnyRow) -> AiFeedback {
    AiFeedback {
        id: row.get("id"),
        tenant_id: row.get("tenant_id"),
        organization_id: row.get("organization_id"),
        workspace_id: row.get("workspace_id"),
        job_id: row.get("job_id"),
        suggestion_id: row.get("suggestion_id"),
        feedback_type: row.get("feedback_type"),
        feedback_text: row.get("feedback_text"),
        created_by: row.get("created_by"),
        created_at: row.get("created_at"),
    }
}
