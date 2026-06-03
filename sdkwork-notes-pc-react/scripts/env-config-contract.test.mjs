import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('workspace ships explicit development, test, production, and example env files', () => {
  for (const relativePath of [
    '.env.example',
    '.env.development',
    '.env.test',
    '.env.production',
  ]) {
    assert.equal(fs.existsSync(path.join(workspaceRoot, relativePath)), true, `${relativePath} is required`);
  }
});

test('workspace env defaults align base api url and access token with claw-studio', () => {
  const envExample = read('.env.example');
  const envDevelopment = read('.env.development');
  const envTest = read('.env.test');
  const envProduction = read('.env.production');

  assert.match(envExample, /VITE_API_BASE_URL=https:\/\/api-dev\.sdkwork\.com/);
  assert.match(envExample, /VITE_ACCESS_TOKEN=$/m);
  assert.match(envExample, /VITE_APP_OWNER_MODE=tenant/);

  assert.match(envDevelopment, /VITE_APP_ENV=development/);
  assert.match(envDevelopment, /VITE_API_BASE_URL=https:\/\/api-dev\.sdkwork\.com/);
  assert.match(envDevelopment, /VITE_ACCESS_TOKEN=$/m);
  assert.match(envDevelopment, /VITE_APP_OWNER_MODE=tenant/);

  assert.match(envTest, /VITE_APP_ENV=test/);
  assert.match(envTest, /VITE_API_BASE_URL=https:\/\/api-test\.sdkwork\.com/);
  assert.match(envTest, /VITE_ACCESS_TOKEN=$/m);
  assert.match(envTest, /VITE_APP_OWNER_MODE=tenant/);

  assert.match(envProduction, /VITE_APP_ENV=production/);
  assert.match(envProduction, /VITE_API_BASE_URL=https:\/\/api\.sdkwork\.com/);
  assert.match(envProduction, /VITE_ACCESS_TOKEN=$/m);
  assert.match(envProduction, /VITE_APP_OWNER_MODE=tenant/);
});

test('web and desktop vite configs load workspace env files and allow overriding app mode', () => {
  const webViteConfig = read('vite.config.ts');
  const desktopViteConfig = read('packages/sdkwork-notes-desktop/vite.config.ts');

  assert.match(webViteConfig, /loadEnv\(.*workspaceRootDir.*''\)/);
  assert.match(webViteConfig, /envDir:\s*workspaceRootDir/);
  assert.match(webViteConfig, /SDKWORK_NOTES_APP_MODE/);

  assert.match(desktopViteConfig, /loadEnv\(.*workspaceRootDir.*''\)/);
  assert.match(desktopViteConfig, /envDir:\s*workspaceRootDir/);
  assert.match(desktopViteConfig, /SDKWORK_NOTES_APP_MODE/);
  assert.match(desktopViteConfig, /VITE_APP_PLATFORM/);
});
