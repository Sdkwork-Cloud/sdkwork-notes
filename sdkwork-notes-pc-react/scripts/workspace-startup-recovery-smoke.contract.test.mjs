import assert from 'node:assert/strict';
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

async function loadTsModule(relativePath) {
  const transpiled = await transpileTypeScriptModule(relativePath);
  return import(createDataModuleUrl(transpiled.outputText));
}

async function loadWorkspaceModules() {
  const typesModuleSource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/types/notesWorkspace.ts')
  ).outputText;
  const typesModuleUrl = createDataModuleUrl(typesModuleSource);

  const orchestratorModuleSource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/services/noteWorkspaceOrchestrator.ts')
  ).outputText.replace(
    "../types/notesWorkspace",
    typesModuleUrl,
  );
  const orchestratorModuleUrl = createDataModuleUrl(orchestratorModuleSource);

  const recoveryModuleSource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/services/noteWorkspaceRecovery.ts')
  ).outputText;
  const recoveryModuleUrl = createDataModuleUrl(recoveryModuleSource);
  const notesSyncModuleSource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-sync/src/index.ts')
  ).outputText;
  const notesSyncModuleUrl = createDataModuleUrl(notesSyncModuleSource);

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
  const state = store.getState();
  return selector ? selector(state) : state;
}
`);

  const notesLocalStubUrl = createDataModuleUrl(`
const emptyWorkspace = () => ({ notes: [], folders: [], drafts: [] });

export const notesLocalStore = {
  async loadWorkspace() {
    return emptyWorkspace();
  },
  async saveDraft() {},
  async clearDraft() {},
};
`);

  const servicesStubUrl = createDataModuleUrl(`
import { createNoteWorkspaceOrchestrator } from ${JSON.stringify(orchestratorModuleUrl)};
export { createNoteWorkspaceOrchestrator };
export {
  removeNotesWorkspaceRecoveredDraft,
  resolveActiveNotesWorkspaceRecoveredDraft,
  resolveNotesWorkspaceRecoveredDrafts,
  restoreNotesWorkspaceRecoveredDraft,
} from ${JSON.stringify(recoveryModuleUrl)};

function ok(data) {
  return { success: true, data };
}

function createSummary(id, title, overrides = {}) {
  return {
    id,
    uuid: 'uuid-' + id,
    title,
    type: 'doc',
    parentId: null,
    tags: [],
    isFavorite: false,
    snippet: title,
    publishStatus: 'draft',
    createdAt: '2026-04-13T00:00:00.000Z',
    updatedAt: '2026-04-13T00:00:00.000Z',
    ...overrides,
  };
}

export async function captureNotesWorkspaceExitRecoverySnapshot() {
  return false;
}

export async function clearNotesWorkspaceExitRecoverySnapshot() {}

export function createNotesWorkspaceWriteCoordinator() {
  return {
    async createNoteState() {
      return { status: 'error', errorMessage: 'not implemented in contract' };
    },
    async createFolderState() {
      return { status: 'error', errorMessage: 'not implemented in contract' };
    },
    async renameFolderState() {
      return { status: 'error', errorMessage: 'not implemented in contract' };
    },
    async moveNoteState() {
      return { status: 'error', errorMessage: 'not implemented in contract' };
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
    async recordRetryRecovered() {},
    async recordRetryExhausted() {},
    async recordRetryScheduled() {},
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
    return ok({
      notes: [],
      trashedNotes: [],
      folders: [],
    });
  },
  async findById() {
    return ok(null);
  },
  async save(entity) {
    return ok(createSummary(entity?.id ?? 'note-default', entity?.title ?? 'Untitled'));
  },
  async createFolder(name, parentId) {
    return ok({
      id: 'folder-default',
      uuid: 'folder-folder-default',
      name,
      parentId: parentId ?? null,
      createdAt: '2026-04-13T00:00:00.000Z',
      updatedAt: '2026-04-13T00:00:00.000Z',
    });
  },
  async renameFolder(id) {
    return ok(id);
  },
  async moveFolder() {
    return ok(undefined);
  },
  async deleteFolder() {
    return ok(undefined);
  },
  async moveNote() {
    return ok(undefined);
  },
  async moveToTrash(id) {
    return ok(createSummary(id, 'Trashed ' + id, {
      deletedAt: '2026-04-13T00:00:00.000Z',
    }));
  },
  async restoreFromTrash(id) {
    return ok(createSummary(id, 'Restored ' + id));
  },
  async deleteById() {
    return ok(undefined);
  },
  async clearTrash() {
    return ok(0);
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

export function resolveNotesWorkspaceSaveSuccessState(currentSaveState) {
  return currentSaveState === 'retrying' ? 'saved' : 'saved';
}
`);

  const workspaceStoreSource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts')
  ).outputText;
  let patchedWorkspaceStoreSource = workspaceStoreSource;
  patchedWorkspaceStoreSource = replaceModuleSpecifier(
    patchedWorkspaceStoreSource,
    'zustand',
    zustandStubUrl,
  );
  patchedWorkspaceStoreSource = replaceModuleSpecifier(
    patchedWorkspaceStoreSource,
    'zustand/vanilla',
    zustandVanillaStubUrl,
  );
  patchedWorkspaceStoreSource = replaceModuleSpecifier(
    patchedWorkspaceStoreSource,
    '@sdkwork/notes-local',
    notesLocalStubUrl,
  );
  patchedWorkspaceStoreSource = replaceModuleSpecifier(
    patchedWorkspaceStoreSource,
    '@sdkwork/notes-sync',
    notesSyncModuleUrl,
  );
  patchedWorkspaceStoreSource = replaceModuleSpecifier(
    patchedWorkspaceStoreSource,
    '../services',
    servicesStubUrl,
  );
  patchedWorkspaceStoreSource = replaceModuleSpecifier(
    patchedWorkspaceStoreSource,
    '../types/notesWorkspace',
    typesModuleUrl,
  );

  const storeModule = await import(createDataModuleUrl(patchedWorkspaceStoreSource));
  const notesLocalModule = await loadTsModule('packages/sdkwork-notes-local/src/index.ts');
  const typesModule = await import(typesModuleUrl);
  const orchestratorModule = await import(orchestratorModuleUrl);

  return {
    notesLocalModule,
    typesModule,
    orchestratorModule,
    storeModule,
  };
}

function ok(data) {
  return {
    success: true,
    data,
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
    createdAt: '2026-04-13T08:00:00.000Z',
    updatedAt: '2026-04-13T09:00:00.000Z',
    ...overrides,
  };
}

function createNote(id, title, overrides = {}) {
  return {
    ...createSummary(id, title),
    content: `${title} content`,
    ...overrides,
  };
}

function createMemoryStorage() {
  const records = new Map();
  return {
    getItem(key) {
      return records.has(key) ? records.get(key) : null;
    },
    setItem(key, value) {
      records.set(key, value);
    },
    removeItem(key) {
      records.delete(key);
    },
  };
}

function createWorkspaceService(typesModule, overrides = {}) {
  const notes = overrides.notes ?? [
    createSummary('note-1', 'Alpha', { updatedAt: '2026-04-13T11:00:00.000Z' }),
    createSummary('note-2', 'Beta', { updatedAt: '2026-04-13T10:00:00.000Z' }),
  ];
  const trashedNotes = overrides.trashedNotes ?? [];
  const folders = overrides.folders ?? [];
  const noteDetails = new Map(
    (overrides.noteDetails ?? notes.map((note) => [
      note.id,
      createNote(note.id, note.title, {
        type: note.type,
        parentId: note.parentId,
        tags: [...note.tags],
        isFavorite: note.isFavorite,
        publishStatus: note.publishStatus,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt,
      }),
    ])).map((entry) => entry),
  );

  return {
    async queryWorkspaceSnapshot() {
      return ok({
        notes,
        trashedNotes,
        folders,
        dataSource: typesModule.createRemoteAppSdkNoteWorkspaceDataSource(),
      });
    },
    async findById(id) {
      return ok(noteDetails.get(id) ?? null);
    },
  };
}

function createDraft(noteId, title, overrides = {}) {
  return {
    noteId,
    capturedAt: '2026-04-13T11:30:00.000Z',
    revision: 1130,
    trigger: 'pagehide',
    saveState: 'dirty',
    draft: {
      title,
      content: `<p>${title} local draft</p>`,
      type: 'doc',
      parentId: null,
      tags: [],
      isFavorite: false,
      publishStatus: 'draft',
    },
    ...overrides,
  };
}

async function initializeStoreWithLocalPayload(options = {}) {
  const modules = await loadWorkspaceModules();
  const storage = createMemoryStorage();
  const storageKey = 'sdkwork-notes-local-startup-smoke';
  if (Object.prototype.hasOwnProperty.call(options, 'rawStorageValue')) {
    if (options.rawStorageValue === null) {
      storage.removeItem(storageKey);
    } else {
      storage.setItem(storageKey, options.rawStorageValue);
    }
  }

  const localStore = options.localStore ?? modules.notesLocalModule.createBrowserNotesLocalStore({
    storage,
    storageKey,
  });
  const workspaceService = createWorkspaceService(modules.typesModule, options.workspaceServiceOverrides);
  const workspaceOrchestrator = options.workspaceOrchestrator
    ?? modules.orchestratorModule.createNoteWorkspaceOrchestrator(workspaceService);

  const store = modules.storeModule.createNotesWorkspaceStore({
    workspaceService,
    workspaceOrchestrator,
    localStore,
    layoutService: {
      getSidebarWidth(fallback = 320) {
        return fallback;
      },
      saveSidebarWidth() {},
    },
  });

  await store.getState().initialize();
  return store.getState();
}

const modules = await loadWorkspaceModules();

test('startup initialize restores recovered drafts from the current local workspace envelope for the resolved active note', async () => {
  const rawStorageValue = JSON.stringify({
    version: modules.notesLocalModule.NOTES_LOCAL_WORKSPACE_SCHEMA_VERSION,
    workspace: {
      notes: [],
      folders: [],
      drafts: [
        createDraft('note-1', 'Recovered Alpha', {
          revision: 200,
          capturedAt: '2026-04-13T11:50:00.000Z',
        }),
      ],
    },
  });

  const state = await initializeStoreWithLocalPayload({ rawStorageValue });

  assert.equal(state.activeNoteId, 'note-1');
  assert.equal(state.recoveredDrafts.length, 1);
  assert.equal(state.recoveredDrafts[0].noteId, 'note-1');
  assert.equal(state.recoveredDrafts[0].remoteTitle, 'Alpha');
  assert.equal(state.activeRecoveredDraft?.noteId, 'note-1');
  assert.equal(state.activeRecoveredDraft?.draft.content, '<p>Recovered Alpha local draft</p>');
});

test('startup initialize also accepts legacy raw workspace snapshots without the version envelope', async () => {
  const rawStorageValue = JSON.stringify({
    notes: [],
    folders: [],
    drafts: [
      createDraft('note-1', 'Legacy Alpha', {
        revision: 201,
        capturedAt: '2026-04-13T11:55:00.000Z',
      }),
    ],
  });

  const state = await initializeStoreWithLocalPayload({ rawStorageValue });

  assert.equal(state.recoveredDrafts.length, 1);
  assert.equal(state.recoveredDrafts[0].noteId, 'note-1');
  assert.equal(state.activeRecoveredDraft?.noteId, 'note-1');
  assert.equal(state.activeRecoveredDraft?.draft.title, 'Legacy Alpha');
});

test('startup initialize ignores unknown-version local payloads and still resolves the remote workspace', async () => {
  const rawStorageValue = JSON.stringify({
    version: modules.notesLocalModule.NOTES_LOCAL_WORKSPACE_SCHEMA_VERSION + 1,
    workspace: {
      notes: [],
      folders: [],
      drafts: [
        createDraft('note-1', 'Ignored Alpha'),
      ],
    },
  });

  const state = await initializeStoreWithLocalPayload({ rawStorageValue });

  assert.equal(state.activeNoteId, 'note-1');
  assert.equal(state.notes.length, 2);
  assert.deepEqual(state.recoveredDrafts, []);
  assert.equal(state.activeRecoveredDraft, null);
});

test('startup initialize ignores corrupted local payloads and still boots without recovery state', async () => {
  const state = await initializeStoreWithLocalPayload({
    rawStorageValue: '{"version":1,"workspace":',
  });

  assert.equal(state.activeNoteId, 'note-1');
  assert.equal(state.notes.length, 2);
  assert.deepEqual(state.recoveredDrafts, []);
  assert.equal(state.activeRecoveredDraft, null);
});

test('startup initialize survives local workspace load failures and falls back to an empty recovery snapshot', async () => {
  const state = await initializeStoreWithLocalPayload({
    localStore: {
      async loadWorkspace() {
        throw new Error('local load failed');
      },
      async saveDraft() {},
      async clearDraft() {},
    },
  });

  assert.equal(state.activeNoteId, 'note-1');
  assert.equal(state.notes.length, 2);
  assert.deepEqual(state.recoveredDrafts, []);
  assert.equal(state.activeRecoveredDraft, null);
});

test('startup initialize filters recovery candidates that already belong to trash or no longer exist remotely', async () => {
  const rawStorageValue = JSON.stringify({
    version: modules.notesLocalModule.NOTES_LOCAL_WORKSPACE_SCHEMA_VERSION,
    workspace: {
      notes: [],
      folders: [],
      drafts: [
        createDraft('note-1', 'Recovered Live', {
          revision: 220,
          capturedAt: '2026-04-13T11:58:00.000Z',
        }),
        createDraft('note-2', 'Recovered Trash', {
          revision: 230,
          capturedAt: '2026-04-13T11:59:00.000Z',
        }),
        createDraft('note-missing', 'Recovered Missing', {
          revision: 240,
          capturedAt: '2026-04-13T12:00:00.000Z',
        }),
      ],
    },
  });

  const state = await initializeStoreWithLocalPayload({
    rawStorageValue,
    workspaceServiceOverrides: {
      notes: [
        createSummary('note-1', 'Alpha', { updatedAt: '2026-04-13T11:00:00.000Z' }),
      ],
      trashedNotes: [
        createSummary('note-2', 'Beta trash', {
          deletedAt: '2026-04-13T11:10:00.000Z',
          updatedAt: '2026-04-13T11:10:00.000Z',
        }),
      ],
      noteDetails: [
        ['note-1', createNote('note-1', 'Alpha', { updatedAt: '2026-04-13T11:00:00.000Z' })],
      ],
    },
  });

  assert.equal(state.recoveredDrafts.length, 1);
  assert.equal(state.recoveredDrafts[0].noteId, 'note-1');
  assert.equal(state.activeRecoveredDraft?.noteId, 'note-1');
});
