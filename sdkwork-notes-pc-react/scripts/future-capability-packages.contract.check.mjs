import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const packagesRoot = path.resolve(workspaceRoot, 'packages');

const expectedPackages = [
  {
    directory: 'sdkwork-notes-local',
    packageName: '@sdkwork/notes-local',
  },
  {
    directory: 'sdkwork-notes-search',
    packageName: '@sdkwork/notes-search',
  },
  {
    directory: 'sdkwork-notes-sync',
    packageName: '@sdkwork/notes-sync',
  },
  {
    directory: 'sdkwork-notes-observability',
    packageName: '@sdkwork/notes-observability',
  },
  {
    directory: 'sdkwork-notes-updater',
    packageName: '@sdkwork/notes-updater',
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
