import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function transpileTypeScriptModule(relativePath) {
  const entryPoint = path.resolve(process.cwd(), relativePath);
  const source = await readFile(entryPoint, 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  });
}

async function loadWorkspaceReadStrategyRegistryModule() {
  const workspaceTypesModuleUrl = createDataModuleUrl(
    (await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/types/notesWorkspace.ts')).outputText,
  );
  const readStrategySource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/repository/noteWorkspaceReadStrategy.ts')
  ).outputText.replace(
    "../types/notesWorkspace",
    workspaceTypesModuleUrl,
  );
  const workspaceReadStrategyModuleUrl = createDataModuleUrl(readStrategySource);
  const registrySource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/repository/noteWorkspaceReadStrategyRegistry.ts')
  ).outputText
    .replace("../types/notesWorkspace", workspaceTypesModuleUrl)
    .replace("./noteWorkspaceReadStrategy", workspaceReadStrategyModuleUrl);

  return import(createDataModuleUrl(registrySource));
}

async function loadNoteRepositoryModule() {
  const workspaceTypesModuleUrl = createDataModuleUrl(
    (await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/types/notesWorkspace.ts')).outputText,
  );
  const readStrategySource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/repository/noteWorkspaceReadStrategy.ts')
  ).outputText.replace(
    "../types/notesWorkspace",
    workspaceTypesModuleUrl,
  );
  const workspaceReadStrategyModuleUrl = createDataModuleUrl(readStrategySource);
  const readStrategyRegistrySource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/repository/noteWorkspaceReadStrategyRegistry.ts')
  ).outputText
    .replace("../types/notesWorkspace", workspaceTypesModuleUrl)
    .replace("./noteWorkspaceReadStrategy", workspaceReadStrategyModuleUrl);
  const readStrategyRegistryModuleUrl = createDataModuleUrl(readStrategyRegistrySource);
  const notesCommonsModuleUrl = createDataModuleUrl(`
    const createProxy = (getAdapter) => new Proxy({}, {
      get(_target, property) {
        return getAdapter()[property];
      },
      ownKeys() {
        return Reflect.ownKeys(getAdapter());
      },
      getOwnPropertyDescriptor() {
        return {
          configurable: true,
          enumerable: true,
        };
      },
    });

    export const Result = {
      success(data) {
        return { success: true, data };
      },
      error(message) {
        return { success: false, message };
      },
    };

    export function createServiceAdapterController(initialAdapter) {
      let adapter = initialAdapter;
      return {
        service: createProxy(() => adapter),
        setAdapter(nextAdapter) {
          adapter = nextAdapter;
        },
        getAdapter() {
          return adapter;
        },
        resetAdapter() {
          adapter = initialAdapter;
        },
      };
    }
  `);
  const notesCoreModuleUrl = createDataModuleUrl(`
    export function getAppSdkClientWithSession() {
      return {
        note: {},
        filesystem: {},
      };
    }

    export function unwrapAppSdkResponse(payload) {
      return payload;
    }
  `);
  const noteRepositorySource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/repository/noteRepository.ts')
  ).outputText
    .replace("@sdkwork/notes-commons", notesCommonsModuleUrl)
    .replace("@sdkwork/notes-core", notesCoreModuleUrl)
    .replace("../types/notesWorkspace", workspaceTypesModuleUrl)
    .replace("./noteWorkspaceReadStrategyRegistry", readStrategyRegistryModuleUrl)
    .replace("./noteWorkspaceReadStrategy", workspaceReadStrategyModuleUrl);

  return import(createDataModuleUrl(noteRepositorySource));
}

const workspaceReadStrategyRegistryModule = await loadWorkspaceReadStrategyRegistryModule();

function createStrategy(key) {
  return {
    key,
    async loadWorkspaceSnapshot() {
      return {
        success: true,
        data: {
          strategy: key,
        },
      };
    },
  };
}

test('workspace read strategy registry resolves requested strategies and falls back to the default strategy for unregistered future keys', async () => {
  const defaultStrategy = createStrategy('workspace-snapshot');
  const replicaStrategy = createStrategy('replica-snapshot');
  const registry = workspaceReadStrategyRegistryModule.createNoteWorkspaceReadStrategyRegistry({
    strategies: [defaultStrategy, replicaStrategy],
    defaultKey: 'workspace-snapshot',
  });

  assert.equal(registry.defaultKey, 'workspace-snapshot');
  assert.deepEqual(registry.listKeys(), ['workspace-snapshot', 'replica-snapshot']);
  assert.equal(registry.resolve('replica-snapshot'), replicaStrategy);
  assert.equal(registry.resolve('queued-sync-snapshot'), defaultStrategy);
  assert.equal(registry.resolve(), defaultStrategy);

  const resolved = await registry.resolve('replica-snapshot').loadWorkspaceSnapshot();
  assert.equal(resolved.success, true);
  assert.deepEqual(resolved.data, { strategy: 'replica-snapshot' });
});

test('workspace read strategy registry rejects duplicate keys and unknown default keys', () => {
  const defaultStrategy = createStrategy('workspace-snapshot');
  const replicaStrategy = createStrategy('replica-snapshot');

  assert.throws(() => {
    workspaceReadStrategyRegistryModule.createNoteWorkspaceReadStrategyRegistry({
      strategies: [defaultStrategy, createStrategy('workspace-snapshot')],
    });
  }, /Duplicate workspace read strategy key: workspace-snapshot/u);

  assert.throws(() => {
    workspaceReadStrategyRegistryModule.createNoteWorkspaceReadStrategyRegistry({
      strategies: [defaultStrategy, replicaStrategy],
      defaultKey: 'queued-sync-snapshot',
    });
  }, /Unknown default workspace read strategy key: queued-sync-snapshot/u);
});

test('note repository selects a registered future read strategy when a strategy key is requested', async () => {
  const noteRepositoryModule = await loadNoteRepositoryModule();
  const defaultStrategy = createStrategy('workspace-snapshot');
  const replicaStrategy = createStrategy('replica-snapshot');
  const repository = noteRepositoryModule.createNoteRepository({
    workspaceReadStrategy: defaultStrategy,
    workspaceReadStrategies: [replicaStrategy],
    workspaceReadStrategyKey: 'replica-snapshot',
  });

  const result = await repository.queryWorkspaceSnapshot({ keyword: 'replica' });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, { strategy: 'replica-snapshot' });
});
