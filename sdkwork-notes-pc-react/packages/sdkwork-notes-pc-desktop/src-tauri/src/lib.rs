mod app;
mod commands;
mod platform;
mod plugins;
mod state;

pub fn run() {
    let result = app::bootstrap::build().run(tauri::generate_context!());
    if let Err(error) = result.as_ref() {
        eprintln!("[notes-desktop][tauri] run failed: {error}");
    }

    result.expect("failed to run Notes Studio desktop");
}
