export const DESKTOP_COMMANDS = {
  appInfo: 'app_info',
  runtimeInfo: 'desktop_runtime_info',
  setAppLanguage: 'set_app_language',
  showMainWindow: 'show_main_window',
  requestExplicitQuit: 'request_explicit_quit',
} as const;

export type DesktopCommandName =
  (typeof DESKTOP_COMMANDS)[keyof typeof DESKTOP_COMMANDS];

export const DESKTOP_EVENTS = {
  appReady: 'app://ready',
  trayNavigate: 'tray://navigate',
} as const;

export type DesktopEventName = (typeof DESKTOP_EVENTS)[keyof typeof DESKTOP_EVENTS];
