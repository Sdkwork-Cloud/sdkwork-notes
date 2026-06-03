import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { applyDesktopToolchainEnv } from './desktop-toolchain-env.mjs';
import { resolveWorkspaceRootDir } from './prepare-shared-sdk-packages.mjs';
import { normalizeAppMode } from './run-with-app-mode.mjs';
import { isDirectCliExecution } from './script-entry.mjs';

const DEV_HOST = '127.0.0.1';
const DEV_PORT = 1430;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultWorkspaceRoot = path.resolve(__dirname, '..');

function stopChildProcess(child) {
  if (!child.pid) {
    return;
  }

  if (process.platform === 'win32') {
    spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }

  child.kill('SIGTERM');
}

function runCommand(command, args, { cwd, env, label }) {
  return new Promise((resolve, reject) => {
    const useWindowsShell =
      process.platform === 'win32' &&
      ['.cmd', '.bat'].includes(path.extname(command).toLowerCase());
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
      shell: useWindowsShell,
      windowsHide: true,
    });

    let settled = false;
    const signalHandlers = new Map();

    function finalize(callback) {
      return (value) => {
        if (settled) {
          return;
        }

        settled = true;
        for (const [signal, handler] of signalHandlers) {
          process.off(signal, handler);
        }
        callback(value);
      };
    }

    const resolveOnce = finalize(resolve);
    const rejectOnce = finalize(reject);

    for (const signal of ['SIGINT', 'SIGTERM']) {
      const handler = () => {
        stopChildProcess(child);
        rejectOnce(new Error(`${label} interrupted by ${signal}.`));
      };
      signalHandlers.set(signal, handler);
      process.on(signal, handler);
    }

    child.on('error', (error) => {
      rejectOnce(error);
    });

    child.on('close', (code, signal) => {
      if (signal) {
        rejectOnce(new Error(`${label} failed with signal ${signal}.`));
        return;
      }

      if (code === 0) {
        resolveOnce();
        return;
      }

      rejectOnce(new Error(`${label} failed with exit ${code ?? 'unknown'}.`));
    });
  });
}

export function createDesktopTauriDevPlan({
  currentWorkingDir = process.cwd(),
  env = process.env,
  mode,
  runtimePlatform = process.platform,
  windowsCargoBinDir = '',
} = {}) {
  const workspaceRoot = resolveWorkspaceRootDir(currentWorkingDir) || defaultWorkspaceRoot;
  const desktopDir = path.join(workspaceRoot, 'packages', 'sdkwork-notes-desktop');
  const resolvedMode = normalizeAppMode(mode ?? env.SDKWORK_NOTES_APP_MODE, 'development');
  const sharedEnv = applyDesktopToolchainEnv({
    env: {
      ...env,
      SDKWORK_NOTES_APP_MODE: resolvedMode,
      SDKWORK_SHARED_SDK_MODE: 'source',
    },
    platform: runtimePlatform,
    windowsCargoBinDir,
  });

  return {
    workspaceRoot,
    desktopDir,
    host: DEV_HOST,
    port: DEV_PORT,
    env: sharedEnv,
    nodeCommand: process.execPath,
    tauriCommand: runtimePlatform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    tauriArgs: ['exec', 'tauri', 'dev'],
  };
}

export async function runDesktopTauriDev(options = {}) {
  const plan = createDesktopTauriDevPlan(options);

  await runCommand(plan.nodeCommand, ['scripts/prepare-shared-sdk-packages.mjs'], {
    cwd: plan.workspaceRoot,
    env: plan.env,
    label: 'prepare shared sdk packages',
  });
  await runCommand(
    plan.nodeCommand,
    ['scripts/ensure-tauri-dev-port-free.mjs', plan.host, String(plan.port)],
    {
      cwd: plan.workspaceRoot,
      env: plan.env,
      label: 'ensure tauri dev port free',
    },
  );
  await runCommand(plan.tauriCommand, plan.tauriArgs, {
    cwd: plan.desktopDir,
    env: plan.env,
    label: 'pnpm exec tauri dev',
  });
}

export function parseDesktopTauriDevCliArgs(argv = []) {
  const args = Array.isArray(argv) ? [...argv] : [];
  let mode;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--mode') {
      mode = args[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unsupported argument "${token}". Expected only --mode <value>.`);
  }

  return {
    mode: normalizeAppMode(mode, 'development'),
  };
}

if (isDirectCliExecution({ importMetaUrl: import.meta.url })) {
  runDesktopTauriDev(parseDesktopTauriDevCliArgs(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
