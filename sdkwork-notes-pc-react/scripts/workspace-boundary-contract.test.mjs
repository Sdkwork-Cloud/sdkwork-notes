import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const workspaceConfigPath = path.resolve(workspaceRoot, 'pnpm-workspace.yaml');
const notesCorePackageJsonPath = path.resolve(
  workspaceRoot,
  'packages',
  'sdkwork-notes-core',
  'package.json',
);
const notesAuthPackageJsonPath = path.resolve(
  workspaceRoot,
  'packages',
  'sdkwork-notes-auth',
  'package.json',
);
const notesAuthBridgePath = path.resolve(
  workspaceRoot,
  'packages',
  'sdkwork-notes-auth',
  'src',
  'services',
  'sdkworkAuthBridge.ts',
);
const packagesRootPath = path.resolve(
  workspaceRoot,
  'packages',
);
const lockfilePath = path.resolve(workspaceRoot, 'pnpm-lock.yaml');
const tsconfigBasePath = path.resolve(workspaceRoot, 'tsconfig.base.json');

function collectSourceFiles(rootPath) {
  const sourceFiles = [];
  const pending = [rootPath];

  while (pending.length > 0) {
    const currentPath = pending.pop();
    if (!currentPath) {
      continue;
    }

    const entries = fs.readdirSync(currentPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'dist' || entry.name === 'node_modules') {
          continue;
        }

        pending.push(entryPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        sourceFiles.push(entryPath);
      }
    }
  }

  return sourceFiles;
}

test('notes workspace stays self-contained and does not pull core-pc-react or IM sdk packages', () => {
  const workspaceConfig = fs.readFileSync(workspaceConfigPath, 'utf8');

  assert.doesNotMatch(workspaceConfig, /sdkwork-core\/sdkwork-core-pc-react/);
  assert.doesNotMatch(workspaceConfig, /openchat\/sdkwork-im-sdk\/sdkwork-im-sdk-typescript\/composed/);
  assert.doesNotMatch(workspaceConfig, /openchat\/sdkwork-im-sdk\/sdkwork-im-sdk-typescript\/adapter-wukongim/);
  assert.doesNotMatch(workspaceConfig, /openchat\/sdkwork-im-sdk\/sdkwork-im-sdk-typescript\/generated\/server-openapi/);
});

test('notes-core app sdk runtime does not depend on core-pc-react', () => {
  const packageJson = JSON.parse(fs.readFileSync(notesCorePackageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies ?? {};

  assert.equal(dependencies['@sdkwork/core-pc-react'], undefined);
});

test('notes-auth owns the shared auth runtime boundary and the rest of the workspace stays on the notes-auth facade', () => {
  const packageJson = JSON.parse(fs.readFileSync(notesAuthPackageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies ?? {};

  assert.equal(dependencies['@sdkwork/core-pc-react'], undefined);
  assert.match(String(dependencies['@sdkwork/auth-pc-react'] ?? ''), /^file:/);

  const bridgeSource = fs.readFileSync(notesAuthBridgePath, 'utf8');

  assert.match(bridgeSource, /from '@sdkwork\/notes-core'/);
  assert.match(bridgeSource, /clearSession: options\.clearSession \?\? \(\(\) => clearAppSdkSessionTokens\(\)\)/);
  assert.match(bridgeSource, /getClient: \(\) => resolveBoundAuthClient\(options\.getClient\)/);
  assert.match(bridgeSource, /persistSession: options\.persistSession \?\? \(\(session\) => persistAppSdkSessionTokens\(session\)\)/);
  assert.match(bridgeSource, /readSession: options\.readSession \?\? \(\(\) => readAppSdkSessionTokens\(\)\)/);
  assert.match(bridgeSource, /resolveAccessToken: options\.resolveAccessToken \?\? \(\(\) => resolveAppSdkAccessToken\(\)\)/);

  const directSharedAuthImports = collectSourceFiles(packagesRootPath)
    .map((filePath) => path.relative(workspaceRoot, filePath).replaceAll('\\', '/'))
    .filter((relativePath) => !relativePath.startsWith('packages/sdkwork-notes-auth/'))
    .filter((relativePath) =>
      fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8').includes('@sdkwork/auth-pc-react'),
    );

  assert.deepEqual(
    directSharedAuthImports,
    [],
    'Expected only @sdkwork/notes-auth to import @sdkwork/auth-pc-react directly.',
  );
});

test('lockfile does not retain core-pc-react or openchat IM workspace links', () => {
  const lockfile = fs.readFileSync(lockfilePath, 'utf8');

  assert.doesNotMatch(lockfile, /^ {2}'@sdkwork\/core-pc-react@/m);
  assert.doesNotMatch(lockfile, /resolution:\s+\{directory:\s+.*sdkwork-core-pc-react.*\}/);
  assert.doesNotMatch(lockfile, /version:\s+(?:file|link):.*sdkwork-core-pc-react/);
  assert.doesNotMatch(lockfile, /openchat\/sdkwork-im-sdk\/sdkwork-im-sdk-typescript\/composed/);
  assert.doesNotMatch(lockfile, /openchat\/sdkwork-im-sdk\/sdkwork-im-sdk-typescript\/adapter-wukongim/);
  assert.doesNotMatch(lockfile, /openchat\/sdkwork-im-sdk\/sdkwork-im-sdk-typescript\/generated\/server-openapi/);
});

test('typescript resolves shared sdk types through explicit workspace path aliases', () => {
  const tsconfigBase = JSON.parse(fs.readFileSync(tsconfigBasePath, 'utf8'));
  const paths = tsconfigBase.compilerOptions?.paths ?? {};

  assert.deepEqual(
    paths['@sdkwork/app-sdk'],
    ['../../../spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/index.ts'],
    'Expected tsconfig.base.json to resolve @sdkwork/app-sdk through the workspace source alias.',
  );
  assert.deepEqual(
    paths['@sdkwork/sdk-common'],
    ['../../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts'],
    'Expected tsconfig.base.json to resolve @sdkwork/sdk-common through the workspace source alias.',
  );
});
