import { spawnSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isDirectCliExecution } from './script-entry.mjs';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 1430;
const RETRY_COUNT = 5;
const RETRY_DELAY_MS = 1000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeCommandLineFragment(value) {
  return String(value ?? '')
    .replaceAll('/', '\\')
    .replaceAll('"', '')
    .toLowerCase();
}

export function isManagedNotesDesktopDevPortBlocker({
  commandLine,
  workspaceRoot: targetWorkspaceRoot = workspaceRoot,
  port = DEFAULT_PORT,
} = {}) {
  const normalizedCommandLine = normalizeCommandLineFragment(commandLine);
  const normalizedWorkspaceRoot = normalizeCommandLineFragment(
    path.resolve(targetWorkspaceRoot),
  );

  return (
    normalizedCommandLine.includes(normalizedWorkspaceRoot) &&
    normalizedCommandLine.includes('sdkwork-notes-desktop') &&
    normalizedCommandLine.includes('vite') &&
    normalizedCommandLine.includes(`--port ${String(port)}`) &&
    normalizedCommandLine.includes('--strictport')
  );
}

function runWindowsPowerShell(command) {
  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', command],
    {
      encoding: 'utf8',
      windowsHide: true,
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    const stderr = String(result.stderr ?? '').trim();
    throw new Error(stderr || `PowerShell command failed with exit ${result.status}.`);
  }

  return String(result.stdout ?? '');
}

function listWindowsListeningProcessIds(targetPort) {
  const rawOutput = runWindowsPowerShell(
    `Get-NetTCPConnection -LocalPort ${targetPort} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess`,
  );

  return rawOutput
    .split(/\r?\n/)
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value, index, items) => Number.isInteger(value) && value > 0 && items.indexOf(value) === index);
}

function readWindowsProcessCommandLine(processId) {
  return runWindowsPowerShell(
    `Get-CimInstance Win32_Process -Filter "ProcessId = ${processId}" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CommandLine`,
  ).trim();
}

function killWindowsProcessTree(processId) {
  const result = spawnSync('taskkill.exe', ['/PID', String(processId), '/T', '/F'], {
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    const stderr = String(result.stderr ?? '').trim();
    throw new Error(stderr || `taskkill failed with exit ${result.status}.`);
  }
}

function clearManagedWindowsBlockers(port) {
  if (process.platform !== 'win32') {
    return false;
  }

  let cleared = false;

  for (const processId of listWindowsListeningProcessIds(port)) {
    const commandLine = readWindowsProcessCommandLine(processId);
    if (!isManagedNotesDesktopDevPortBlocker({
      commandLine,
      workspaceRoot,
      port,
    })) {
      continue;
    }

    console.warn(
      `Removing stale Notes desktop dev server on ${DEFAULT_HOST}:${port}: pid ${processId} (${commandLine})`,
    );
    killWindowsProcessTree(processId);
    cleared = true;
  }

  return cleared;
}

function tryBindPort(host, port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error) => {
      server.close(() => {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
          resolve(false);
          return;
        }

        reject(error);
      });
    });

    server.listen(port, host, () => {
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }

        resolve(true);
      });
    });
  });
}

export async function ensureTauriDevPortFree({
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
} = {}) {
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port "${port}".`);
  }

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    const available = await tryBindPort(host, port);
    if (available) {
      console.log(`Tauri dev port ${host}:${port} is available.`);
      return;
    }

    if (clearManagedWindowsBlockers(port)) {
      await wait(RETRY_DELAY_MS);
      continue;
    }

    if (attempt < RETRY_COUNT) {
      await wait(RETRY_DELAY_MS);
    }
  }

  throw new Error(`Tauri dev port ${host}:${port} is already in use. Stop the existing server and retry.`);
}

if (isDirectCliExecution({ importMetaUrl: import.meta.url })) {
  const [hostArg = DEFAULT_HOST, portArg = String(DEFAULT_PORT)] = process.argv.slice(2);
  const port = Number(portArg);

  ensureTauriDevPortFree({
    host: hostArg,
    port,
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
