import { AppRoot } from '@sdkwork/notes-shell';
import { DesktopProviders } from '../providers/DesktopProviders';
import { DesktopTrayRouteBridge } from './DesktopTrayRouteBridge';

export function applyStartupAppearanceHints() {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('data-app-platform', 'desktop');
  document.body.style.backgroundColor = '#f5f3ee';
  document.body.style.color = '#17130f';
}

export function DesktopBootstrapApp() {
  return (
    <DesktopProviders>
      <DesktopTrayRouteBridge />
      <AppRoot />
    </DesktopProviders>
  );
}
