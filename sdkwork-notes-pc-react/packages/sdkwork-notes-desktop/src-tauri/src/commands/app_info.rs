use crate::state::AppState;

#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub target: String,
    pub platform: String,
    pub arch: String,
}

pub fn app_info_from_state(state: &AppState) -> AppInfo {
    let metadata = state.metadata();
    AppInfo {
        name: metadata.name.clone(),
        version: metadata.version.clone(),
        target: metadata.target.clone(),
        platform: metadata.platform.clone(),
        arch: metadata.arch.clone(),
    }
}

#[tauri::command]
pub fn app_info(state: tauri::State<'_, AppState>) -> AppInfo {
    app_info_from_state(&state)
}

#[cfg(test)]
mod tests {
    use super::app_info_from_state;
    use crate::state::{AppMetadata, AppState};
    use std::{fs, time::{SystemTime, UNIX_EPOCH}};

    #[test]
    fn app_info_reads_runtime_metadata_from_state() {
        let temp_root = std::env::temp_dir().join(format!(
            "sdkwork-notes-app-info-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock")
                .as_nanos()
        ));
        fs::create_dir_all(&temp_root).expect("create temp root");
        let state = AppState::from_metadata(
            temp_root.clone(),
            AppMetadata::new(
                "Notes Studio Desktop".to_string(),
                "2.4.6".to_string(),
                "windows-x86_64".to_string(),
                "windows".to_string(),
                "x64".to_string(),
            ),
        )
        .expect("state");

        let info = app_info_from_state(&state);

        assert_eq!(info.name, "Notes Studio Desktop");
        assert_eq!(info.version, "2.4.6");
        assert_eq!(info.target, "windows-x86_64");
        assert_eq!(info.platform, "windows");
        assert_eq!(info.arch, "x64");

        let _ = fs::remove_dir_all(temp_root);
    }
}
