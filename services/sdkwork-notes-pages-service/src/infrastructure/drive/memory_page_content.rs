use std::collections::BTreeMap;
use std::sync::Arc;

use async_trait::async_trait;
use tokio::sync::Mutex;

use crate::domain::{DrivePageContentSnapshot, DriveVersionPage, DriveVersionSummary, PageInfo};
use crate::error::NotesProductError;
use crate::ports::{
    CreateDrivePageContentCommand, DrivePageContentPort, ListDrivePageContentVersionsCommand,
    ReadDrivePageContentCommand, RestoreDrivePageContentVersionCommand,
    UpdateDrivePageContentCommand,
};

/// In-memory Drive adapter for local development and integration tests.
#[derive(Clone, Default)]
pub struct MemoryDrivePageContentPort {
    records: Arc<Mutex<BTreeMap<String, DrivePageContentSnapshot>>>,
    versions: Arc<Mutex<BTreeMap<String, Vec<DrivePageContentSnapshot>>>>,
}

#[async_trait]
impl DrivePageContentPort for MemoryDrivePageContentPort {
    async fn create_page_content(
        &self,
        command: CreateDrivePageContentCommand,
    ) -> Result<DrivePageContentSnapshot, NotesProductError> {
        let snapshot = DrivePageContentSnapshot {
            drive_space_id: command.drive_space_id.clone(),
            drive_node_id: format!("drive-node-{}", command.page_id),
            drive_uri: format!(
                "drive://spaces/{}/nodes/drive-node-{}",
                command.drive_space_id, command.page_id
            ),
            drive_version_id: format!("drive-version-{}-v1", command.page_id),
            drive_version_no: 1,
            content_type: command.content_type,
            content_schema_version: command.content_schema_version,
            content_hash: Some("sha256:first".to_string()),
            snippet: Some("hello".to_string()),
            word_count: 1,
            task_count: 0,
            content: command.content,
        };
        self.records
            .lock()
            .await
            .insert(command.page_id.clone(), snapshot.clone());
        self.versions
            .lock()
            .await
            .entry(command.page_id)
            .or_default()
            .push(snapshot.clone());
        Ok(snapshot)
    }

    async fn update_page_content(
        &self,
        command: UpdateDrivePageContentCommand,
    ) -> Result<DrivePageContentSnapshot, NotesProductError> {
        let next_version_no = self
            .versions
            .lock()
            .await
            .get(&command.page_id)
            .and_then(|versions| {
                versions
                    .iter()
                    .map(|snapshot| snapshot.drive_version_no)
                    .max()
            })
            .unwrap_or(0)
            + 1;
        let snapshot = DrivePageContentSnapshot {
            drive_space_id: command.drive_space_id.clone(),
            drive_node_id: command.drive_node_id.clone(),
            drive_uri: command.drive_uri.clone(),
            drive_version_id: format!("drive-version-{}-v{next_version_no}", command.page_id),
            drive_version_no: next_version_no,
            content_type: command.content_type,
            content_schema_version: command.content_schema_version,
            content_hash: Some(format!("sha256:v{next_version_no}")),
            snippet: Some(format!("hello v{next_version_no}")),
            word_count: next_version_no,
            task_count: 0,
            content: command.content,
        };
        self.records
            .lock()
            .await
            .insert(command.page_id.clone(), snapshot.clone());
        self.versions
            .lock()
            .await
            .entry(command.page_id)
            .or_default()
            .push(snapshot.clone());
        Ok(snapshot)
    }

    async fn read_page_content(
        &self,
        command: ReadDrivePageContentCommand,
    ) -> Result<DrivePageContentSnapshot, NotesProductError> {
        self.records
            .lock()
            .await
            .get(&command.page_id)
            .cloned()
            .ok_or_else(|| NotesProductError::NotFound("page content not found".to_string()))
    }

    async fn restore_page_content_version(
        &self,
        command: RestoreDrivePageContentVersionCommand,
    ) -> Result<DrivePageContentSnapshot, NotesProductError> {
        let source = self
            .versions
            .lock()
            .await
            .get(&command.page_id)
            .and_then(|versions| {
                versions
                    .iter()
                    .find(|snapshot| snapshot.drive_version_id == command.drive_version_id)
                    .cloned()
            })
            .ok_or_else(|| {
                NotesProductError::NotFound("page content version not found".to_string())
            })?;
        let next_version_no = self
            .versions
            .lock()
            .await
            .get(&command.page_id)
            .and_then(|versions| {
                versions
                    .iter()
                    .map(|snapshot| snapshot.drive_version_no)
                    .max()
            })
            .unwrap_or(0)
            + 1;
        let mut snapshot = source;
        snapshot.drive_version_id = format!("drive-version-{}-v{next_version_no}", command.page_id);
        snapshot.drive_version_no = next_version_no;
        self.records
            .lock()
            .await
            .insert(command.page_id.clone(), snapshot.clone());
        self.versions
            .lock()
            .await
            .entry(command.page_id)
            .or_default()
            .push(snapshot.clone());
        Ok(snapshot)
    }

    async fn list_page_content_versions(
        &self,
        command: ListDrivePageContentVersionsCommand,
    ) -> Result<DriveVersionPage, NotesProductError> {
        let current = self
            .records
            .lock()
            .await
            .get(&command.page_id)
            .cloned()
            .ok_or_else(|| NotesProductError::NotFound("page content not found".to_string()))?;

        Ok(DriveVersionPage {
            items: vec![
                DriveVersionSummary {
                    drive_version_id: current.drive_version_id.clone(),
                    drive_version_no: current.drive_version_no,
                    version_kind: "auto".to_string(),
                    version_label: Some("Autosave".to_string()),
                    change_summary: Some("Autosave".to_string()),
                    created_at: "2026-06-08T00:00:02Z".to_string(),
                },
                DriveVersionSummary {
                    drive_version_id: format!("drive-version-{}-v1", command.page_id),
                    drive_version_no: 1,
                    version_kind: "initial".to_string(),
                    version_label: Some("Initial".to_string()),
                    change_summary: Some("Initial page".to_string()),
                    created_at: "2026-06-08T00:00:01Z".to_string(),
                },
            ],
            page_info: PageInfo {
                page: command.page,
                page_size: command.page_size,
                has_more: false,
                next_cursor: None,
            },
        })
    }
}
