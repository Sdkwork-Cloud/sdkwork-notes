use crate::{
    app::bootstrap::refresh_tray_menu,
    state::{normalize_app_language_preference, write_config, AppState},
};
use tauri::{AppHandle, Runtime};

fn set_app_language_from_state<R: Runtime>(
    app: &AppHandle<R>,
    state: &AppState,
    language: &str,
) -> Result<(), String> {
    let next_config = state
        .config_snapshot()
        .with_language(normalize_app_language_preference(language));
    write_config(state.config_file(), &next_config).map_err(|error| error.to_string())?;
    state.replace_config(next_config);
    refresh_tray_menu(app)?;
    Ok(())
}

#[tauri::command]
pub fn set_app_language<R: Runtime>(
    app: AppHandle<R>,
    state: tauri::State<'_, AppState>,
    language: String,
) -> Result<(), String> {
    set_app_language_from_state(&app, &state, &language)
}
