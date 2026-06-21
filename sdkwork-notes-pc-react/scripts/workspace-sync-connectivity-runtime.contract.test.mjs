import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { applyContractModuleStubs } from './contract-transpile-helpers.mjs';

const workspaceRoot = process.cwd();

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

async function loadWorkspaceSyncConnectivityRuntimeModule() {
  const entryPoint = path.resolve(
    workspaceRoot,
    'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceSyncConnectivityRuntime.ts',
  );
  const source = await readFile(entryPoint, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  });

  return import(createDataModuleUrl(applyContractModuleStubs(transpiled.outputText)));
}

const workspaceSyncConnectivityRuntimeModule = await loadWorkspaceSyncConnectivityRuntimeModule();

test('sync connectivity runtime requests a drain only after an observed offline-to-online recovery', async () => {
  const events = [];
  let online = true;
  let onlineHandler = null;
  let offlineHandler = null;

  const cleanup = workspaceSyncConnectivityRuntimeModule.bindNotesWorkspaceSyncConnectivityRuntime({
    bindOnline: (handler) => {
      onlineHandler = handler;
      events.push('bind:online');
      return () => {
        events.push('cleanup:online');
      };
    },
    bindOffline: (handler) => {
      offlineHandler = handler;
      events.push('bind:offline');
      return () => {
        events.push('cleanup:offline');
      };
    },
    isOnline: () => online,
    requestSyncDrain: async () => {
      events.push('requestDrain');
      return true;
    },
  });

  onlineHandler?.();

  offlineHandler?.();
  online = false;
  onlineHandler?.();

  online = true;
  onlineHandler?.();
  onlineHandler?.();
  cleanup();

  assert.deepEqual(events, [
    'bind:online',
    'bind:offline',
    'requestDrain',
    'cleanup:online',
    'cleanup:offline',
  ]);
});

test('workspace page binds sync reconnect recovery through the shared connectivity runtime boundary', () => {
  const pageSource = read('packages/sdkwork-notes-pc-notes/src/pages/NotesWorkspacePage.tsx');

  assert.match(pageSource, /bindNotesWorkspaceSyncConnectivityRuntime/);
  assert.match(pageSource, /window\.addEventListener\('online', handler\)/);
  assert.match(pageSource, /window\.removeEventListener\('online', handler\)/);
  assert.match(pageSource, /window\.addEventListener\('offline', handler\)/);
  assert.match(pageSource, /window\.removeEventListener\('offline', handler\)/);
  assert.match(pageSource, /navigator\.onLine/);
});
