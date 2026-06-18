use crate::state::{
    clear_session_state as clear_native_session_state, read_session_state as read_native_session_state,
    write_session_state as write_native_session_state, AppSessionState, AppState,
};

#[tauri::command]
pub fn read_session_state(state: tauri::State<'_, AppState>) -> Result<AppSessionState, String> {
    read_native_session_state(state.session_file()).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn write_session_state(
    state: tauri::State<'_, AppState>,
    session: AppSessionState,
) -> Result<(), String> {
    write_native_session_state(state.session_file(), &session).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn clear_session_state(state: tauri::State<'_, AppState>) -> Result<(), String> {
    clear_native_session_state(state.session_file()).map_err(|error| error.to_string())
}
