import React from 'react';
import ReactDOM from 'react-dom/client';
import { ensureI18n } from '@sdkwork/notes-i18n';
import { configureDesktopPlatformBridge } from '../tauriBridge';
import {
  applyStartupAppearanceHints,
  DesktopBootstrapApp,
} from './DesktopBootstrapApp';

export async function createDesktopApp() {
  applyStartupAppearanceHints();
  configureDesktopPlatformBridge();
  await ensureI18n();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <DesktopBootstrapApp />
    </React.StrictMode>,
  );
}
