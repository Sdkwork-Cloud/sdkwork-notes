import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createMemoryStorage() {
  const store = new Map();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.get(key) ?? null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

function transpileTypeScriptSource(source, fileName) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
}

async function loadUseAppSdkClientModule() {
  const packageRoot = path.resolve(process.cwd(), 'packages/sdkwork-notes-pc-core/src/sdk');
  const reactStubUrl = createDataModuleUrl(`
    export function useMemo(factory) {
      return factory();
    }
  `);
  const utilsStubUrl = createDataModuleUrl(`
    export function trim(value) {
      return typeof value === 'string' ? value.trim() : '';
    }
    export function isBlank(value) {
      return trim(value).length === 0;
    }
  `);
  const commonsStubUrl = createDataModuleUrl(`
    export function normalizeString(value) {
      if (typeof value === 'string') {
        return value.trim();
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
      return '';
    }
  `);

  const localModuleUrls = new Map();
  async function loadLocalModule(relativeFileName) {
    if (localModuleUrls.has(relativeFileName)) {
      return localModuleUrls.get(relativeFileName);
    }

    const filePath = path.join(packageRoot, relativeFileName);
    const source = await readFile(filePath, 'utf8');
    const transpiled = transpileTypeScriptSource(source, filePath)
      .replaceAll("'@sdkwork/utils'", `'${utilsStubUrl}'`)
      .replaceAll('"@sdkwork/utils"', `"${utilsStubUrl}"`)
      .replaceAll("'@sdkwork/notes-pc-commons'", `'${commonsStubUrl}'`)
      .replaceAll('"@sdkwork/notes-pc-commons"', `"${commonsStubUrl}"`);

    const moduleUrl = createDataModuleUrl(transpiled);
    localModuleUrls.set(relativeFileName, moduleUrl);
    return moduleUrl;
  }

  const entryPoint = path.join(packageRoot, 'useAppSdkClient.ts');
  const source = await readFile(entryPoint, 'utf8');
  let moduleSource = transpileTypeScriptSource(source, entryPoint);
  const credentialEnvUrl = await loadLocalModule('appSdkCredentialEnv.ts');
  const sessionIdentityClaimsUrl = await loadLocalModule('sessionIdentityClaims.ts');

  moduleSource = moduleSource
    .replaceAll("'react'", `'${reactStubUrl}'`)
    .replaceAll('"react"', `"${reactStubUrl}"`)
    .replaceAll("'@sdkwork/utils'", `'${utilsStubUrl}'`)
    .replaceAll('"@sdkwork/utils"', `"${utilsStubUrl}"`)
    .replaceAll("'@sdkwork/notes-pc-commons'", `'${commonsStubUrl}'`)
    .replaceAll('"@sdkwork/notes-pc-commons"', `"${commonsStubUrl}"`)
    .replaceAll("'./appSdkCredentialEnv.js'", `'${credentialEnvUrl}'`)
    .replaceAll('"./appSdkCredentialEnv.js"', `"${credentialEnvUrl}"`)
    .replaceAll("'./appSdkCredentialEnv'", `'${credentialEnvUrl}'`)
    .replaceAll('"./appSdkCredentialEnv"', `"${credentialEnvUrl}"`)
    .replaceAll("'./sessionIdentityClaims.js'", `'${sessionIdentityClaimsUrl}'`)
    .replaceAll('"./sessionIdentityClaims.js"', `"${sessionIdentityClaimsUrl}"`)
    .replaceAll("'./sessionIdentityClaims'", `'${sessionIdentityClaimsUrl}'`)
    .replaceAll('"./sessionIdentityClaims"', `"${sessionIdentityClaimsUrl}"`);

  if (!moduleSource.includes(`from '${commonsStubUrl}'`) && !moduleSource.includes(`from "${commonsStubUrl}"`)) {
    moduleSource = `import { normalizeString } from '${commonsStubUrl}';\n${moduleSource}`;
  }

  return import(createDataModuleUrl(moduleSource));
}

const useAppSdkClientModule = await loadUseAppSdkClientModule();

test.beforeEach(() => {
  useAppSdkClientModule.resetAppSdkClient();
  useAppSdkClientModule.configureAppSdkSessionStoreAdapter(null);
  useAppSdkClientModule.clearAppSdkSessionTokens();
  globalThis.__SDKWORK_NOTES_ENV__ = undefined;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
});

test('runtime context freezes tenant owner mode and source priority', () => {
    globalThis.__SDKWORK_NOTES_ENV__ = {
    VITE_APP_ENV: 'test',
    VITE_APP_OWNER_MODE: 'tenant',
    VITE_APP_PLATFORM: 'desktop',
  };

  const runtimeContext = useAppSdkClientModule.resolveAppSdkRuntimeContext();

  assert.equal(runtimeContext.env, 'test');
  assert.equal(runtimeContext.ownerMode, 'tenant');
  assert.equal(runtimeContext.platform, 'desktop');
  assert.deepEqual(runtimeContext.sourcePriority, [
    '__SDKWORK_NOTES_ENV__',
    'import.meta.env',
    'process.env',
  ]);
});

test('session migration moves notes secrets from localStorage to sessionStorage', () => {
  globalThis.localStorage.setItem(
    useAppSdkClientModule.APP_SDK_SESSION_STORAGE_KEY,
    JSON.stringify({
      authToken: 'stored-auth-token',
      accessToken: 'stored-access-token',
      refreshToken: 'stored-refresh-token',
    }),
  );
  globalThis.localStorage.setItem('sdkwork.core.pc-react.auth-token', 'stored-auth-token');
  globalThis.localStorage.setItem('sdkwork.core.pc-react.access-token', 'stored-access-token');
  globalThis.localStorage.setItem('sdkwork.core.pc-react.refresh-token', 'stored-refresh-token');

  assert.deepEqual(useAppSdkClientModule.readAppSdkSessionTokens(), {
    authToken: 'stored-auth-token',
    accessToken: 'stored-access-token',
    refreshToken: 'stored-refresh-token',
  });
  assert.equal(
    globalThis.localStorage.getItem(useAppSdkClientModule.APP_SDK_SESSION_STORAGE_KEY),
    null,
  );
  assert.equal(globalThis.localStorage.getItem('sdkwork.core.pc-react.auth-token'), null);
  assert.equal(globalThis.localStorage.getItem('sdkwork.core.pc-react.access-token'), null);
  assert.equal(globalThis.localStorage.getItem('sdkwork.core.pc-react.refresh-token'), null);
  assert.match(
    globalThis.sessionStorage.getItem(useAppSdkClientModule.APP_SDK_SESSION_STORAGE_KEY) ?? '',
    /stored-refresh-token/,
  );
});

test('custom platform adapter owns session persistence after registration', () => {
  const adapterState = {
    value: null,
  };

  useAppSdkClientModule.configureAppSdkSessionStoreAdapter({
    clear() {
      adapterState.value = null;
    },
    kind: `test-adapter-${os.platform()}`,
    read() {
      return adapterState.value;
    },
    write(session) {
      adapterState.value = session;
    },
  });

  useAppSdkClientModule.persistAppSdkSessionTokens({
    authToken: 'adapter-auth-token',
    accessToken: 'adapter-access-token',
    refreshToken: 'adapter-refresh-token',
  });

  assert.deepEqual(useAppSdkClientModule.readAppSdkSessionTokens(), {
    authToken: 'adapter-auth-token',
    accessToken: 'adapter-access-token',
    refreshToken: 'adapter-refresh-token',
  });
  assert.equal(
    globalThis.localStorage.getItem(useAppSdkClientModule.APP_SDK_SESSION_STORAGE_KEY),
    null,
  );

  useAppSdkClientModule.clearAppSdkSessionTokens();

  assert.equal(adapterState.value, null);
});
