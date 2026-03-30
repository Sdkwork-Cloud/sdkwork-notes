import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const packageJsonPath = path.resolve(workspaceRoot, 'package.json');

test('package scripts pin local tauri commands to source SDK mode and release builds to git SDK mode', () => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts ?? {};

  assert.equal(
    scripts['tauri:dev'],
    'node scripts/run-with-shared-sdk-mode.mjs source -- pnpm --filter @sdkwork/notes-desktop run tauri:dev',
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
});
