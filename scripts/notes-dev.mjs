#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  API_GATEWAY_REPO,
  DEFAULT_DEV_PROFILE_ID,
  listHealthSurfaces,
  listOrchestrationProcesses,
  loadProfile,
  mergeRuntimeEnv,
  PC_REACT_ROOT,
  REPO_ROOT,
  resolveCloudGatewayConfigPath,
  resolveDevProfileId,
  resolveGatewayBind,
  resolveIamDevEnv,
  resolveSurfaceHttpUrl,
  shouldAutostartGateway,
  waitForHttpHealthy,
} from './lib/notes-topology.mjs';

const HEALTH_PATH = '/healthz';
const HEALTH_TIMEOUT_MS = 2000;
const STARTUP_WAIT_MS = 500;
const MAX_STARTUP_ATTEMPTS = 60;

function cargoCommand() {
  return process.platform === 'win32' ? 'cargo.exe' : 'cargo';
}

function pnpmCommand() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function parseArgs(argv) {
  const settings = {
    hosting: 'self-hosted',
    serviceLayout: 'split-services',
    target: 'browser',
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      settings.help = true;
      continue;
    }
    if (arg === '--hosting') {
      settings.hosting = argv[index + 1] ?? settings.hosting;
      index += 1;
      continue;
    }
    if (arg === '--service-layout') {
      settings.serviceLayout = argv[index + 1] ?? settings.serviceLayout;
      index += 1;
      continue;
    }
    if (arg === '--target') {
      settings.target = argv[index + 1] ?? settings.target;
      index += 1;
      continue;
    }
    if (arg === '--topology') {
      throw new Error('--topology is retired; use --hosting (standalone -> self-hosted, cloud -> cloud-hosted)');
    }
    if (arg === '--dry-run') {
      settings.dryRun = true;
    }
  }

  return settings;
}

function printHelp() {
  console.log(`Usage: node scripts/notes-dev.mjs [options]

Topology-aware Notes dev entry. Loads configs/topology profile env via @sdkwork/app-topology.

Options:
  --hosting <self-hosted|cloud-hosted>              Default: self-hosted
  --service-layout <split-services|unified-process> Default: split-services
  --target <browser|desktop>                        Default: browser
  --dry-run                                         Print plan without executing
  --help, -h
`);
}

function spawnProcessEntry(entry) {
  return spawn(entry.command, entry.args, {
    cwd: entry.cwd ?? REPO_ROOT,
    env: entry.env,
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  });
}

function terminateProcessTree(child) {
  if (!child?.pid) {
    return;
  }
  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }
  child.kill();
}

function ensureNotesDataDir() {
  const dataDir = path.join(REPO_ROOT, '.sdkwork', 'notes');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function createNotesApiServerProcess(env) {
  ensureNotesDataDir();
  return {
    label: 'sdkwork-notes-api-server',
    command: cargoCommand(),
    args: ['run', '-p', 'sdkwork-notes-api-server'],
    cwd: REPO_ROOT,
    env,
  };
}

function createPlatformGatewayProcess(env) {
  const hosting = env.SDKWORK_NOTES_HOSTING ?? 'self-hosted';
  const bind = resolveGatewayBind(env, hosting);
  const gatewayConfig = resolveCloudGatewayConfigPath(env, 'development');
  return {
    label: 'sdkwork-api-gateway',
    command: cargoCommand(),
    args: [
      'run',
      '-p',
      'sdkwork-api-gateway-api-server',
      '--bin',
      'sdkwork-api-gateway',
      '--',
      '--config',
      gatewayConfig,
    ],
    cwd: API_GATEWAY_REPO,
    env: {
      ...env,
      SDKWORK_API_GATEWAY_BIND: bind,
      SDKWORK_API_GATEWAY_CONFIG: gatewayConfig,
    },
  };
}

function buildProcessesFromOrchestration(profileId, env, target) {
  const processes = [];

  for (const processDef of listOrchestrationProcesses(profileId)) {
    if (processDef.id === 'platform.api-gateway') {
      if (!shouldAutostartGateway(env)) {
        continue;
      }
      processes.push(createPlatformGatewayProcess(env));
      continue;
    }

    if (processDef.id === 'application.public-ingress') {
      processes.push(createNotesApiServerProcess(env));
      continue;
    }

    if (processDef.id === 'pc-renderer') {
      processes.push(createPcRendererProcess(env, target));
    }
  }

  return processes;
}

function createPcRendererProcess(env, target) {
  const script = target === 'desktop' ? 'tauri:dev' : 'dev';
  return {
    label: `sdkwork-notes-pc-react:${script}`,
    command: pnpmCommand(),
    args: ['run', script],
    cwd: PC_REACT_ROOT,
    env,
  };
}

async function waitForSurfaceHealth(profileId, env) {
  const surfaces = listHealthSurfaces(profileId);
  for (const surfaceId of surfaces) {
    const url = resolveSurfaceHttpUrl(env, surfaceId);
    if (!url) {
      continue;
    }
    const healthUrl = `${url.replace(/\/+$/u, '')}${HEALTH_PATH}`;
    let ready = false;
    for (let attempt = 0; attempt < MAX_STARTUP_ATTEMPTS; attempt += 1) {
      ready = await waitForHttpHealthy(healthUrl, HEALTH_TIMEOUT_MS);
      if (ready) {
        console.log(`[sdkwork-notes] healthy ${surfaceId} (${healthUrl})`);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, STARTUP_WAIT_MS));
    }
    if (!ready) {
      throw new Error(`timed out waiting for ${surfaceId} health at ${healthUrl}`);
    }
  }
}

async function main() {
  const settings = parseArgs(process.argv.slice(2));
  if (settings.help) {
    printHelp();
    process.exit(0);
  }

  const profileId = resolveDevProfileId(settings.hosting, settings.serviceLayout)
    || DEFAULT_DEV_PROFILE_ID;
  const profileEnv = loadProfile(profileId);
  const runtimeEnv = mergeRuntimeEnv(
    process.env,
    profileEnv,
    resolveIamDevEnv(process.env),
    {
      SDKWORK_NOTES_PROFILE_ID: profileId,
      SDKWORK_NOTES_DEV_MODE: '1',
    },
  );

  const processes = buildProcessesFromOrchestration(profileId, runtimeEnv, settings.target);

  if (settings.dryRun) {
    console.log(`[sdkwork-notes] profile=${profileId} target=${settings.target}`);
    for (const entry of processes) {
      console.log(`[${entry.label}] ${entry.command} ${entry.args.join(' ')}`);
    }
    process.exit(0);
  }

  const children = [];
  let shuttingDown = false;

  function shutdown(exceptChild) {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    for (const child of children) {
      if (child !== exceptChild && child.exitCode == null && child.signalCode == null) {
        terminateProcessTree(child);
      }
    }
  }

  function attachProcessLifecycle(entry, child) {
    child.on('error', (error) => {
      process.stderr.write(
        `[${entry.label}] ${error instanceof Error ? error.message : String(error)}\n`,
      );
      shutdown(child);
      process.exitCode = 1;
    });
    child.on('exit', (code, signal) => {
      if (shuttingDown) {
        return;
      }
      shutdown(child);
      if (code && code !== 0) {
        process.stderr.write(`[${entry.label}] exited with code ${code}\n`);
        process.exitCode = code;
        return;
      }
      if (signal) {
        process.stderr.write(`[${entry.label}] exited with signal ${signal}\n`);
        process.exitCode = 1;
      }
    });
  }

  for (const entry of processes) {
    const child = spawnProcessEntry(entry);
    children.push(child);
    attachProcessLifecycle(entry, child);
  }

  try {
    await waitForSurfaceHealth(profileId, runtimeEnv);
  } catch (error) {
    shutdown();
    throw error;
  }

  console.log(`[sdkwork-notes] dev stack ready (profile=${profileId}, target=${settings.target})`);
  const stop = () => shutdown();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

main().catch((error) => {
  console.error(`[sdkwork-notes] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
