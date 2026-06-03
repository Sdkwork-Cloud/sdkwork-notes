import { spawnSync } from 'node:child_process';
import { isDirectCliExecution } from './script-entry.mjs';

const VALID_APP_MODES = new Set(['development', 'test', 'production']);

export function normalizeAppMode(mode, fallback = 'development') {
  const normalizedMode = String(mode ?? '').trim().toLowerCase();
  if (normalizedMode === 'dev') {
    return 'development';
  }
  if (normalizedMode === 'prod') {
    return 'production';
  }
  if (VALID_APP_MODES.has(normalizedMode)) {
    return normalizedMode;
  }
  return fallback;
}

export function createAppModeCommandPlan({
  mode,
  command,
  args = [],
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  const normalizedCommand = String(command ?? '').trim();
  if (normalizedCommand.length === 0) {
    throw new Error('Missing command for app mode wrapper.');
  }

  const resolvedMode = normalizeAppMode(mode ?? env.SDKWORK_NOTES_APP_MODE, 'development');

  return {
    cwd,
    command: normalizedCommand,
    args,
    env: {
      ...env,
      SDKWORK_NOTES_APP_MODE: resolvedMode,
    },
  };
}

export function parseAppModeCliArgs(argv) {
  const [mode = '', separator = '', command = '', ...args] = argv;
  if (separator !== '--') {
    throw new Error(
      'Expected CLI usage: node scripts/run-with-app-mode.mjs <development|test|production> -- <command> [...args]',
    );
  }

  return {
    mode,
    command,
    args,
  };
}

export function runAppModeCommand(plan) {
  const result = spawnSync(plan.command, plan.args, {
    cwd: plan.cwd,
    env: plan.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(
      `${plan.command} ${plan.args.join(' ')} failed with status ${result.status ?? 'unknown'}`,
    );
  }
}

if (isDirectCliExecution({ importMetaUrl: import.meta.url })) {
  const cliOptions = parseAppModeCliArgs(process.argv.slice(2));
  runAppModeCommand(createAppModeCommandPlan(cliOptions));
}
