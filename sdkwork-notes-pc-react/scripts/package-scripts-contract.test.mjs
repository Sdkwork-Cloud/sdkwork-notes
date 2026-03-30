import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const packageJsonPath = path.resolve(workspaceRoot, 'package.json');
const desktopPackageJsonPath = path.resolve(
  workspaceRoot,
  'packages',
  'sdkwork-notes-desktop',
  'package.json',
);

test('package scripts pin local tauri commands to source SDK mode and release builds to git SDK mode', () => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts ?? {};
  const desktopPackageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));
  const desktopScripts = desktopPackageJson.scripts ?? {};

  assert.equal(
    scripts.test,
    'pnpm prepare:shared-sdk && pnpm -r --if-present test && pnpm test:app',
  );
  assert.equal(
    scripts['tauri:dev'],
    'node scripts/run-desktop-tauri-dev.mjs',
  );
  assert.equal(
    scripts['tauri:build'],
    'node scripts/run-with-shared-sdk-mode.mjs source -- pnpm --filter @sdkwork/notes-desktop run tauri:build',
  );
  assert.equal(
    scripts['tauri:info'],
    'node scripts/run-with-shared-sdk-mode.mjs source -- pnpm --filter @sdkwork/notes-desktop run tauri:info',
  );
  assert.equal(
    scripts['release:desktop'],
    'node scripts/run-with-shared-sdk-mode.mjs git -- node scripts/run-desktop-release-build.mjs --phase bundle',
  );
  assert.equal(
    scripts['test:desktop:rust'],
    'node scripts/run-cargo-command.mjs test --manifest-path packages/sdkwork-notes-desktop/src-tauri/Cargo.toml',
  );
  assert.equal(
    desktopScripts['tauri:dev'],
    'node ../../scripts/run-desktop-tauri-dev.mjs',
  );
  assert.equal(
    desktopScripts['dev:tauri'],
    'vite --host 127.0.0.1 --port 1430 --strictPort',
  );
});
