import { startTransition, useEffect, useState } from 'react';
import { AppRoot } from '@sdkwork/notes-shell';
import { getDesktopWindow, isTauriRuntime } from '../runtime';
import { DesktopProviders } from '../providers/DesktopProviders';
import { DesktopTrayRouteBridge } from './DesktopTrayRouteBridge';
import { DesktopStartupScreen } from './DesktopStartupScreen';
import type { StartupAppearanceSnapshot } from './startupAppearance';
export { applyStartupAppearanceHints } from './startupAppearance';

const STARTUP_MINIMUM_VISIBLE_MS = 180;

function waitFor(ms: number) {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

export interface DesktopBootstrapAppProps {
  initialAppearance: StartupAppearanceSnapshot;
  hasNativeRuntime?: boolean;
}

async function prepareDesktopWindowForStartup() {
  const desktopWindow = getDesktopWindow();
  if (!desktopWindow) {
    return null;
  }

  await desktopWindow.setFullscreen(false).catch(() => {
    // Ignore fullscreen reset failures and continue startup reveal.
  });

  await desktopWindow
    .isMaximized()
    .then((isMaximizedWindow) => {
      if (!isMaximizedWindow) {
        return;
      }

      return desktopWindow.unmaximize();
    })
    .catch(() => {
      // Ignore maximize reset failures and continue startup reveal.
    });

  return desktopWindow;
}

export function DesktopBootstrapApp({
  initialAppearance,
  hasNativeRuntime,
}: DesktopBootstrapAppProps) {
  const [shouldRenderShell, setShouldRenderShell] = useState(false);
  const [isStartupVisible, setIsStartupVisible] = useState(true);
  const [startupStatus, setStartupStatus] = useState<'booting' | 'ready'>('booting');

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    const nativeRuntimeEnabled = hasNativeRuntime ?? isTauriRuntime();

    void (async () => {
      await waitForNextPaint();
      await waitForNextPaint();

      if (!cancelled && nativeRuntimeEnabled) {
        const desktopWindow = await prepareDesktopWindowForStartup();
        if (desktopWindow) {
          await desktopWindow.show().catch(() => {
            // Startup reveal is best-effort in web and desktop dev reload flows.
          });
          await desktopWindow.setFocus().catch(() => {
            // Focus is best-effort after the custom desktop shell has mounted.
          });
        }
      }

      if (cancelled) {
        return;
      }

      startTransition(() => {
        setShouldRenderShell(true);
        setStartupStatus('ready');
      });

      await waitForNextPaint();
      await waitForNextPaint();

      if (cancelled) {
        return;
      }

      await waitFor(Math.max(0, STARTUP_MINIMUM_VISIBLE_MS - (Date.now() - startedAt)));
      if (!cancelled) {
        setIsStartupVisible(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasNativeRuntime]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {shouldRenderShell ? (
        <div className="h-full w-full">
          <DesktopProviders>
            <DesktopTrayRouteBridge />
            <AppRoot />
          </DesktopProviders>
        </div>
      ) : null}
      <DesktopStartupScreen
        appearance={initialAppearance}
        isVisible={isStartupVisible}
        status={startupStatus}
      />
    </div>
  );
}
