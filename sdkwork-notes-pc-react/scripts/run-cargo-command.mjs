import { spawnSync } from 'node:child_process';
import { applyDesktopToolchainEnv } from './desktop-toolchain-env.mjs';
import { isDirectCliExecution } from './script-entry.mjs';

export function createCargoCommandPlan({
  args = [],
  cwd = process.cwd(),
  env = process.env,
  runtimePlatform = process.platform,
  windowsCargoBinDir = '',
} = {}) {
  if (!Array.isArray(args) || args.length === 0) {
    throw new Error('Missing cargo arguments. Example: node scripts/run-cargo-command.mjs test --manifest-path <path>.');
  }

  return {
    command: 'cargo',
    args,
    cwd,
    env: applyDesktopToolchainEnv({
      env,
      platform: runtimePlatform,
      windowsCargoBinDir,
    }),
  };
}

export function runCargoCommand(plan) {
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
  runCargoCommand(createCargoCommandPlan({ args: process.argv.slice(2) }));
}
