import { DESKTOP_COMMANDS, DESKTOP_EVENTS } from './catalog';
import {
  getDesktopWindow,
  invokeDesktopCommand,
  isTauriRuntime,
  listenDesktopEvent,
  runDesktopOrFallback,
  type RuntimeEventUnsubscribe,
} from './runtime';

declare global {
  interface Window {
    __NOTES_DESKTOP_API__?: typeof desktopNotesApi;
  }
}

export interface DesktopAppInfo {
  name: string;
  version: string;
  target: string;
  platform: string;
  arch: string;
}

export interface DesktopPublicAppConfig {
  language: string;
}

export interface DesktopAppPaths {
  appDataDir: string;
  appConfigFile: string;
}

export interface DesktopRuntimeInfo {
  app: DesktopAppInfo;
  config: DesktopPublicAppConfig;
  paths: DesktopAppPaths;
}

export interface TrayNavigatePayload {
  route: string;
}

export async function getAppInfo(): Promise<DesktopAppInfo | null> {
  return runDesktopOrFallback(
    'app.getInfo',
    () =>
      invokeDesktopCommand<DesktopAppInfo>(DESKTOP_COMMANDS.appInfo, undefined, {
        operation: 'app.getInfo',
      }),
    async () => null,
  );
}

export async function getRuntimeInfo(): Promise<DesktopRuntimeInfo | null> {
  return runDesktopOrFallback(
    'app.getRuntimeInfo',
    () =>
      invokeDesktopCommand<DesktopRuntimeInfo>(DESKTOP_COMMANDS.runtimeInfo, undefined, {
        operation: 'app.getRuntimeInfo',
      }),
    async () => null,
  );
}

export async function setAppLanguage(language: string): Promise<void> {
  await runDesktopOrFallback(
    'app.setLanguage',
    () =>
      invokeDesktopCommand<void>(
        DESKTOP_COMMANDS.setAppLanguage,
        { language },
        { operation: 'app.setLanguage' },
      ),
    async () => {},
  );
}

export async function showMainWindow(): Promise<void> {
  await runDesktopOrFallback(
    'window.showMainWindow',
    () =>
      invokeDesktopCommand<void>(DESKTOP_COMMANDS.showMainWindow, undefined, {
        operation: 'window.showMainWindow',
      }),
    async () => {
      window.focus();
    },
  );
}

export async function requestExplicitQuit(): Promise<void> {
  await runDesktopOrFallback(
    'window.requestExplicitQuit',
    () =>
      invokeDesktopCommand<void>(DESKTOP_COMMANDS.requestExplicitQuit, undefined, {
        operation: 'window.requestExplicitQuit',
      }),
    async () => {
      window.close();
    },
  );
}

export async function minimizeWindow(): Promise<void> {
  const currentWindow = getDesktopWindow();
  if (!currentWindow) {
    return;
  }

  await currentWindow.minimize();
}

export async function maximizeWindow(): Promise<void> {
  const currentWindow = getDesktopWindow();
  if (!currentWindow) {
    return;
  }

  if (await currentWindow.isFullscreen()) {
    await currentWindow.setFullscreen(false);
  }

  await currentWindow.maximize();
}

export async function restoreWindow(): Promise<void> {
  const currentWindow = getDesktopWindow();
  if (!currentWindow) {
    return;
  }

  const [isFullscreenWindow, isMaximizedWindow, isMinimizedWindow, isHiddenWindow] =
    await Promise.all([
      currentWindow.isFullscreen(),
      currentWindow.isMaximized(),
      currentWindow.isMinimized(),
      currentWindow.isVisible().then((isVisibleWindow) => !isVisibleWindow),
    ]);

  if (isHiddenWindow) {
    await currentWindow.show();
  }

  if (isFullscreenWindow) {
    await currentWindow.setFullscreen(false);
  }

  if (isMinimizedWindow) {
    await currentWindow.unminimize();
  }

  if (isMaximizedWindow) {
    await currentWindow.unmaximize();
  }

  if (isFullscreenWindow || isMinimizedWindow || isHiddenWindow) {
    await currentWindow.setFocus().catch(() => {
      // Focus is best-effort after restoring window visibility.
    });
  }
}

export async function isWindowMaximized(): Promise<boolean> {
  const currentWindow = getDesktopWindow();
  if (!currentWindow) {
    return false;
  }

  const [isFullscreenWindow, isMaximizedWindow] = await Promise.all([
    currentWindow.isFullscreen(),
    currentWindow.isMaximized(),
  ]);

  return isFullscreenWindow || isMaximizedWindow;
}

export async function subscribeWindowMaximized(
  listener: (isMaximized: boolean) => void,
): Promise<RuntimeEventUnsubscribe> {
  if (!isTauriRuntime()) {
    return () => {};
  }

  const currentWindow = getDesktopWindow();
  if (!currentWindow) {
    return () => {};
  }

  let active = true;

  const emitWindowState = async () => {
    if (!active) {
      return;
    }

    listener(await isWindowMaximized());
  };

  await emitWindowState();

  const unlistenResize = await currentWindow.onResized(() => {
    void emitWindowState();
  });

  const unlistenMove = await currentWindow.onMoved(() => {
    void emitWindowState();
  });

  return async () => {
    active = false;
    await Promise.all([unlistenResize(), unlistenMove()]);
  };
}

export async function closeWindow(): Promise<void> {
  const currentWindow = getDesktopWindow();
  if (!currentWindow) {
    window.close();
    return;
  }

  await currentWindow.hide();
}

export async function subscribeTrayNavigation(
  listener: (payload: TrayNavigatePayload) => void,
): Promise<RuntimeEventUnsubscribe> {
  if (!isTauriRuntime()) {
    return () => {};
  }

  return listenDesktopEvent<TrayNavigatePayload>(DESKTOP_EVENTS.trayNavigate, listener, {
    operation: 'tray.navigate',
  });
}

export const desktopNotesApi = {
  catalog: {
    commands: DESKTOP_COMMANDS,
    events: DESKTOP_EVENTS,
  },
  meta: {
    isTauriRuntime,
    getDesktopWindow,
  },
  app: {
    getInfo: getAppInfo,
    getRuntimeInfo,
    setLanguage: setAppLanguage,
  },
  window: {
    showMainWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    isWindowMaximized,
    subscribeWindowMaximized,
    closeWindow,
    requestExplicitQuit,
  },
  tray: {
    subscribeNavigation: subscribeTrayNavigation,
  },
};

export function configureDesktopPlatformBridge() {
  if (typeof window === 'undefined') {
    return;
  }

  window.__NOTES_DESKTOP_API__ = desktopNotesApi;
}
