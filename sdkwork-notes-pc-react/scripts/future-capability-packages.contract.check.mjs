import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const packagesRoot = path.resolve(workspaceRoot, 'packages');

const expectedPackages = [
  {
    directory: 'sdkwork-notes-pc-local',
    packageName: '@sdkwork/notes-pc-local',
  },
  {
    directory: 'sdkwork-notes-pc-search',
    packageName: '@sdkwork/notes-pc-search',
  },
  {
    directory: 'sdkwork-notes-pc-sync',
    packageName: '@sdkwork/notes-pc-sync',
  },
  {
    directory: 'sdkwork-notes-pc-observability',
    packageName: '@sdkwork/notes-pc-observability',
  },
  {
    directory: 'sdkwork-notes-pc-updater',
    packageName: '@sdkwork/notes-pc-updater',
  },
];

for (const expectedPackage of expectedPackages) {
  const packageRoot = path.resolve(packagesRoot, expectedPackage.directory);
  const packageJsonPath = path.resolve(packageRoot, 'package.json');
  const tsconfigPath = path.resolve(packageRoot, 'tsconfig.json');
  const viteConfigPath = path.resolve(packageRoot, 'vite.config.ts');
  const entryPath = path.resolve(packageRoot, 'src', 'index.ts');

  assert.equal(
    fs.existsSync(packageRoot),
    true,
    `Expected capability package directory ${expectedPackage.directory} to exist.`,
  );
  assert.equal(
    fs.existsSync(packageJsonPath),
    true,
    `Expected ${expectedPackage.directory}/package.json to exist.`,
  );
  assert.equal(
    fs.existsSync(tsconfigPath),
    true,
    `Expected ${expectedPackage.directory}/tsconfig.json to exist.`,
  );
  assert.equal(
    fs.existsSync(viteConfigPath),
    true,
    `Expected ${expectedPackage.directory}/vite.config.ts to exist.`,
  );
  assert.equal(
    fs.existsSync(entryPath),
    true,
    `Expected ${expectedPackage.directory}/src/index.ts to exist.`,
  );

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  assert.equal(
    packageJson.name,
    expectedPackage.packageName,
    `Expected ${expectedPackage.directory} package name to be ${expectedPackage.packageName}.`,
  );
  assert.equal(packageJson.private, true, `Expected ${expectedPackage.directory} to remain private.`);
  assert.equal(packageJson.type, 'module', `Expected ${expectedPackage.directory} to use ESM.`);
}

console.log('future capability package contract check passed');
