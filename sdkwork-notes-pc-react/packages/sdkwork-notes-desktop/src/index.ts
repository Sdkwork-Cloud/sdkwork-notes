export { createDesktopApp } from './desktop/bootstrap/createDesktopApp';
export { DESKTOP_COMMANDS, DESKTOP_EVENTS } from './desktop/catalog';
export {
  DesktopBridgeError,
  getDesktopWindow,
  invokeDesktopCommand,
  isTauriRuntime,
  listenDesktopEvent,
  runDesktopOrFallback,
  waitForTauriRuntime,
} from './desktop/runtime';
export {
  configureDesktopPlatformBridge,
  closeWindow,
  desktopNotesApi,
  getAppInfo,
  getRuntimeInfo,
  isWindowMaximized,
  maximizeWindow,
  minimizeWindow,
  requestExplicitQuit,
  restoreWindow,
  setAppLanguage,
  showMainWindow,
  subscribeWindowMaximized,
  subscribeTrayNavigation,
} from './desktop/tauriBridge';
