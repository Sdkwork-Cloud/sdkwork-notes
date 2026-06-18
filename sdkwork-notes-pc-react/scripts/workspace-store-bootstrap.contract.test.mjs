import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceModuleSpecifier(source, specifier, replacement) {
  return source.replace(
    new RegExp(`(['"])${escapeRegExp(specifier)}\\1`, 'g'),
    JSON.stringify(replacement),
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

let workspaceStoreBootstrapModuleSequence = 0;

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

async function loadWorkspaceStoreModule() {
  const typesModuleUrl = createDataModuleUrl(
    (
      await transpileTypeScriptModule('packages/sdkwork-notes-pc-notes/src/types/notesWorkspace.ts')
    ).outputText,
  );
  const notesSyncModuleUrl = createDataModuleUrl(
    (
      await transpileTypeScriptModule('packages/sdkwork-notes-pc-sync/src/index.ts')
    ).outputText,
  );

  const zustandVanillaStubUrl = createDataModuleUrl(`
export function createStore() {
  return (stateCreator) => {
    let state;
    const listeners = new Set();
    const api = {
      getState: () => state,
      setState: (partial) => {
        const nextState = typeof partial === 'function' ? partial(state) : partial;
        state = Object.assign({}, state, nextState);
        for (const listener of listeners) {
          listener(state);
        }
      },
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    const set = (partial) => api.setState(partial);
    const get = () => api.getState();
    state = stateCreator(set, get, api);
    return api;
  };
}
`);

  const zustandStubUrl = createDataModuleUrl(`
import { createStore as createStoreImpl } from ${JSON.stringify(zustandVanillaStubUrl)};
export function create() {
  return (stateCreator) => createStoreImpl()(stateCreator);
}
export function useStore(store, selector) {
  return selector(store.getState());
}
`);

  const notesLocalStubUrl = createDataModuleUrl(`
export const notesLocalStore = {
  async loadWorkspace() {
    return { notes: [], folders: [], drafts: [] };
  },
  async saveDraft() {},
  async clearDraft() {},
};
`);

  const servicesStubUrl = createDataModuleUrl(`
export async function captureNotesWorkspaceExitRecoverySnapshot() {
  return false;
}

export async function clearNotesWorkspaceExitRecoverySnapshot() {}

export function createNotesWorkspaceWriteCoordinator() {
  return {
    async createNoteState() {
      return { status: 'error', createdNoteId: '', errorMessage: 'not used' };
    },
    async createFolderState() {
      return { status: 'error', createdFolderId: '', errorMessage: 'not used' };
    },
    async renameFolderState() {
      return { status: 'error', resolvedFolderId: '', errorMessage: 'not used' };
    },
    async moveNoteState() {
      return { status: 'error', nextParentId: null, errorMessage: 'not used' };
    },
  };
}

export function createNoteWorkspaceOrchestrator() {
  return {
    async initializeWorkspace() {
      return {
        success: true,
        data: {
          notes: [],
          trashedNotes: [],
          folders: [],
          dataSource: {
            driver: 'app-sdk',
            authority: 'remote',
            readStrategy: 'workspace-snapshot',
            writeStrategy: 'direct-write',
            capabilities: {
              localReplica: false,
              readThroughCache: false,
              offlineRead: false,
              offlineWrite: false,
              backgroundSync: false,
              incrementalSync: false,
              conflictResolution: false,
            },
          },
          activeNoteId: null,
          activeNote: null,
          selectedFolderId: null,
          activeNoteErrorMessage: null,
        },
      };
    },
    async loadWorkspaceNote() {
      return {
        success: true,
        data: {
          activeNote: null,
        },
      };
    },
  };
}

export function createNotesWorkspaceSaveQueue() {
  let activeRequest = null;
  return {
    hasActiveRequest() {
      return activeRequest !== null;
    },
    async waitForActiveRequest() {
      return activeRequest ? activeRequest : true;
    },
    async requestReplay() {
      return true;
    },
    async run(task) {
      activeRequest = Promise.resolve(task()).finally(() => {
        activeRequest = null;
      });
      return activeRequest;
    },
  };
}

export function createNotesWorkspaceSaveRetryPolicy() {
  return {
    getMaximumRetryCount() {
      return 0;
    },
    resolveNextRetryDelay() {
      return null;
    },
    async recordRetryScheduled() {},
    async recordRetryRecovered() {},
    async recordRetryExhausted() {},
  };
}

export const noteLayoutService = {
  getSidebarWidth(fallback = 320) {
    return fallback;
  },
  saveSidebarWidth() {},
};

export const noteWorkspaceService = {
  async queryWorkspaceSnapshot() {
    return {
      success: true,
      data: {
        notes: [],
        trashedNotes: [],
        folders: [],
        dataSource: {
          driver: 'app-sdk',
          authority: 'remote',
          readStrategy: 'workspace-snapshot',
          writeStrategy: 'direct-write',
          capabilities: {
            localReplica: false,
            readThroughCache: false,
            offlineRead: false,
            offlineWrite: false,
            backgroundSync: false,
            incrementalSync: false,
            conflictResolution: false,
          },
        },
      },
    };
  },
  async findById() {
    return {
      success: true,
      data: null,
    };
  },
  async save(entity) {
    return {
      success: true,
      data: {
        id: entity?.id ?? 'note-default',
        uuid: 'uuid-' + (entity?.id ?? 'note-default'),
        title: entity?.title ?? 'Untitled',
        type: entity?.type ?? 'doc',
        parentId: entity?.parentId ?? null,
        tags: entity?.tags ?? [],
        isFavorite: Boolean(entity?.isFavorite),
        snippet: '',
        publishStatus: entity?.publishStatus ?? 'draft',
        createdAt: '2026-04-14T12:00:00.000Z',
        updatedAt: '2026-04-14T12:00:00.000Z',
      },
    };
  },
  async createFolder(name, parentId) {
    return {
      success: true,
      data: {
        id: 'folder-default',
        uuid: 'folder-folder-default',
        name,
        parentId: parentId ?? null,
        createdAt: '2026-04-14T12:00:00.000Z',
        updatedAt: '2026-04-14T12:00:00.000Z',
      },
    };
  },
  async renameFolder(id) {
    return { success: true, data: id };
  },
  async moveFolder() {
    return { success: true, data: undefined };
  },
  async deleteFolder() {
    return { success: true, data: undefined };
  },
  async moveNote() {
    return { success: true, data: undefined };
  },
  async moveToTrash(id) {
    return {
      success: true,
      data: {
        id,
        uuid: 'uuid-' + id,
        title: 'Trashed ' + id,
        type: 'doc',
        parentId: null,
        tags: [],
        isFavorite: false,
        snippet: '',
        publishStatus: 'draft',
        createdAt: '2026-04-14T12:00:00.000Z',
        updatedAt: '2026-04-14T12:00:00.000Z',
        deletedAt: '2026-04-14T12:00:00.000Z',
      },
    };
  },
  async restoreFromTrash(id) {
    return {
      success: true,
      data: {
        id,
        uuid: 'uuid-' + id,
        title: 'Restored ' + id,
        type: 'doc',
        parentId: null,
        tags: [],
        isFavorite: false,
        snippet: '',
        publishStatus: 'draft',
        createdAt: '2026-04-14T12:00:00.000Z',
        updatedAt: '2026-04-14T12:00:00.000Z',
      },
    };
  },
  async deleteById() {
    return { success: true, data: undefined };
  },
  async clearTrash() {
    return { success: true, data: 0 };
  },
};

export function planDeletedFolderState() {
  return { status: 'noop' };
}

export function planMovedFolderState() {
  return { status: 'noop' };
}

export function planMovedNoteState() {
  return { status: 'noop' };
}

export function removeNotesWorkspaceRecoveredDraft(recoveredDrafts) {
  return recoveredDrafts;
}

export function resolveActiveNotesWorkspaceRecoveredDraft() {
  return null;
}

export function resolveNotesWorkspaceRecoveredDrafts() {
  return [];
}

export function resolveNotesWorkspaceSaveCompletion(input) {
  return {
    activeNote: input.currentActiveNote,
    persistedActiveNote: input.currentActiveNote,
    saveState: input.successSaveState,
  };
}

export function resolveNotesWorkspaceSaveRequestState(currentSaveState) {
  return currentSaveState === 'retrying' ? 'retrying' : 'saving';
}

export function resolveNotesWorkspaceSaveSuccessState() {
  return 'saved';
}

export function restoreNotesWorkspaceRecoveredDraft(note, draft, restoredAt) {
  return {
    ...note,
    title: draft.title,
    content: draft.content,
    updatedAt: restoredAt,
  };
}
`);

  const workspaceStoreSource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-pc-notes/src/store/useNotesWorkspaceStore.ts')
  ).outputText;
  const patchedWorkspaceStoreSource = replaceModuleSpecifier(
    replaceModuleSpecifier(
      replaceModuleSpecifier(
        replaceModuleSpecifier(
          replaceModuleSpecifier(
            replaceModuleSpecifier(workspaceStoreSource, 'zustand', zustandStubUrl),
            'zustand/vanilla',
            zustandVanillaStubUrl,
          ),
          '@sdkwork/notes-pc-local',
          notesLocalStubUrl,
        ),
        '@sdkwork/notes-pc-sync',
        notesSyncModuleUrl,
      ),
      '../services',
      servicesStubUrl,
    ),
    '../types/notesWorkspace',
    typesModuleUrl,
  );

  return import(createDataModuleUrl(patchedWorkspaceStoreSource));
}

async function loadWorkspaceStoreBootstrapModule() {
  const cacheKey = ++workspaceStoreBootstrapModuleSequence;
  const notesSyncStubUrl = createDataModuleUrl(`
// bootstrap-cache-key:${cacheKey}
export const createdQueueStores = [];
export function createBrowserNotesSyncQueueStore() {
  const store = { id: 'queue-store-' + (createdQueueStores.length + 1) };
  createdQueueStores.push(store);
  return store;
}
`);

  const storeStubUrl = createDataModuleUrl(`
// bootstrap-cache-key:${cacheKey}
export const configureCalls = [];
export let resetCalls = 0;

export function configureNotesWorkspaceStore(overrides = {}) {
  configureCalls.push(overrides);
  return {
    kind: 'configured-store',
    overrides,
  };
}

export function resetNotesWorkspaceStore() {
  resetCalls += 1;
  return {
    kind: 'reset-store',
  };
}
`);

  const servicesStubUrl = createDataModuleUrl(`
// bootstrap-cache-key:${cacheKey}
export const createdRuntimes = [];

export function createNotesWorkspaceSyncRuntime(options) {
  const runtime = {
    options,
    disposeCalls: 0,
    async requestDrain() {},
    dispose() {
      runtime.disposeCalls += 1;
    },
  };
  createdRuntimes.push(runtime);
  return runtime;
}
`);

  const source = (
    await transpileTypeScriptModule('packages/sdkwork-notes-pc-notes/src/bootstrap/notesWorkspaceStoreBootstrap.ts')
  ).outputText;
  const patchedSource = replaceModuleSpecifier(
    replaceModuleSpecifier(
      replaceModuleSpecifier(source, '@sdkwork/notes-pc-sync', notesSyncStubUrl),
      '../services',
      servicesStubUrl,
    ),
    '../store',
    storeStubUrl,
  );

  return {
    module: await import(createDataModuleUrl(patchedSource)),
    notesSyncStub: await import(notesSyncStubUrl),
    servicesStub: await import(servicesStubUrl),
    storeStub: await import(storeStubUrl),
  };
}

function createSummary(id, title, overrides = {}) {
  return {
    id,
    uuid: `uuid-${id}`,
    title,
    type: 'doc',
    parentId: null,
    tags: [],
    isFavorite: false,
    snippet: `${title} summary`,
    publishStatus: 'draft',
    createdAt: '2026-04-14T12:30:00.000Z',
    updatedAt: '2026-04-14T12:30:00.000Z',
    ...overrides,
  };
}

function createNote(id, title, overrides = {}) {
  return {
    ...createSummary(id, title, overrides),
    content: `${title} content`,
    ...overrides,
  };
}

test('configureNotesWorkspaceStore replaces the exported workspace store binding before page consumption', async () => {
  const storeModule = await loadWorkspaceStoreModule();
  assert.equal(typeof storeModule.configureNotesWorkspaceStore, 'function');

  const originalStore = storeModule.notesWorkspaceStore;
  const syncRuntime = {
    async requestDrain() {
      syncRuntime.requestDrainCalls += 1;
    },
    dispose() {},
    requestDrainCalls: 0,
  };

  const configuredStore = storeModule.configureNotesWorkspaceStore({
    workspaceOrchestrator: {
      async initializeWorkspace() {
        return {
          success: true,
          data: {
            notes: [createSummary('note-1', 'Configured note')],
            trashedNotes: [],
            folders: [],
            dataSource: {
              driver: 'app-sdk',
              authority: 'remote',
              readStrategy: 'workspace-snapshot',
              writeStrategy: 'direct-write',
              capabilities: {
                localReplica: false,
                readThroughCache: false,
                offlineRead: false,
                offlineWrite: false,
                backgroundSync: false,
                incrementalSync: false,
                conflictResolution: false,
              },
            },
            activeNoteId: 'note-1',
            activeNote: createNote('note-1', 'Configured note'),
            selectedFolderId: null,
            activeNoteErrorMessage: null,
          },
        };
      },
      async loadWorkspaceNote(noteId) {
        return {
          success: true,
          data: {
            activeNote: createNote(noteId, 'Configured note'),
          },
        };
      },
    },
    syncRuntime,
  });

  assert.notEqual(configuredStore, originalStore);
  assert.equal(storeModule.notesWorkspaceStore, configuredStore);

  await storeModule.notesWorkspaceStore.getState().initialize();

  assert.equal(syncRuntime.requestDrainCalls, 1);
});

test('useNotesWorkspaceStore selectors resolve against the current exported store binding after bootstrap reconfiguration', async () => {
  const storeModule = await loadWorkspaceStoreModule();
  assert.equal(typeof storeModule.configureNotesWorkspaceStore, 'function');

  storeModule.configureNotesWorkspaceStore();
  storeModule.notesWorkspaceStore.setState({
    activeView: 'trash',
    searchQuery: 'queued sync',
  });

  assert.equal(storeModule.useNotesWorkspaceStore((state) => state.activeView), 'trash');
  assert.equal(storeModule.useNotesWorkspaceStore((state) => state.searchQuery), 'queued sync');
});

test('resetNotesWorkspaceStore restores a fresh default workspace store binding after custom bootstrap state', async () => {
  const storeModule = await loadWorkspaceStoreModule();
  assert.equal(typeof storeModule.resetNotesWorkspaceStore, 'function');

  const configuredStore = storeModule.configureNotesWorkspaceStore();
  configuredStore.setState({
    activeView: 'favorites',
  });

  const resetStore = storeModule.resetNotesWorkspaceStore();

  assert.notEqual(resetStore, configuredStore);
  assert.equal(storeModule.notesWorkspaceStore, resetStore);
  assert.equal(storeModule.useNotesWorkspaceStore((state) => state.activeView), 'all');
});

test('bootstrapNotesWorkspaceStore wires an explicit queue store into the workspace binding without fabricating a runtime', async () => {
  const bootstrapModule = await loadWorkspaceStoreBootstrapModule();
  assert.equal(typeof bootstrapModule.module.bootstrapNotesWorkspaceStore, 'function');

  const configuredStore = bootstrapModule.module.bootstrapNotesWorkspaceStore();

  assert.equal(bootstrapModule.notesSyncStub.createdQueueStores.length, 1);
  assert.equal(bootstrapModule.servicesStub.createdRuntimes.length, 0);
  assert.equal(bootstrapModule.storeStub.configureCalls.length, 1);
  assert.equal(
    bootstrapModule.storeStub.configureCalls[0].syncQueueStore,
    bootstrapModule.notesSyncStub.createdQueueStores[0],
  );
  assert.equal(Object.hasOwn(bootstrapModule.storeStub.configureCalls[0], 'syncRuntime'), false);
  assert.deepEqual(configuredStore, {
    kind: 'configured-store',
    overrides: bootstrapModule.storeStub.configureCalls[0],
  });
});

test('bootstrapNotesWorkspaceStore builds a sync runtime from an injected execute handler and reset disposes it', async () => {
  const bootstrapModule = await loadWorkspaceStoreBootstrapModule();
  assert.equal(typeof bootstrapModule.module.resetNotesWorkspaceStoreBootstrap, 'function');

  const execute = async () => ({
    type: 'completed',
    at: '2026-04-14T13:00:00.000Z',
  });

  bootstrapModule.module.bootstrapNotesWorkspaceStore({ execute });

  assert.equal(bootstrapModule.notesSyncStub.createdQueueStores.length, 1);
  assert.equal(bootstrapModule.servicesStub.createdRuntimes.length, 1);
  assert.equal(
    bootstrapModule.servicesStub.createdRuntimes[0].options.queueStore,
    bootstrapModule.notesSyncStub.createdQueueStores[0],
  );
  assert.equal(
    bootstrapModule.servicesStub.createdRuntimes[0].options.execute,
    execute,
  );
  assert.equal(
    bootstrapModule.storeStub.configureCalls.at(-1).syncRuntime,
    bootstrapModule.servicesStub.createdRuntimes[0],
  );

  const resetStore = bootstrapModule.module.resetNotesWorkspaceStoreBootstrap();

  assert.equal(bootstrapModule.servicesStub.createdRuntimes[0].disposeCalls, 1);
  assert.equal(bootstrapModule.storeStub.resetCalls, 1);
  assert.deepEqual(resetStore, {
    kind: 'reset-store',
  });
});

test('bootstrapNotesWorkspaceStore accepts an explicit remote apply handler and forwards it to the workspace sync runtime boundary', async () => {
  const bootstrapModule = await loadWorkspaceStoreBootstrapModule();

  const apply = async () => ({
    type: 'completed',
    at: '2026-04-14T13:10:00.000Z',
    remoteCursor: 'cursor-bootstrap-apply',
  });

  bootstrapModule.module.bootstrapNotesWorkspaceStore({ apply });

  assert.equal(bootstrapModule.notesSyncStub.createdQueueStores.length, 1);
  assert.equal(bootstrapModule.servicesStub.createdRuntimes.length, 1);
  assert.equal(
    bootstrapModule.servicesStub.createdRuntimes[0].options.queueStore,
    bootstrapModule.notesSyncStub.createdQueueStores[0],
  );
  assert.equal(
    bootstrapModule.servicesStub.createdRuntimes[0].options.apply,
    apply,
  );
  assert.equal(
    Object.hasOwn(bootstrapModule.servicesStub.createdRuntimes[0].options, 'execute'),
    false,
  );
  assert.equal(
    bootstrapModule.storeStub.configureCalls.at(-1).syncRuntime,
    bootstrapModule.servicesStub.createdRuntimes[0],
  );
});

test('AppProviders owns the notes workspace store bootstrap boundary at the authenticated shell layer', () => {
  const notesIndexSource = read('packages/sdkwork-notes-pc-notes/src/index.ts');
  const bootstrapIndexSource = read('packages/sdkwork-notes-pc-notes/src/bootstrap/index.ts');
  const appProvidersSource = read('packages/sdkwork-notes-pc-shell/src/application/providers/AppProviders.tsx');

  assert.match(notesIndexSource, /export \* from '\.\/bootstrap';/);
  assert.match(bootstrapIndexSource, /bootstrapNotesWorkspaceStore/);
  assert.match(bootstrapIndexSource, /resetNotesWorkspaceStoreBootstrap/);

  assert.match(
    appProvidersSource,
    /import\s*\{\s*bootstrapNotesWorkspaceStore,\s*resetNotesWorkspaceStoreBootstrap\s*\}\s*from\s*'@sdkwork\/notes-notes'/,
  );
  assert.match(appProvidersSource, /function ensureNotesWorkspaceStoreBootstrapped/);
  assert.match(
    appProvidersSource,
    /bootstrapNotesWorkspaceStore\(notesWorkspaceBootstrapOptions \?\? \{\}\)/,
  );
  assert.match(appProvidersSource, /resetNotesWorkspaceStoreBootstrap\(\)/);
});

test('AppProviders, AppRoot, and desktop bootstrap expose a single top-level injection path for workspace remote apply bootstrap options', () => {
  const bootstrapIndexSource = read('packages/sdkwork-notes-pc-notes/src/bootstrap/index.ts');
  const appProvidersSource = read('packages/sdkwork-notes-pc-shell/src/application/providers/AppProviders.tsx');
  const appRootSource = read('packages/sdkwork-notes-pc-shell/src/application/AppRoot.tsx');
  const shellIndexSource = read('packages/sdkwork-notes-pc-shell/src/index.ts');
  const desktopBootstrapAppSource = read('packages/sdkwork-notes-pc-desktop/src/desktop/bootstrap/DesktopBootstrapApp.tsx');
  const createDesktopAppSource = read('packages/sdkwork-notes-pc-desktop/src/desktop/bootstrap/createDesktopApp.tsx');

  assert.match(bootstrapIndexSource, /NotesWorkspaceStoreBootstrapOptions/);

  assert.match(appProvidersSource, /notesWorkspaceBootstrapOptions\?: NotesWorkspaceStoreBootstrapOptions/);
  assert.match(appProvidersSource, /workspaceStoreBootstrappedOptions: null as NotesWorkspaceStoreBootstrapOptions \| null/);
  assert.match(appProvidersSource, /function ensureNotesWorkspaceStoreBootstrapped\(\s*key: string,\s*notesWorkspaceBootstrapOptions: NotesWorkspaceStoreBootstrapOptions \| undefined,\s*\)/);
  assert.match(appProvidersSource, /bootstrapNotesWorkspaceStore\(notesWorkspaceBootstrapOptions \?\? \{\}\)/);
  assert.match(
    appProvidersSource,
    /export function AppProviders\(\{\s*children,\s*notesWorkspaceBootstrapOptions\s*\}: AppProvidersProps\)/,
  );
  assert.match(
    appProvidersSource,
    /<AppProvidersContent notesWorkspaceBootstrapOptions=\{notesWorkspaceBootstrapOptions\}>/,
  );

  assert.match(appRootSource, /export interface AppRootProps/);
  assert.match(appRootSource, /notesWorkspaceBootstrapOptions\?: AppProvidersProps\['notesWorkspaceBootstrapOptions'\]/);
  assert.match(appRootSource, /<AppProviders \{\.\.\.props\}>/);
  assert.match(shellIndexSource, /export \{ AppRoot, type AppRootProps \} from '\.\/application\/AppRoot';/);

  assert.match(desktopBootstrapAppSource, /import \{ AppRoot, type AppRootProps \} from '@sdkwork\/notes-shell';/);
  assert.match(desktopBootstrapAppSource, /appRootProps\?: AppRootProps;/);
  assert.match(desktopBootstrapAppSource, /<AppRoot \{\.\.\.appRootProps\} \/>/);

  assert.match(createDesktopAppSource, /export interface CreateDesktopAppOptions/);
  assert.match(createDesktopAppSource, /appRootProps\?: AppRootProps;/);
  assert.match(createDesktopAppSource, /export async function createDesktopApp\(options: CreateDesktopAppOptions = \{\}\)/);
  assert.match(createDesktopAppSource, /appRootProps=\{options\.appRootProps\}/);
});
