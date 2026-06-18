import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('desktop session bridge freezes native session commands and startup hydration wiring', () => {
  const catalogSource = read('packages/sdkwork-notes-pc-desktop/src/desktop/catalog.ts');
  const tauriBridgeSource = read('packages/sdkwork-notes-pc-desktop/src/desktop/tauriBridge.ts');
  const desktopIndexSource = read('packages/sdkwork-notes-pc-desktop/src/index.ts');
  const desktopBootstrapSource = read('packages/sdkwork-notes-pc-desktop/src/desktop/bootstrap/createDesktopApp.tsx');
  const tauriBootstrapSource = read('packages/sdkwork-notes-pc-desktop/src-tauri/src/app/bootstrap.rs');
  const tauriCommandsSource = read('packages/sdkwork-notes-pc-desktop/src-tauri/src/commands/mod.rs');

  assert.match(catalogSource, /readSessionState:\s*'read_session_state'/);
  assert.match(catalogSource, /writeSessionState:\s*'write_session_state'/);
  assert.match(catalogSource, /clearSessionState:\s*'clear_session_state'/);

  assert.match(tauriBridgeSource, /export async function readDesktopSessionState/);
  assert.match(tauriBridgeSource, /export async function writeDesktopSessionState/);
  assert.match(tauriBridgeSource, /export async function clearDesktopSessionState/);

  assert.match(desktopIndexSource, /readDesktopSessionState/);
  assert.match(desktopIndexSource, /writeDesktopSessionState/);
  assert.match(desktopIndexSource, /clearDesktopSessionState/);

  assert.match(desktopBootstrapSource, /installDesktopSessionStoreBridge/);

  assert.match(tauriCommandsSource, /pub mod session_state;/);
  assert.match(tauriBootstrapSource, /commands::session_state::read_session_state/);
  assert.match(tauriBootstrapSource, /commands::session_state::write_session_state/);
  assert.match(tauriBootstrapSource, /commands::session_state::clear_session_state/);
});
