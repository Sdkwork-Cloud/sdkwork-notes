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
  desktopNotesApi,
  getAppInfo,
  getRuntimeInfo,
  requestExplicitQuit,
  setAppLanguage,
  showMainWindow,
  subscribeTrayNavigation,
} from './desktop/tauriBridge';
