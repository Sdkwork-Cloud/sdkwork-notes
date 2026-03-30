use crate::app::bootstrap::show_main_window;
use tauri::{Builder, Runtime};

pub fn register<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            let _ = show_main_window(app);
        }))
}
