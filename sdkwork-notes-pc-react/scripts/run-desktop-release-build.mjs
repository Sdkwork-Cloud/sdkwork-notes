import { spawnSync } from 'node:child_process';
import path from 'node:path';
import {
  buildDesktopReleaseEnv,
  resolveDesktopReleaseTarget,
} from './release/desktop-targets.mjs';
import { isDirectCliExecution } from './script-entry.mjs';

export function createDesktopReleaseBuildPlan({
  phase = 'bundle',
  targetTriple,
  platform,
  arch,
  cwd = process.cwd(),
  env = process.env,
  runtimePlatform = process.platform,
  windowsCargoBinDir = '',
} = {}) {
  const target = resolveDesktopReleaseTarget({
    targetTriple,
    platform,
    arch,
    env,
  });
  const mergedEnv = buildDesktopReleaseEnv({
    env,
    targetTriple: target.targetTriple,
    runtimePlatform,
    windowsCargoBinDir,
  });

  if (phase === 'bundle') {
    const args = ['exec', 'tauri', 'build', '--target', target.targetTriple];
    if (target.platform === 'macos') {
      args.push('--bundles', 'app');
    }

    return {
      phase,
      workspaceRoot: cwd,
      cwd: path.join(cwd, 'packages', 'sdkwork-notes-desktop'),
      command: 'pnpm',
      args,
      env: mergedEnv,
      target,
    };
  }

  if (phase === 'info') {
    return {
      phase,
      workspaceRoot: cwd,
      cwd: path.join(cwd, 'packages', 'sdkwork-notes-desktop'),
      command: 'pnpm',
      args: ['exec', 'tauri', 'info'],
      env: mergedEnv,
      target,
    };
  }

  throw new Error(`Unsupported desktop release phase: ${phase}`);
}

function prepareWorkspaceForRelease(plan) {
  if (plan.phase !== 'bundle') {
    return;
  }

  const result = spawnSync('node', ['scripts/prepare-shared-sdk-packages.mjs'], {
    cwd: plan.workspaceRoot,
    env: plan.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(
      `node scripts/prepare-shared-sdk-packages.mjs failed with status ${result.status ?? 'unknown'}`,
    );
  }
}

function runPlan(plan) {
  prepareWorkspaceForRelease(plan);

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

function parseCliArgs(argv) {
  const values = {
    phase: 'bundle',
    targetTriple: '',
    platform: '',
    arch: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const nextValue = argv[index + 1] ?? '';
    if (token === '--phase') {
      values.phase = nextValue || values.phase;
      index += 1;
    } else if (token === '--target') {
      values.targetTriple = nextValue;
      index += 1;
    } else if (token === '--platform') {
      values.platform = nextValue;
      index += 1;
    } else if (token === '--arch') {
      values.arch = nextValue;
      index += 1;
    }
  }

  return values;
}

if (isDirectCliExecution({ importMetaUrl: import.meta.url })) {
  const options = parseCliArgs(process.argv.slice(2));
  runPlan(createDesktopReleaseBuildPlan(options));
}
