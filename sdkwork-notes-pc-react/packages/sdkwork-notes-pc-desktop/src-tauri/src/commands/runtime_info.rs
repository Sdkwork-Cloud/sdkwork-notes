use crate::{
    commands::app_info::{app_info_from_state, AppInfo},
    state::{AppPaths, AppState, PublicAppConfig},
};

#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopRuntimeInfo {
    pub app: AppInfo,
    pub config: PublicAppConfig,
    pub paths: AppPaths,
}

pub fn desktop_runtime_info_from_state(state: &AppState) -> DesktopRuntimeInfo {
    DesktopRuntimeInfo {
        app: app_info_from_state(state),
        config: state.config_snapshot().public_projection(),
        paths: state.app_paths(),
    }
}

#[tauri::command]
pub fn desktop_runtime_info(state: tauri::State<'_, AppState>) -> DesktopRuntimeInfo {
    desktop_runtime_info_from_state(&state)
}
