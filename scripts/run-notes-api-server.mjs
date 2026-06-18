#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_DEV_PROFILE_ID,
  loadProfile,
  mergeRuntimeEnv,
  REPO_ROOT,
} from './lib/notes-topology.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(repoRoot, '.sdkwork', 'notes');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const profileId = process.env.SDKWORK_NOTES_PROFILE_ID ?? DEFAULT_DEV_PROFILE_ID;
const profileEnv = loadProfile(profileId);
const env = mergeRuntimeEnv(process.env, profileEnv, {
  SDKWORK_NOTES_PROFILE_ID: profileId,
});

const child = spawn('cargo', ['run', '-p', 'sdkwork-notes-api-server'], {
  cwd: repoRoot,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
