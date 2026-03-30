import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSharedSdkModeCommandPlan,
  parseSharedSdkModeCliArgs,
} from './run-with-shared-sdk-mode.mjs';

test('parseSharedSdkModeCliArgs extracts sdk mode and forwarded command arguments', () => {
  const parsed = parseSharedSdkModeCliArgs([
    'source',
    '--',
    'pnpm',
    '--filter',
    '@sdkwork/notes-desktop',
    'run',
    'tauri:dev',
  ]);

  assert.deepEqual(parsed, {
    mode: 'source',
    command: 'pnpm',
    args: ['--filter', '@sdkwork/notes-desktop', 'run', 'tauri:dev'],
  });
});

test('createSharedSdkModeCommandPlan injects SDKWORK_SHARED_SDK_MODE into the spawned environment', () => {
  const plan = createSharedSdkModeCommandPlan({
    mode: 'git',
    command: 'node',
    args: ['scripts/run-desktop-release-build.mjs', '--phase', 'bundle'],
    env: { CI: 'true' },
  });

  assert.equal(plan.command, 'node');
  assert.deepEqual(plan.args, ['scripts/run-desktop-release-build.mjs', '--phase', 'bundle']);
  assert.equal(plan.env.CI, 'true');
  assert.equal(plan.env.SDKWORK_SHARED_SDK_MODE, 'git');
});

test('createSharedSdkModeCommandPlan prepends the Windows cargo bin directory for wrapped desktop commands', () => {
  const plan = createSharedSdkModeCommandPlan({
    mode: 'source',
    command: 'pnpm',
    args: ['--filter', '@sdkwork/notes-desktop', 'run', 'tauri:info'],
    runtimePlatform: 'win32',
    windowsCargoBinDir: 'C:\\Users\\admin\\.cargo\\bin',
    env: {
      USERPROFILE: 'C:\\Users\\admin',
      PATH: 'C:\\Windows\\System32',
    },
  });

  assert.match(plan.env.PATH, /^C:\\Users\\admin\\\.cargo\\bin;/);
  assert.equal(plan.env.SDKWORK_SHARED_SDK_MODE, 'source');
});
