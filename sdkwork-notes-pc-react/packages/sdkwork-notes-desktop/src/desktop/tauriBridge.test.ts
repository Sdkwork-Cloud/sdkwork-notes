import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('tauriBridge source contract', () => {
  it('exposes notes desktop runtime commands, custom window controls, and tray route events', () => {
    const desktopRoot = path.dirname(fileURLToPath(import.meta.url));
    const catalogSource = fs.readFileSync(path.join(desktopRoot, 'catalog.ts'), 'utf8');
    const tauriBridgeSource = fs.readFileSync(path.join(desktopRoot, 'tauriBridge.ts'), 'utf8');
    const desktopProvidersSource = fs.readFileSync(
      path.join(desktopRoot, 'providers', 'DesktopProviders.tsx'),
      'utf8',
    );
    const desktopIndexSource = fs.readFileSync(path.join(desktopRoot, '..', 'index.ts'), 'utf8');
    const tauriConfigSource = fs.readFileSync(
      path.join(desktopRoot, '..', '..', 'src-tauri', 'tauri.conf.json'),
      'utf8',
    );
    const defaultCapabilitySource = fs.readFileSync(
      path.join(desktopRoot, '..', '..', 'src-tauri', 'capabilities', 'default.json'),
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
    expect(tauriBridgeSource).toMatch(/export async function minimizeWindow/);
    expect(tauriBridgeSource).toMatch(/export async function maximizeWindow/);
    expect(tauriBridgeSource).toMatch(/export async function restoreWindow/);
    expect(tauriBridgeSource).toMatch(/export async function isWindowMaximized/);
    expect(tauriBridgeSource).toMatch(/export async function closeWindow/);
    expect(tauriBridgeSource).toMatch(/export async function subscribeWindowMaximized/);
    expect(tauriBridgeSource).toMatch(/currentWindow\.minimize\(\)/);
    expect(tauriBridgeSource).toMatch(/currentWindow\.maximize\(\)/);
    expect(tauriBridgeSource).toMatch(/currentWindow\.unmaximize\(\)/);
    expect(tauriBridgeSource).toMatch(/currentWindow\.hide\(\)/);
    expect(tauriBridgeSource).toMatch(/currentWindow\.onResized/);
    expect(tauriBridgeSource).toMatch(/currentWindow\.onMoved/);
    expect(tauriBridgeSource).toMatch(
      /catalog:\s*\{\s*commands:\s*DESKTOP_COMMANDS,\s*events:\s*DESKTOP_EVENTS/s,
    );

    expect(desktopProvidersSource).toMatch(/setAppLanguage\(/);
    expect(desktopProvidersSource).toMatch(/data-app-platform/);

    expect(desktopIndexSource).toMatch(/minimizeWindow/);
    expect(desktopIndexSource).toMatch(/maximizeWindow/);
    expect(desktopIndexSource).toMatch(/restoreWindow/);
    expect(desktopIndexSource).toMatch(/isWindowMaximized/);
    expect(desktopIndexSource).toMatch(/subscribeWindowMaximized/);
    expect(desktopIndexSource).toMatch(/closeWindow/);

    expect(tauriConfigSource).toMatch(/"decorations":\s*false/);
    expect(tauriConfigSource).toMatch(/"visible":\s*false/);

    expect(defaultCapabilitySource).toMatch(/core:window:allow-start-dragging/);
    expect(defaultCapabilitySource).toMatch(/core:window:allow-internal-toggle-maximize/);
    expect(defaultCapabilitySource).toMatch(/core:window:allow-is-fullscreen/);
    expect(defaultCapabilitySource).toMatch(/core:window:allow-set-fullscreen/);
    expect(defaultCapabilitySource).toMatch(/core:window:allow-toggle-maximize/);
  });
});
