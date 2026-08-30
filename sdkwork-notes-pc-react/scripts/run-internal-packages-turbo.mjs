import process from 'node:process';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

export const INTERNAL_WORKSPACE_PACKAGES = [
  '@sdkwork/notes-pc-auth',
  '@sdkwork/notes-pc-commons',
  '@sdkwork/notes-pc-core',
  '@sdkwork/notes-pc-desktop',
  '@sdkwork/notes-pc-i18n',
  '@sdkwork/notes-pc-local',
  '@sdkwork/notes-pc-notes',
  '@sdkwork/notes-pc-observability',
  '@sdkwork/notes-pc-search',
  '@sdkwork/notes-pc-shell',
  '@sdkwork/notes-pc-sync-commons',
  '@sdkwork/notes-pc-types-commons',
  '@sdkwork/notes-pc-updater',
  '@sdkwork/notes-pc-user',
];

export function createInternalTurboArgs(task, extraArgs = []) {
  if (!task) {
    throw new Error('Expected a Turbo task name such as "build" or "typecheck".');
  }

  return [
    'exec',
    'turbo',
    'run',
    task,
    '--only',
    ...INTERNAL_WORKSPACE_PACKAGES.map((packageName) => `--filter=${packageName}`),
    ...extraArgs,
  ];
}

export function runInternalPackagesTurbo(task, extraArgs = [], options = {}) {
  const result = spawnSync('pnpm', createInternalTurboArgs(task, extraArgs), {
    cwd: options.cwd ?? process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (path.resolve(process.argv[1] ?? '') === __filename) {
  const [task, ...extraArgs] = process.argv.slice(2);
  runInternalPackagesTurbo(task, extraArgs);
}
