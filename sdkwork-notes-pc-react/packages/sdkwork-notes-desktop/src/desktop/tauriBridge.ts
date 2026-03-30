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
