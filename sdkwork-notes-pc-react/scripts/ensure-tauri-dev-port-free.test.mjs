import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { isManagedNotesDesktopDevPortBlocker } from './ensure-tauri-dev-port-free.mjs';

test('isManagedNotesDesktopDevPortBlocker matches stale notes desktop vite servers for the managed dev port', () => {
  const workspaceRoot = path.join(
    'D:',
    'javasource',
    'spring-ai-plus',
    'spring-ai-plus-business',
    'apps',
    'sdkwork-notes',
    'sdkwork-notes-pc-react',
  );
  const commandLine = 'node "D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\sdkwork-notes\\sdkwork-notes-pc-react\\packages\\sdkwork-notes-desktop\\node_modules\\.bin\\\\..\\vite\\bin\\vite.js" --host 127.0.0.1 --port 1430 --strictPort';

  assert.equal(
    isManagedNotesDesktopDevPortBlocker({
      commandLine,
      workspaceRoot,
      port: 1430,
    }),
    true,
  );
});

test('isManagedNotesDesktopDevPortBlocker ignores unrelated port listeners', () => {
  assert.equal(
    isManagedNotesDesktopDevPortBlocker({
      commandLine: 'node "C:\\services\\proxy.js" --port 1430',
      workspaceRoot: path.join('D:', 'workspace', 'sdkwork-notes-pc-react'),
      port: 1430,
    }),
    false,
  );
});
