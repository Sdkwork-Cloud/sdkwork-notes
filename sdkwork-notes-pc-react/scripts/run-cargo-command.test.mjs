import assert from 'node:assert/strict';
import test from 'node:test';
import { createCargoCommandPlan } from './run-cargo-command.mjs';

test('createCargoCommandPlan preserves cargo args and prepends Windows cargo bin when needed', () => {
  const plan = createCargoCommandPlan({
    args: ['test', '--manifest-path', 'packages/sdkwork-notes-desktop/src-tauri/Cargo.toml'],
    runtimePlatform: 'win32',
    windowsCargoBinDir: 'C:\\Users\\admin\\.cargo\\bin',
    env: {
      PATH: 'C:\\Windows\\System32',
    },
  });

  assert.equal(plan.command, 'cargo');
  assert.deepEqual(plan.args, [
    'test',
    '--manifest-path',
    'packages/sdkwork-notes-desktop/src-tauri/Cargo.toml',
  ]);
  assert.match(plan.env.PATH, /^C:\\Users\\admin\\\.cargo\\bin;/);
});
