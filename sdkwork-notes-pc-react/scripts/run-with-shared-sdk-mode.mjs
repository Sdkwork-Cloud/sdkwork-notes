import { spawnSync } from 'node:child_process';
import { applyDesktopToolchainEnv } from './desktop-toolchain-env.mjs';

const VALID_SHARED_SDK_MODES = new Set(['source', 'git']);

export function createSharedSdkModeCommandPlan({
  mode,
  command,
  args = [],
  cwd = process.cwd(),
  env = process.env,
  runtimePlatform = process.platform,
  windowsCargoBinDir = '',
} = {}) {
  const normalizedMode = String(mode ?? '').trim().toLowerCase();
  if (!VALID_SHARED_SDK_MODES.has(normalizedMode)) {
    throw new Error(
      `Unsupported shared SDK mode "${mode}". Expected one of: source, git.`,
    );
  }

  const normalizedCommand = String(command ?? '').trim();
  if (normalizedCommand.length === 0) {
    throw new Error('Missing command for shared SDK mode wrapper.');
  }

  return {
    cwd,
    command: normalizedCommand,
    args,
    env: applyDesktopToolchainEnv({
      env: {
        ...env,
        SDKWORK_SHARED_SDK_MODE: normalizedMode,
      },
      platform: runtimePlatform,
      windowsCargoBinDir,
    }),
  };
}

export function parseSharedSdkModeCliArgs(argv) {
  const [mode = '', separator = '', command = '', ...args] = argv;
  if (separator !== '--') {
    throw new Error(
      'Expected CLI usage: node scripts/run-with-shared-sdk-mode.mjs <source|git> -- <command> [...args]',
    );
  }

  return {
    mode,
    command,
    args,
  };
}

export function runSharedSdkModeCommand(plan) {
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

if (import.meta.url === `file://${process.argv[1]?.replaceAll('\\', '/')}`) {
  const cliOptions = parseSharedSdkModeCliArgs(process.argv.slice(2));
  runSharedSdkModeCommand(createSharedSdkModeCommandPlan(cliOptions));
}
