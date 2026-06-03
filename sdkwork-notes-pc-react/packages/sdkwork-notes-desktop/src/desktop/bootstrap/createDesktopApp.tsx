import ReactDOM from 'react-dom/client';
import { ensureI18n } from '@sdkwork/notes-i18n';
import type { AppRootProps } from '@sdkwork/notes-shell';
import { installDesktopSessionStoreBridge } from '../sessionBridge';
import { configureDesktopPlatformBridge } from '../tauriBridge';
import { waitForTauriRuntime } from '../runtime';
import { DesktopBootstrapApp } from './DesktopBootstrapApp';
import {
  applyStartupAppearanceHints,
  readCurrentStartupAppearanceSnapshot,
} from './startupAppearance';

export interface CreateDesktopAppOptions {
  appRootProps?: AppRootProps;
}

export async function createDesktopApp(options: CreateDesktopAppOptions = {}) {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element #root was not found.');
  }

  const initialAppearance = readCurrentStartupAppearanceSnapshot();
  applyStartupAppearanceHints(initialAppearance);
  const hasNativeRuntime = await waitForTauriRuntime();
  if (hasNativeRuntime) {
    configureDesktopPlatformBridge();
    await installDesktopSessionStoreBridge();
  }
  await ensureI18n();

  ReactDOM.createRoot(rootElement).render(
    <DesktopBootstrapApp
      appRootProps={options.appRootProps}
      hasNativeRuntime={hasNativeRuntime}
      initialAppearance={initialAppearance}
    />,
  );
}
