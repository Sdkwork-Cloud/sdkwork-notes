import ReactDOM from 'react-dom/client';
import { ensureI18n } from '@sdkwork/notes-i18n';
import { configureDesktopPlatformBridge } from '../tauriBridge';
import { waitForTauriRuntime } from '../runtime';
import { DesktopBootstrapApp } from './DesktopBootstrapApp';
import {
  applyStartupAppearanceHints,
  readCurrentStartupAppearanceSnapshot,
} from './startupAppearance';

export async function createDesktopApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element #root was not found.');
  }

  const initialAppearance = readCurrentStartupAppearanceSnapshot();
  applyStartupAppearanceHints(initialAppearance);
  const hasNativeRuntime = await waitForTauriRuntime();
  if (hasNativeRuntime) {
    configureDesktopPlatformBridge();
  }
  await ensureI18n();

  ReactDOM.createRoot(rootElement).render(
    <DesktopBootstrapApp
      hasNativeRuntime={hasNativeRuntime}
      initialAppearance={initialAppearance}
    />,
  );
}
