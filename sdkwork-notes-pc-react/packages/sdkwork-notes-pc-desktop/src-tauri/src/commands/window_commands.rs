use crate::app::bootstrap;
use tauri::{AppHandle, Runtime};

#[tauri::command]
pub fn show_main_window_command<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    bootstrap::show_main_window(&app)
}

#[tauri::command]
pub fn request_explicit_quit_command<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    bootstrap::request_explicit_quit(app);
    Ok(())
}
