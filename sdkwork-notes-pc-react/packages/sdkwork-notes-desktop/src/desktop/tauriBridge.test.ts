import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('tauriBridge source contract', () => {
  it('exposes notes desktop runtime commands and tray route events', () => {
    const desktopRoot = path.dirname(fileURLToPath(import.meta.url));
  const catalogSource = fs.readFileSync(path.join(desktopRoot, 'catalog.ts'), 'utf8');
  const tauriBridgeSource = fs.readFileSync(path.join(desktopRoot, 'tauriBridge.ts'), 'utf8');
  const desktopProvidersSource = fs.readFileSync(
    path.join(desktopRoot, 'providers', 'DesktopProviders.tsx'),
    'utf8',
  );

    expect(catalogSource).toMatch(/appInfo:\s*'app_info'/);
    expect(catalogSource).toMatch(/runtimeInfo:\s*'desktop_runtime_info'/);
    expect(catalogSource).toMatch(/setAppLanguage:\s*'set_app_language'/);
    expect(catalogSource).toMatch(/showMainWindow:\s*'show_main_window'/);
    expect(catalogSource).toMatch(/requestExplicitQuit:\s*'request_explicit_quit'/);
    expect(catalogSource).toMatch(/trayNavigate:\s*'tray:\/\/navigate'/);

    expect(tauriBridgeSource).toMatch(/export async function getAppInfo/);
    expect(tauriBridgeSource).toMatch(/export async function getRuntimeInfo/);
    expect(tauriBridgeSource).toMatch(/export async function setAppLanguage/);
    expect(tauriBridgeSource).toMatch(/export async function showMainWindow/);
    expect(tauriBridgeSource).toMatch(/export async function requestExplicitQuit/);
    expect(tauriBridgeSource).toMatch(
      /catalog:\s*\{\s*commands:\s*DESKTOP_COMMANDS,\s*events:\s*DESKTOP_EVENTS/s,
    );

    expect(desktopProvidersSource).toMatch(/setAppLanguage\(/);
    expect(desktopProvidersSource).toMatch(/data-app-platform/);
  });
});
