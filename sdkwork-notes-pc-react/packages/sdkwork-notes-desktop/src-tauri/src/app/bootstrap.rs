use crate::{
    commands,
    state::{
        normalize_app_language_preference, AppMetadata, AppState, APP_LANGUAGE_PREFERENCE_ENGLISH,
        APP_LANGUAGE_PREFERENCE_SIMPLIFIED_CHINESE,
    },
};
use tauri::{
    menu::{Menu, MenuBuilder, SubmenuBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime, Window, WindowEvent,
};

const APP_READY_EVENT: &str = "app://ready";
const MAIN_WINDOW_LABEL: &str = "main";
const TRAY_ICON_ID: &str = "main_tray";
const ROUTE_NOTES: &str = "/notes";
const ROUTE_ACCOUNT: &str = "/account";
const TRAY_NAVIGATE_EVENT: &str = "tray://navigate";

pub(crate) const TRAY_MENU_ID_SHOW_WINDOW: &str = "show_window";
pub(crate) const TRAY_MENU_ID_OPEN_NOTES: &str = "open_notes";
pub(crate) const TRAY_MENU_ID_OPEN_ACCOUNT: &str = "open_account";
pub(crate) const TRAY_MENU_ID_QUIT_APP: &str = "quit_app";

type DesktopResult<T> = Result<T, String>;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum TrayAction {
    ShowWindow,
    OpenRoute(&'static str),
    QuitApp,
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct TrayNavigatePayload {
    route: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum TrayLanguage {
    En,
    Zh,
}

#[cfg(test)]
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) enum TrayMenuEntry {
    Item {
        id: &'static str,
        label: String,
    },
    Separator,
    Submenu {
        label: String,
        items: Vec<TrayMenuEntry>,
    },
}

#[derive(Clone, Copy, Debug)]
struct TrayLabels {
    open_window: &'static str,
    navigate: &'static str,
    notes: &'static str,
    account: &'static str,
    quit_app: &'static str,
}

pub fn build() -> tauri::Builder<tauri::Wry> {
    crate::plugins::register(tauri::Builder::default())
        .setup(|app| {
            let package_info = app.package_info();
            let metadata = AppMetadata::new(
                package_info.name.clone(),
                package_info.version.to_string(),
                crate::platform::current_target().to_string(),
                crate::platform::current_platform().to_string(),
                crate::platform::current_arch().to_string(),
            );
            let app_data_dir = app.path().app_data_dir()?;
            let state = AppState::from_metadata(app_data_dir, metadata)?;
            let app_handle = app.handle().clone();

            app.manage(state);
            create_tray(&app_handle).map_err(std::io::Error::other)?;
            app.emit(APP_READY_EVENT, ()).map_err(std::io::Error::other)?;
            Ok(())
        })
        .on_window_event(handle_window_event)
        .invoke_handler(tauri::generate_handler![
            commands::app_info::app_info,
            commands::runtime_info::desktop_runtime_info,
            commands::set_app_language::set_app_language,
            commands::window_commands::show_main_window_command,
            commands::window_commands::request_explicit_quit_command,
        ])
}

pub fn show_main_window<R: Runtime>(app: &AppHandle<R>) -> DesktopResult<()> {
    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window is unavailable".to_string())?;

    let _ = window.unminimize();
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

pub fn request_explicit_quit<R: Runtime>(app: AppHandle<R>) {
    if let Some(state) = app.try_state::<AppState>() {
        state.request_shutdown();
    }
    app.exit(0);
}

pub fn refresh_tray_menu<R: Runtime>(app: &AppHandle<R>) -> DesktopResult<()> {
    let tray = app
        .tray_by_id(TRAY_ICON_ID)
        .ok_or_else(|| "main tray is unavailable".to_string())?;
    let menu = build_tray_menu(app, active_tray_language(app))?;
    tray.set_menu(Some(menu)).map_err(|error| error.to_string())?;
    Ok(())
}

pub(crate) fn should_prevent_main_window_close(shutdown_requested: bool) -> bool {
    !shutdown_requested
}

pub(crate) fn tray_action_for_menu_id(id: &str) -> Option<TrayAction> {
    match id {
        TRAY_MENU_ID_SHOW_WINDOW => Some(TrayAction::ShowWindow),
        TRAY_MENU_ID_OPEN_NOTES => Some(TrayAction::OpenRoute(ROUTE_NOTES)),
        TRAY_MENU_ID_OPEN_ACCOUNT => Some(TrayAction::OpenRoute(ROUTE_ACCOUNT)),
        TRAY_MENU_ID_QUIT_APP => Some(TrayAction::QuitApp),
        _ => None,
    }
}

pub(crate) fn resolve_tray_language(
    configured_language: &str,
    system_locale: Option<&str>,
) -> TrayLanguage {
    match normalize_app_language_preference(configured_language) {
        APP_LANGUAGE_PREFERENCE_SIMPLIFIED_CHINESE => TrayLanguage::Zh,
        APP_LANGUAGE_PREFERENCE_ENGLISH => TrayLanguage::En,
        _ => system_locale_to_tray_language(system_locale),
    }
}

#[cfg(test)]
pub(crate) fn build_tray_menu_spec(language: TrayLanguage) -> Vec<TrayMenuEntry> {
    let labels = tray_labels_for(language);

    vec![
        TrayMenuEntry::Item {
            id: TRAY_MENU_ID_SHOW_WINDOW,
            label: labels.open_window.to_string(),
        },
        TrayMenuEntry::Separator,
        TrayMenuEntry::Submenu {
            label: labels.navigate.to_string(),
            items: vec![
                TrayMenuEntry::Item {
                    id: TRAY_MENU_ID_OPEN_NOTES,
                    label: labels.notes.to_string(),
                },
                TrayMenuEntry::Item {
                    id: TRAY_MENU_ID_OPEN_ACCOUNT,
                    label: labels.account.to_string(),
                },
            ],
        },
        TrayMenuEntry::Separator,
        TrayMenuEntry::Item {
            id: TRAY_MENU_ID_QUIT_APP,
            label: labels.quit_app.to_string(),
        },
    ]
}

fn create_tray<R: Runtime>(app: &AppHandle<R>) -> DesktopResult<()> {
    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| "default window icon is unavailable".to_string())?;
    let menu = build_tray_menu(app, active_tray_language(app))?;

    TrayIconBuilder::with_id(TRAY_ICON_ID)
        .icon(icon)
        .tooltip(app.package_info().name.clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| handle_tray_menu_event(app, event.id().as_ref()))
        .on_tray_icon_event(|tray, event| handle_tray_icon_event(tray.app_handle(), event))
        .build(app)
        .map_err(|error| error.to_string())?;

    Ok(())
}

fn handle_window_event<R: Runtime>(window: &Window<R>, event: &WindowEvent) {
    if window.label() != MAIN_WINDOW_LABEL {
        return;
    }

    if let WindowEvent::CloseRequested { api, .. } = event {
        let app = window.app_handle();
        let Some(state) = app.try_state::<AppState>() else {
            return;
        };

        if should_prevent_main_window_close(state.is_shutdown_requested()) {
            api.prevent_close();
            let _ = window.hide();
        }
    }
}

fn handle_tray_menu_event<R: Runtime>(app: &AppHandle<R>, menu_id: &str) {
    let Some(action) = tray_action_for_menu_id(menu_id) else {
        return;
    };

    match action {
        TrayAction::ShowWindow => {
            let _ = show_main_window(app);
        }
        TrayAction::OpenRoute(route) => {
            let _ = open_route_from_tray(app, route);
        }
        TrayAction::QuitApp => request_explicit_quit(app.clone()),
    }
}

fn handle_tray_icon_event<R: Runtime>(app: &AppHandle<R>, event: TrayIconEvent) {
    if matches!(
        event,
        TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        }
    ) {
        let _ = show_main_window(app);
    }
}

fn open_route_from_tray<R: Runtime>(app: &AppHandle<R>, route: &str) -> DesktopResult<()> {
    show_main_window(app)?;

    let payload = TrayNavigatePayload {
        route: route.to_string(),
    };
    app.emit(TRAY_NAVIGATE_EVENT, &payload)
        .map_err(|error| error.to_string())?;

    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        let route_literal =
            serde_json::to_string(route).map_err(|error| error.to_string())?;
        let script = format!(
            "window.__NOTES_PENDING_TRAY_ROUTE__ = {route}; window.dispatchEvent(new CustomEvent('notes:tray-navigate', {{ detail: {{ route: {route} }} }}));",
            route = route_literal
        );
        window.eval(script.as_str()).map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn active_tray_language<R: Runtime>(app: &AppHandle<R>) -> TrayLanguage {
    let state = app.state::<AppState>();
    let configured_language = state.config_snapshot().language;
    resolve_tray_language(&configured_language, sys_locale::get_locale().as_deref())
}

fn system_locale_to_tray_language(system_locale: Option<&str>) -> TrayLanguage {
    let normalized = system_locale.unwrap_or_default().trim().to_ascii_lowercase();
    if normalized.starts_with("zh") {
        TrayLanguage::Zh
    } else {
        TrayLanguage::En
    }
}

fn tray_labels_for(language: TrayLanguage) -> TrayLabels {
    match language {
        TrayLanguage::En => TrayLabels {
            open_window: "Open Window",
            navigate: "Navigate",
            notes: "Notes",
            account: "Account",
            quit_app: "Quit Notes Studio",
        },
        TrayLanguage::Zh => TrayLabels {
            open_window: "打开窗口",
            navigate: "导航",
            notes: "笔记",
            account: "账户",
            quit_app: "退出 Notes Studio",
        },
    }
}

fn build_tray_menu<R: Runtime>(
    app: &AppHandle<R>,
    language: TrayLanguage,
) -> DesktopResult<Menu<R>> {
    let labels = tray_labels_for(language);
    let navigate_menu = SubmenuBuilder::new(app, labels.navigate)
        .text(TRAY_MENU_ID_OPEN_NOTES, labels.notes)
        .text(TRAY_MENU_ID_OPEN_ACCOUNT, labels.account)
        .build()
        .map_err(|error| error.to_string())?;

    MenuBuilder::new(app)
        .text(TRAY_MENU_ID_SHOW_WINDOW, labels.open_window)
        .separator()
        .item(&navigate_menu)
        .separator()
        .text(TRAY_MENU_ID_QUIT_APP, labels.quit_app)
        .build()
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::{
        build_tray_menu_spec, resolve_tray_language, should_prevent_main_window_close,
        tray_action_for_menu_id, TrayAction, TrayLanguage, TrayMenuEntry, TRAY_MENU_ID_QUIT_APP,
        TRAY_MENU_ID_SHOW_WINDOW,
    };

    #[test]
    fn close_request_is_intercepted_until_shutdown_is_requested() {
        assert!(should_prevent_main_window_close(false));
        assert!(!should_prevent_main_window_close(true));
    }

    #[test]
    fn tray_menu_promotes_open_window_to_the_first_level() {
        let spec = build_tray_menu_spec(TrayLanguage::En);

        assert_eq!(
            spec.first(),
            Some(&TrayMenuEntry::Item {
                id: TRAY_MENU_ID_SHOW_WINDOW,
                label: "Open Window".to_string(),
            })
        );
        assert!(spec.iter().any(|entry| {
            matches!(
                entry,
                TrayMenuEntry::Submenu { label, items }
                    if label == "Navigate"
                        && items.iter().any(|item| matches!(
                            item,
                            TrayMenuEntry::Item { id, label }
                                if *id == "open_notes" && label == "Notes"
                        ))
                        && items.iter().any(|item| matches!(
                            item,
                            TrayMenuEntry::Item { id, label }
                                if *id == "open_account" && label == "Account"
                        ))
            )
        }));
    }

    #[test]
    fn tray_language_uses_explicit_preference_before_system_locale() {
        assert_eq!(
            resolve_tray_language("system", Some("zh-CN")),
            TrayLanguage::Zh
        );
        assert_eq!(resolve_tray_language("en-US", Some("zh-CN")), TrayLanguage::En);
    }

    #[test]
    fn tray_menu_labels_localize_to_simplified_chinese() {
        let spec = build_tray_menu_spec(TrayLanguage::Zh);

        assert_eq!(
            spec.first(),
            Some(&TrayMenuEntry::Item {
                id: TRAY_MENU_ID_SHOW_WINDOW,
                label: "打开窗口".to_string(),
            })
        );
        assert!(spec.iter().any(|entry| {
            matches!(
                entry,
                TrayMenuEntry::Submenu { label, .. } if label == "导航"
            )
        }));
        assert!(spec.iter().any(|entry| {
            matches!(
                entry,
                TrayMenuEntry::Item { id, label }
                    if *id == TRAY_MENU_ID_QUIT_APP
                        && label == "退出 Notes Studio"
            )
        }));
    }

    #[test]
    fn tray_menu_ids_map_to_expected_actions() {
        assert_eq!(
            tray_action_for_menu_id(TRAY_MENU_ID_SHOW_WINDOW),
            Some(TrayAction::ShowWindow)
        );
        assert_eq!(
            tray_action_for_menu_id("open_notes"),
            Some(TrayAction::OpenRoute("/notes"))
        );
        assert_eq!(
            tray_action_for_menu_id("open_account"),
            Some(TrayAction::OpenRoute("/account"))
        );
        assert_eq!(
            tray_action_for_menu_id(TRAY_MENU_ID_QUIT_APP),
            Some(TrayAction::QuitApp)
        );
        assert_eq!(tray_action_for_menu_id("missing"), None);
    }
}
