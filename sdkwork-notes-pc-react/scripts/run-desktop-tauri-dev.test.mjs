import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { createDesktopTauriDevPlan } from './run-desktop-tauri-dev.mjs';

test('createDesktopTauriDevPlan prepares notes desktop tauri dev with source SDK mode and Windows cargo tooling', () => {
  const workspaceRoot = process.cwd();
  const plan = createDesktopTauriDevPlan({
    currentWorkingDir: workspaceRoot,
    runtimePlatform: 'win32',
    windowsCargoBinDir: 'C:\\Users\\admin\\.cargo\\bin',
    env: {
      USERPROFILE: 'C:\\Users\\admin',
      PATH: 'C:\\Windows\\System32',
    },
  });

  assert.equal(plan.workspaceRoot, workspaceRoot);
  assert.equal(
    plan.desktopDir,
    path.join(workspaceRoot, 'packages', 'sdkwork-notes-desktop'),
  );
  assert.equal(plan.host, '127.0.0.1');
  assert.equal(plan.port, 1430);
  assert.equal(plan.env.SDKWORK_SHARED_SDK_MODE, 'source');
  assert.match(plan.env.PATH, /^C:\\Users\\admin\\\.cargo\\bin;/);
  assert.equal(plan.tauriCommand, 'pnpm.cmd');
  assert.deepEqual(plan.tauriArgs, ['exec', 'tauri', 'dev']);
});
