import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAppModeCommandPlan,
  parseAppModeCliArgs,
} from './run-with-app-mode.mjs';

test('parseAppModeCliArgs extracts explicit mode and forwarded command arguments', () => {
  const parsed = parseAppModeCliArgs([
    'test',
    '--',
    'pnpm',
    'exec',
    'vite',
    '--host',
    '127.0.0.1',
  ]);

  assert.deepEqual(parsed, {
    mode: 'test',
    command: 'pnpm',
    args: ['exec', 'vite', '--host', '127.0.0.1'],
  });
});

test('createAppModeCommandPlan injects SDKWORK_NOTES_APP_MODE into the spawned environment', () => {
  const plan = createAppModeCommandPlan({
    mode: 'production',
    command: 'pnpm',
    args: ['exec', 'vite', 'build'],
    env: { CI: 'true' },
  });

  assert.equal(plan.command, 'pnpm');
  assert.deepEqual(plan.args, ['exec', 'vite', 'build']);
  assert.equal(plan.env.CI, 'true');
  assert.equal(plan.env.SDKWORK_NOTES_APP_MODE, 'production');
});

test('createAppModeCommandPlan falls back to development when the wrapper is invoked without an explicit mode', () => {
  const plan = createAppModeCommandPlan({
    command: 'pnpm',
    args: ['exec', 'vite'],
    env: {},
  });

  assert.equal(plan.env.SDKWORK_NOTES_APP_MODE, 'development');
});
