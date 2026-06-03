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

async function loadNotesWorkspaceSyncRuntimeModule() {
  const notesSyncModuleUrl = createDataModuleUrl(
    (
      await transpileTypeScriptModule('packages/sdkwork-notes-sync/src/index.ts')
    ).outputText,
  );
  const runtimeSource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/services/noteWorkspaceSyncRuntime.ts')
  ).outputText;
  const patchedRuntimeSource = replaceModuleSpecifier(
    runtimeSource,
    '@sdkwork/notes-sync',
    notesSyncModuleUrl,
  );

  return {
    notesSyncModule: await import(notesSyncModuleUrl),
    runtimeModule: await import(createDataModuleUrl(patchedRuntimeSource)),
  };
}

async function loadWorkspaceStoreModule() {
  const typesModuleUrl = createDataModuleUrl(
    (
      await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/types/notesWorkspace.ts')
    ).outputText,
  );
  const notesSyncModuleUrl = createDataModuleUrl(
    (
      await transpileTypeScriptModule('packages/sdkwork-notes-sync/src/index.ts')
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
  const state = store.getState();
  return selector ? selector(state) : state;
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
let createNoteStateResult = {
  status: 'error',
  createdNoteId: '',
  errorMessage: 'createNoteStateResult not configured',
};

let moveNoteStateResult = {
  status: 'error',
  nextParentId: null,
  errorMessage: 'moveNoteStateResult not configured',
};

export function __setCreateNoteStateResult(nextValue) {
  createNoteStateResult = nextValue;
}

export function __setMoveNoteStateResult(nextValue) {
  moveNoteStateResult = nextValue;
}

export async function captureNotesWorkspaceExitRecoverySnapshot() {
  return false;
}

export async function clearNotesWorkspaceExitRecoverySnapshot() {}

export function createNotesWorkspaceWriteCoordinator() {
  return {
    async createNoteState() {
      return createNoteStateResult;
    },
    async createFolderState() {
      return { status: 'error', createdFolderId: '', errorMessage: 'not used' };
    },
    async renameFolderState() {
      return { status: 'error', resolvedFolderId: '', errorMessage: 'not used' };
    },
    async moveNoteState() {
      return moveNoteStateResult;
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
        createdAt: '2026-04-14T00:00:00.000Z',
        updatedAt: '2026-04-14T00:00:00.000Z',
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
        createdAt: '2026-04-14T00:00:00.000Z',
        updatedAt: '2026-04-14T00:00:00.000Z',
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
        createdAt: '2026-04-14T00:00:00.000Z',
        updatedAt: '2026-04-14T00:00:00.000Z',
        deletedAt: '2026-04-14T00:00:00.000Z',
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
        createdAt: '2026-04-14T00:00:00.000Z',
        updatedAt: '2026-04-14T00:00:00.000Z',
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
    await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts')
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
          '@sdkwork/notes-local',
          notesLocalStubUrl,
        ),
        '@sdkwork/notes-sync',
        notesSyncModuleUrl,
      ),
      '../services',
      servicesStubUrl,
    ),
    '../types/notesWorkspace',
    typesModuleUrl,
  );

  return {
    servicesModule: await import(servicesStubUrl),
    storeModule: await import(createDataModuleUrl(patchedWorkspaceStoreSource)),
    typesModule: await import(typesModuleUrl),
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
    createdAt: '2026-04-14T09:00:00.000Z',
    updatedAt: '2026-04-14T09:00:00.000Z',
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

test('notes workspace sync runtime delegates queue draining to the notes sync worker runtime boundary', async () => {
  const { notesSyncModule, runtimeModule } = await loadNotesWorkspaceSyncRuntimeModule();
  const queueStore = {
    snapshot: {
      tasks: [
        notesSyncModule.createNotesSyncTask({
          id: 'note-sync-runtime-1',
          entityType: 'note',
          entityId: 'note-1',
          operation: 'upsert',
          at: '2026-04-14T09:20:00.000Z',
          replayable: true,
          mutation: {
            patch: {
              title: 'Runtime boundary note',
            },
          },
        }),
      ],
    },
    async loadQueue() {
      return this.snapshot;
    },
    async saveQueue(snapshot) {
      this.snapshot = snapshot;
    },
    async clearQueue() {
      this.snapshot = { tasks: [] };
    },
  };

  const runtime = runtimeModule.createNotesWorkspaceSyncRuntime({
    queueStore,
    now: () => '2026-04-14T09:21:00.000Z',
    async execute(task) {
      return {
        type: 'completed',
        at: task.id === 'note-sync-runtime-1'
          ? '2026-04-14T09:21:01.000Z'
          : '2026-04-14T09:21:02.000Z',
      };
    },
  });

  await runtime.requestDrain();

  assert.deepEqual(
    queueStore.snapshot.tasks.map((task) => [task.id, task.status]),
    [['note-sync-runtime-1', 'completed']],
  );
});

test('notes workspace sync runtime can adapt an explicit remote apply handler into the worker execute boundary', async () => {
  const { notesSyncModule, runtimeModule } = await loadNotesWorkspaceSyncRuntimeModule();
  const queueStore = {
    snapshot: {
      tasks: [
        notesSyncModule.createNotesSyncTask({
          id: 'note-sync-runtime-apply-1',
          entityType: 'note',
          entityId: 'note-apply-1',
          operation: 'restore',
          at: '2026-04-14T09:22:00.000Z',
          replayable: true,
          mutation: {
            intent: 'restore-from-trash',
          },
          localRevision: 7,
          remoteCursor: 'cursor-before-apply',
        }),
      ],
    },
    async loadQueue() {
      return this.snapshot;
    },
    async saveQueue(snapshot) {
      this.snapshot = snapshot;
    },
    async clearQueue() {
      this.snapshot = { tasks: [] };
    },
  };

  const applyRequests = [];
  const runtime = runtimeModule.createNotesWorkspaceSyncRuntime({
    queueStore,
    now: () => '2026-04-14T09:22:10.000Z',
    async apply(request) {
      applyRequests.push(request);
      return {
        type: 'completed',
        at: '2026-04-14T09:22:11.000Z',
        remoteCursor: 'cursor-after-apply',
      };
    },
  });

  await runtime.requestDrain();

  assert.deepEqual(applyRequests, [
    {
      idempotencyKey: 'note-sync-runtime-apply-1',
      taskId: 'note-sync-runtime-apply-1',
      entityType: 'note',
      entityId: 'note-apply-1',
      operation: 'restore',
      localRevision: 7,
      baseRemoteCursor: 'cursor-before-apply',
      mutation: {
        intent: 'restore-from-trash',
      },
    },
  ]);
  assert.deepEqual(
    queueStore.snapshot.tasks.map((task) => [task.id, task.status, task.remoteCursor]),
    [['note-sync-runtime-apply-1', 'completed', 'cursor-after-apply']],
  );
});

test('createNote requests a sync drain after a queued sync task is persisted when a runtime is available', async () => {
  const { servicesModule, storeModule } = await loadWorkspaceStoreModule();
  const createdSummary = createSummary('note-42', 'Shipping checklist', {
    type: 'article',
    updatedAt: '2026-04-14T09:30:00.000Z',
  });
  const createdDetail = createNote('note-42', 'Shipping checklist', {
    type: 'article',
    content: '<p>Ready to ship</p>',
    updatedAt: '2026-04-14T09:30:00.000Z',
  });

  servicesModule.__setCreateNoteStateResult({
    status: 'apply',
    createdNoteId: 'note-42',
    errorMessage: null,
    notes: [createdSummary],
    trashedNotes: [],
    activeNoteId: 'note-42',
    activeNote: createdDetail,
    activeView: 'all',
    selectedFolderId: null,
    expandedFolderIds: [],
  });

  const syncQueueStore = {
    async loadQueue() {
      return { tasks: [] };
    },
    async saveQueue(snapshot) {
      syncQueueStore.savedSnapshots.push(snapshot);
    },
    async clearQueue() {},
    savedSnapshots: [],
  };
  const syncRuntime = {
    async requestDrain() {
      syncRuntime.requestDrainCalls += 1;
    },
    dispose() {},
    requestDrainCalls: 0,
  };

  const store = storeModule.createNotesWorkspaceStore({
    workspaceService: servicesModule.noteWorkspaceService,
    layoutService: {
      getSidebarWidth() {
        return 300;
      },
      saveSidebarWidth() {},
    },
    workspaceOrchestrator: servicesModule.createNoteWorkspaceOrchestrator(
      servicesModule.noteWorkspaceService,
    ),
    syncQueueStore,
    syncRuntime,
  });

  const createdId = await store.getState().createNote({
    title: 'Shipping checklist',
    type: 'article',
    parentId: null,
  });

  assert.equal(createdId, 'note-42');
  assert.equal(syncQueueStore.savedSnapshots.length, 1);
  assert.equal(syncRuntime.requestDrainCalls, 1);
});

test('initialize requests a sync drain so queued tasks can replay after workspace bootstrap when a runtime is available', async () => {
  const { servicesModule, storeModule, typesModule } = await loadWorkspaceStoreModule();
  const syncRuntime = {
    async requestDrain() {
      syncRuntime.requestDrainCalls += 1;
    },
    dispose() {},
    requestDrainCalls: 0,
  };

  const workspaceOrchestrator = {
    async initializeWorkspace() {
      return {
        success: true,
        data: {
          notes: [createSummary('note-1', 'Project brief')],
          trashedNotes: [],
          folders: [],
          dataSource: typesModule.createRemoteAppSdkNoteWorkspaceDataSource(),
          activeNoteId: 'note-1',
          activeNote: createNote('note-1', 'Project brief'),
          selectedFolderId: null,
          activeNoteErrorMessage: null,
        },
      };
    },
    async loadWorkspaceNote(noteId) {
      return {
        success: true,
        data: {
          activeNote: createNote(noteId, 'Project brief'),
        },
      };
    },
  };

  const store = storeModule.createNotesWorkspaceStore({
    workspaceService: servicesModule.noteWorkspaceService,
    layoutService: {
      getSidebarWidth() {
        return 360;
      },
      saveSidebarWidth() {},
    },
    workspaceOrchestrator,
    syncRuntime,
  });

  await store.getState().initialize();

  assert.equal(store.getState().activeNoteId, 'note-1');
  assert.equal(syncRuntime.requestDrainCalls, 1);
});

test('workspace store surfaces the latest sync queue snapshot to UI consumers and exposes a manual drain action', async () => {
  const { notesSyncModule } = await loadNotesWorkspaceSyncRuntimeModule();
  const { servicesModule, storeModule, typesModule } = await loadWorkspaceStoreModule();
  const queuedTask = notesSyncModule.createNotesSyncTask({
    id: 'note-sync-ui-1',
    entityType: 'note',
    entityId: 'note-1',
    operation: 'upsert',
    at: '2026-04-14T10:00:00.000Z',
    replayable: true,
    mutation: {
      patch: {
        title: 'Queued sync note',
      },
    },
  });
  const listeners = new Set();
  const syncQueueStore = {
    snapshot: {
      tasks: [queuedTask],
    },
    async loadQueue() {
      return this.snapshot;
    },
    async saveQueue(snapshot) {
      this.snapshot = snapshot;
      for (const listener of listeners) {
        listener(snapshot);
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const syncRuntime = {
    async requestDrain() {
      syncRuntime.requestDrainCalls += 1;
    },
    dispose() {},
    requestDrainCalls: 0,
  };

  const workspaceOrchestrator = {
    async initializeWorkspace() {
      return {
        success: true,
        data: {
          notes: [createSummary('note-1', 'Project brief')],
          trashedNotes: [],
          folders: [],
          dataSource: typesModule.createRemoteAppSdkNoteWorkspaceDataSource(),
          activeNoteId: 'note-1',
          activeNote: createNote('note-1', 'Project brief'),
          selectedFolderId: null,
          activeNoteErrorMessage: null,
        },
      };
    },
    async loadWorkspaceNote(noteId) {
      return {
        success: true,
        data: {
          activeNote: createNote(noteId, 'Project brief'),
        },
      };
    },
  };

  const store = storeModule.createNotesWorkspaceStore({
    workspaceService: servicesModule.noteWorkspaceService,
    layoutService: {
      getSidebarWidth() {
        return 360;
      },
      saveSidebarWidth() {},
    },
    workspaceOrchestrator,
    syncQueueStore,
    syncRuntime,
  });

  await store.getState().initialize();

  assert.deepEqual(
    store.getState().syncQueueSnapshot.tasks.map((task) => [task.id, task.status]),
    [['note-sync-ui-1', 'queued']],
  );

  await syncQueueStore.saveQueue({
    tasks: [],
  });

  assert.deepEqual(
    store.getState().syncQueueSnapshot.tasks,
    [],
  );

  const didRequestDrain = await store.getState().requestSyncDrain();

  assert.equal(didRequestDrain, true);
  assert.equal(syncRuntime.requestDrainCalls, 2);
});
