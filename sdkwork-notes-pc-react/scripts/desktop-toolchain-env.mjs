import fs from 'node:fs';
import path from 'node:path';

function resolvePathEnvKey(env) {
  if (typeof env?.Path === 'string') {
    return 'Path';
  }

  return 'PATH';
}

function splitPathEntries(value) {
  return String(value ?? '')
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function hasPathEntry(entries, candidatePath, platform) {
  const normalizedCandidatePath = path.resolve(candidatePath);

  return entries.some((entry) => {
    const normalizedEntry = path.resolve(entry);
    if (platform === 'win32') {
      return normalizedEntry.toLowerCase() === normalizedCandidatePath.toLowerCase();
    }

    return normalizedEntry === normalizedCandidatePath;
  });
}

function resolveUserHomeDir(env) {
  const explicitHome = typeof env?.USERPROFILE === 'string' && env.USERPROFILE.trim().length > 0
    ? env.USERPROFILE.trim()
    : typeof env?.HOME === 'string' && env.HOME.trim().length > 0
      ? env.HOME.trim()
      : '';

  if (explicitHome.length > 0) {
    return explicitHome;
  }

  const homeDrive = typeof env?.HOMEDRIVE === 'string' ? env.HOMEDRIVE.trim() : '';
  const homePath = typeof env?.HOMEPATH === 'string' ? env.HOMEPATH.trim() : '';
  if (homeDrive.length > 0 && homePath.length > 0) {
    return `${homeDrive}${homePath}`;
  }

  return '';
}

export function resolveWindowsCargoBinDir({
  env = process.env,
  platform = process.platform,
  windowsCargoBinDir = '',
} = {}) {
  if (platform !== 'win32') {
    return '';
  }

  const explicitCargoBinDir = String(windowsCargoBinDir ?? '').trim();
  if (explicitCargoBinDir.length > 0) {
    return explicitCargoBinDir;
  }

  const homeDir = resolveUserHomeDir(env);
  if (homeDir.length === 0) {
    return '';
  }

  const cargoBinDir = path.join(homeDir, '.cargo', 'bin');
  return fs.existsSync(cargoBinDir) ? cargoBinDir : '';
}

export function applyDesktopToolchainEnv({
  env = process.env,
  platform = process.platform,
  windowsCargoBinDir = '',
} = {}) {
  const nextEnv = { ...env };
  const cargoBinDir = resolveWindowsCargoBinDir({
    env,
    platform,
    windowsCargoBinDir,
  });
  if (cargoBinDir.length === 0) {
    return nextEnv;
  }

  const pathEnvKey = resolvePathEnvKey(nextEnv);
  const currentPathEntries = splitPathEntries(nextEnv[pathEnvKey]);
  if (hasPathEntry(currentPathEntries, cargoBinDir, platform)) {
    return nextEnv;
  }

  nextEnv[pathEnvKey] = [cargoBinDir, ...currentPathEntries].join(path.delimiter);
  return nextEnv;
}
