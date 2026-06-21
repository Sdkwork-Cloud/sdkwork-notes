import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { applyContractModuleStubs } from './contract-transpile-helpers.mjs';

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

async function loadWorkspaceStoreModule() {
  const typesModuleUrl = createDataModuleUrl(
    (
      await transpileTypeScriptModule('packages/sdkwork-notes-pc-notes/src/types/notesWorkspace.ts')
    ).outputText,
  );
  const notesSyncModuleUrl = createDataModuleUrl(
    applyContractModuleStubs(
      (
        await transpileTypeScriptModule('packages/sdkwork-notes-pc-sync/src/index.ts')
      ).outputText,
    ),
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
        createdAt: '2026-04-13T14:00:00.000Z',
        updatedAt: '2026-04-13T14:00:00.000Z',
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
        createdAt: '2026-04-13T14:00:00.000Z',
        updatedAt: '2026-04-13T14:00:00.000Z',
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
        createdAt: '2026-04-13T14:00:00.000Z',
        updatedAt: '2026-04-13T14:00:00.000Z',
        deletedAt: '2026-04-13T14:00:00.000Z',
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
        createdAt: '2026-04-13T14:00:00.000Z',
        updatedAt: '2026-04-13T14:00:00.000Z',
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

  return {
    servicesModule: await import(servicesStubUrl),
    storeModule: await import(createDataModuleUrl(applyContractModuleStubs(patchedWorkspaceStoreSource))),
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
    createdAt: '2026-04-13T14:00:00.000Z',
    updatedAt: '2026-04-13T14:00:00.000Z',
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

function createUpsertMutation(patch) {
  return { patch };
}

function createMoveMutation(targetParentId) {
  return { targetParentId };
}

function createIntentMutation(intent) {
  return { intent };
}

function assertQueuedTaskReplayDisabled(task) {
  assert.equal(task.replayable, false);
}

test('createNote enqueues a queued sync task after the write path applies the created note state', async () => {
  const { servicesModule, storeModule } = await loadWorkspaceStoreModule();
  const createdSummary = createSummary('note-42', 'Shipping checklist', {
    type: 'article',
    updatedAt: '2026-04-13T14:00:00.000Z',
  });
  const createdDetail = createNote('note-42', 'Shipping checklist', {
    type: 'article',
    content: '<p>Ready to ship</p>',
    updatedAt: '2026-04-13T14:00:00.000Z',
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

  const loadQueueCalls = [];
  const savedSnapshots = [];
  const syncQueueStore = {
    async loadQueue() {
      loadQueueCalls.push('load');
      return { tasks: [] };
    },
    async saveQueue(snapshot) {
      savedSnapshots.push(snapshot);
    },
    async clearQueue() {},
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
  });

  const createdId = await store.getState().createNote({
    title: 'Shipping checklist',
    type: 'article',
    parentId: null,
  });

  assert.equal(createdId, 'note-42');
  assert.equal(store.getState().activeNoteId, 'note-42');
  assert.equal(store.getState().activeNote?.content, '<p>Ready to ship</p>');
  assert.equal(loadQueueCalls.length, 1);
  assert.equal(savedSnapshots.length, 1);

  const snapshot = savedSnapshots[0];
  assert.equal(Array.isArray(snapshot.tasks), true);
  assert.equal(snapshot.tasks.length, 1);

  const queuedTask = snapshot.tasks[0];
  assertQueuedTaskReplayDisabled(queuedTask);
  assert.equal(typeof queuedTask.id, 'string');
  assert.notEqual(queuedTask.id.length, 0);
  assert.equal(queuedTask.entityType, 'note');
  assert.equal(queuedTask.entityId, 'note-42');
  assert.equal(queuedTask.operation, 'upsert');
  assert.deepEqual(queuedTask.mutation, createUpsertMutation({
    title: 'Shipping checklist',
    content: '<p>Ready to ship</p>',
    type: 'article',
    parentId: null,
    tags: [],
    isFavorite: false,
    publishStatus: 'draft',
  }));
  assert.equal(queuedTask.status, 'queued');
  assert.equal(queuedTask.createdAt, '2026-04-13T14:00:00.000Z');
  assert.equal(queuedTask.updatedAt, '2026-04-13T14:00:00.000Z');
  assert.equal(queuedTask.enqueuedAt, '2026-04-13T14:00:00.000Z');
  assert.equal(queuedTask.startedAt, null);
  assert.equal(queuedTask.completedAt, null);
  assert.equal(queuedTask.nextRetryAt, null);
  assert.equal(queuedTask.retryCount, 0);
  assert.equal(queuedTask.attemptCount, 0);
  assert.equal(queuedTask.localRevision, null);
  assert.equal(queuedTask.remoteCursor, null);
  assert.equal(queuedTask.lastFailure, null);
  assert.equal(queuedTask.lastConflict, null);
});

test('persistActiveNote enqueues a queued sync task after the active draft is saved successfully', async () => {
  const { servicesModule, storeModule } = await loadWorkspaceStoreModule();
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
  });

  store.setState({
    notes: [
      createSummary('note-7', 'Architecture review', {
        publishStatus: 'draft',
        updatedAt: '2026-04-13T13:58:00.000Z',
      }),
    ],
    trashedNotes: [],
    activeNoteId: 'note-7',
    activeNote: createNote('note-7', 'Architecture review', {
      content: '<p>updated locally</p>',
      publishStatus: 'archived',
      updatedAt: '2026-04-13T13:59:00.000Z',
    }),
    recoveredDrafts: [],
    activeRecoveredDraft: null,
    saveState: 'dirty',
    errorMessage: null,
  });

  const saved = await store.getState().persistActiveNote();

  assert.equal(saved, true);
  assert.equal(syncQueueStore.savedSnapshots.length, 1);

  const snapshot = syncQueueStore.savedSnapshots[0];
  assert.equal(Array.isArray(snapshot.tasks), true);
  assert.equal(snapshot.tasks.length, 1);

  const queuedTask = snapshot.tasks[0];
  assertQueuedTaskReplayDisabled(queuedTask);
  assert.equal(queuedTask.entityType, 'note');
  assert.equal(queuedTask.entityId, 'note-7');
  assert.equal(queuedTask.operation, 'upsert');
  assert.deepEqual(queuedTask.mutation, createUpsertMutation({
    title: 'Architecture review',
    content: '<p>updated locally</p>',
    type: 'doc',
    parentId: null,
    tags: [],
    isFavorite: false,
    publishStatus: 'archived',
  }));
  assert.equal(queuedTask.status, 'queued');
  assert.equal(queuedTask.createdAt, '2026-04-13T13:59:00.000Z');
  assert.equal(queuedTask.updatedAt, '2026-04-13T13:59:00.000Z');
  assert.equal(queuedTask.enqueuedAt, '2026-04-13T13:59:00.000Z');
  assert.equal(queuedTask.startedAt, null);
  assert.equal(queuedTask.completedAt, null);
  assert.equal(queuedTask.nextRetryAt, null);
  assert.equal(queuedTask.retryCount, 0);
  assert.equal(queuedTask.attemptCount, 0);
  assert.equal(queuedTask.localRevision, null);
  assert.equal(queuedTask.remoteCursor, null);
  assert.equal(queuedTask.lastFailure, null);
  assert.equal(queuedTask.lastConflict, null);
});

test('moveNoteToTrash enqueues a queued delete sync task after the note is trashed successfully', async () => {
  const { servicesModule, storeModule } = await loadWorkspaceStoreModule();
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

  const workspaceService = {
    ...servicesModule.noteWorkspaceService,
    async moveToTrash(id) {
      return {
        success: true,
        data: createSummary(id, `Trashed ${id}`, {
          updatedAt: '2026-04-13T14:10:00.000Z',
          deletedAt: '2026-04-13T14:11:00.000Z',
        }),
      };
    },
  };

  const store = storeModule.createNotesWorkspaceStore({
    workspaceService,
    layoutService: {
      getSidebarWidth() {
        return 300;
      },
      saveSidebarWidth() {},
    },
    workspaceOrchestrator: servicesModule.createNoteWorkspaceOrchestrator(workspaceService),
    syncQueueStore,
  });

  store.setState({
    notes: [
      createSummary('note-9', 'Trash me', {
        updatedAt: '2026-04-13T14:09:00.000Z',
      }),
    ],
    trashedNotes: [],
    activeNoteId: null,
    activeNote: null,
    recoveredDrafts: [],
    activeRecoveredDraft: null,
    saveState: 'idle',
    errorMessage: null,
  });

  const moved = await store.getState().moveNoteToTrash('note-9');

  assert.equal(moved, true);
  assert.equal(syncQueueStore.savedSnapshots.length, 1);

  const snapshot = syncQueueStore.savedSnapshots[0];
  assert.equal(Array.isArray(snapshot.tasks), true);
  assert.equal(snapshot.tasks.length, 1);

  const queuedTask = snapshot.tasks[0];
  assertQueuedTaskReplayDisabled(queuedTask);
  assert.equal(queuedTask.entityType, 'note');
  assert.equal(queuedTask.entityId, 'note-9');
  assert.equal(queuedTask.operation, 'delete');
  assert.deepEqual(queuedTask.mutation, createIntentMutation('move-to-trash'));
  assert.equal(queuedTask.status, 'queued');
  assert.equal(queuedTask.createdAt, '2026-04-13T14:11:00.000Z');
  assert.equal(queuedTask.updatedAt, '2026-04-13T14:11:00.000Z');
  assert.equal(queuedTask.enqueuedAt, '2026-04-13T14:11:00.000Z');
  assert.equal(queuedTask.startedAt, null);
  assert.equal(queuedTask.completedAt, null);
  assert.equal(queuedTask.nextRetryAt, null);
  assert.equal(queuedTask.retryCount, 0);
  assert.equal(queuedTask.attemptCount, 0);
  assert.equal(queuedTask.localRevision, null);
  assert.equal(queuedTask.remoteCursor, null);
  assert.equal(queuedTask.lastFailure, null);
  assert.equal(queuedTask.lastConflict, null);
});

test('restoreNoteFromTrash enqueues a queued restore sync task after the note is restored successfully', async () => {
  const { servicesModule, storeModule } = await loadWorkspaceStoreModule();
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

  const workspaceService = {
    ...servicesModule.noteWorkspaceService,
    async restoreFromTrash(id) {
      return {
        success: true,
        data: createSummary(id, `Restored ${id}`, {
          updatedAt: '2026-04-13T14:21:00.000Z',
          deletedAt: undefined,
        }),
      };
    },
  };

  const store = storeModule.createNotesWorkspaceStore({
    workspaceService,
    layoutService: {
      getSidebarWidth() {
        return 300;
      },
      saveSidebarWidth() {},
    },
    workspaceOrchestrator: servicesModule.createNoteWorkspaceOrchestrator(workspaceService),
    syncQueueStore,
  });

  store.setState({
    notes: [],
    trashedNotes: [
      createSummary('note-12', 'Restore me', {
        updatedAt: '2026-04-13T14:19:00.000Z',
        deletedAt: '2026-04-13T14:20:00.000Z',
      }),
    ],
    activeNoteId: null,
    activeNote: null,
    recoveredDrafts: [],
    activeRecoveredDraft: null,
    saveState: 'idle',
    errorMessage: null,
  });

  const restored = await store.getState().restoreNoteFromTrash('note-12');

  assert.equal(restored, true);
  assert.equal(syncQueueStore.savedSnapshots.length, 1);

  const snapshot = syncQueueStore.savedSnapshots[0];
  assert.equal(Array.isArray(snapshot.tasks), true);
  assert.equal(snapshot.tasks.length, 1);

  const queuedTask = snapshot.tasks[0];
  assertQueuedTaskReplayDisabled(queuedTask);
  assert.equal(queuedTask.entityType, 'note');
  assert.equal(queuedTask.entityId, 'note-12');
  assert.equal(queuedTask.operation, 'restore');
  assert.deepEqual(queuedTask.mutation, createIntentMutation('restore-from-trash'));
  assert.equal(queuedTask.status, 'queued');
  assert.equal(queuedTask.createdAt, '2026-04-13T14:21:00.000Z');
  assert.equal(queuedTask.updatedAt, '2026-04-13T14:21:00.000Z');
  assert.equal(queuedTask.enqueuedAt, '2026-04-13T14:21:00.000Z');
  assert.equal(queuedTask.startedAt, null);
  assert.equal(queuedTask.completedAt, null);
  assert.equal(queuedTask.nextRetryAt, null);
  assert.equal(queuedTask.retryCount, 0);
  assert.equal(queuedTask.attemptCount, 0);
  assert.equal(queuedTask.localRevision, null);
  assert.equal(queuedTask.remoteCursor, null);
  assert.equal(queuedTask.lastFailure, null);
  assert.equal(queuedTask.lastConflict, null);
});

test('moveNote enqueues a queued move sync task after the note is moved successfully', async () => {
  const { servicesModule, storeModule } = await loadWorkspaceStoreModule();
  servicesModule.__setMoveNoteStateResult({
    status: 'apply',
    notes: [
      createSummary('note-15', 'Moved note', {
        parentId: 'folder-2',
        updatedAt: '2026-04-13T14:31:00.000Z',
      }),
    ],
    activeNote: null,
    expandedFolderIds: ['folder-2'],
    nextParentId: 'folder-2',
    errorMessage: null,
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
  });

  store.setState({
    notes: [
      createSummary('note-15', 'Moved note', {
        parentId: 'folder-1',
        updatedAt: '2026-04-13T14:30:00.000Z',
      }),
    ],
    trashedNotes: [],
    activeNoteId: null,
    activeNote: null,
    recoveredDrafts: [],
    activeRecoveredDraft: null,
    saveState: 'idle',
    errorMessage: null,
    expandedFolderIds: ['folder-1'],
  });

  const moved = await store.getState().moveNote('note-15', 'folder-2');

  assert.equal(moved, true);
  assert.equal(syncQueueStore.savedSnapshots.length, 1);

  const snapshot = syncQueueStore.savedSnapshots[0];
  assert.equal(Array.isArray(snapshot.tasks), true);
  assert.equal(snapshot.tasks.length, 1);

  const queuedTask = snapshot.tasks[0];
  assertQueuedTaskReplayDisabled(queuedTask);
  assert.equal(queuedTask.entityType, 'note');
  assert.equal(queuedTask.entityId, 'note-15');
  assert.equal(queuedTask.operation, 'move');
  assert.deepEqual(queuedTask.mutation, createMoveMutation('folder-2'));
  assert.equal(queuedTask.status, 'queued');
  assert.equal(queuedTask.createdAt, '2026-04-13T14:31:00.000Z');
  assert.equal(queuedTask.updatedAt, '2026-04-13T14:31:00.000Z');
  assert.equal(queuedTask.enqueuedAt, '2026-04-13T14:31:00.000Z');
  assert.equal(queuedTask.startedAt, null);
  assert.equal(queuedTask.completedAt, null);
  assert.equal(queuedTask.nextRetryAt, null);
  assert.equal(queuedTask.retryCount, 0);
  assert.equal(queuedTask.attemptCount, 0);
  assert.equal(queuedTask.localRevision, null);
  assert.equal(queuedTask.remoteCursor, null);
  assert.equal(queuedTask.lastFailure, null);
  assert.equal(queuedTask.lastConflict, null);
});

test('deleteNotePermanently enqueues a queued permanent-delete sync task after the note is removed successfully', async () => {
  const { servicesModule, storeModule } = await loadWorkspaceStoreModule();
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
  });

  store.setState({
    notes: [],
    trashedNotes: [
      createSummary('note-19', 'Delete forever', {
        updatedAt: '2026-04-13T14:39:00.000Z',
        deletedAt: '2026-04-13T14:40:00.000Z',
      }),
    ],
    activeNoteId: null,
    activeNote: null,
    recoveredDrafts: [],
    activeRecoveredDraft: null,
    saveState: 'idle',
    errorMessage: null,
  });

  const originalDate = globalThis.Date;
  class FixedDate extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super('2026-04-13T14:41:00.000Z');
        return;
      }
      super(...args);
    }

    static now() {
      return originalDate.parse('2026-04-13T14:41:00.000Z');
    }
  }

  globalThis.Date = FixedDate;

  try {
    const deleted = await store.getState().deleteNotePermanently('note-19');

    assert.equal(deleted, true);
    assert.equal(syncQueueStore.savedSnapshots.length, 1);

    const snapshot = syncQueueStore.savedSnapshots[0];
    assert.equal(Array.isArray(snapshot.tasks), true);
    assert.equal(snapshot.tasks.length, 1);

    const queuedTask = snapshot.tasks[0];
    assertQueuedTaskReplayDisabled(queuedTask);
    assert.equal(queuedTask.entityType, 'note');
    assert.equal(queuedTask.entityId, 'note-19');
    assert.equal(queuedTask.operation, 'permanent-delete');
    assert.deepEqual(queuedTask.mutation, createIntentMutation('permanent-delete'));
    assert.equal(queuedTask.status, 'queued');
    assert.equal(queuedTask.createdAt, '2026-04-13T14:41:00.000Z');
    assert.equal(queuedTask.updatedAt, '2026-04-13T14:41:00.000Z');
    assert.equal(queuedTask.enqueuedAt, '2026-04-13T14:41:00.000Z');
    assert.equal(queuedTask.startedAt, null);
    assert.equal(queuedTask.completedAt, null);
    assert.equal(queuedTask.nextRetryAt, null);
    assert.equal(queuedTask.retryCount, 0);
    assert.equal(queuedTask.attemptCount, 0);
    assert.equal(queuedTask.localRevision, null);
    assert.equal(queuedTask.remoteCursor, null);
    assert.equal(queuedTask.lastFailure, null);
    assert.equal(queuedTask.lastConflict, null);
  } finally {
    globalThis.Date = originalDate;
  }
});

test('toggleFavorite enqueues a queued upsert sync task after favorite state is persisted successfully', async () => {
  const { servicesModule, storeModule } = await loadWorkspaceStoreModule();
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

  const workspaceService = {
    ...servicesModule.noteWorkspaceService,
    async save(entity) {
      return {
        success: true,
        data: createSummary(entity.id, 'Favorite me', {
          isFavorite: true,
          updatedAt: '2026-04-13T14:52:00.000Z',
        }),
      };
    },
  };

  const store = storeModule.createNotesWorkspaceStore({
    workspaceService,
    layoutService: {
      getSidebarWidth() {
        return 300;
      },
      saveSidebarWidth() {},
    },
    workspaceOrchestrator: servicesModule.createNoteWorkspaceOrchestrator(workspaceService),
    syncQueueStore,
  });

  store.setState({
    notes: [
      createSummary('note-23', 'Favorite me', {
        isFavorite: false,
        updatedAt: '2026-04-13T14:50:00.000Z',
      }),
    ],
    trashedNotes: [],
    activeNoteId: null,
    activeNote: null,
    recoveredDrafts: [],
    activeRecoveredDraft: null,
    saveState: 'idle',
    errorMessage: null,
  });

  const toggled = await store.getState().toggleFavorite('note-23');

  assert.equal(toggled, true);
  assert.equal(syncQueueStore.savedSnapshots.length, 1);

  const snapshot = syncQueueStore.savedSnapshots[0];
  assert.equal(Array.isArray(snapshot.tasks), true);
  assert.equal(snapshot.tasks.length, 1);

  const queuedTask = snapshot.tasks[0];
  assertQueuedTaskReplayDisabled(queuedTask);
  assert.equal(queuedTask.entityType, 'note');
  assert.equal(queuedTask.entityId, 'note-23');
  assert.equal(queuedTask.operation, 'upsert');
  assert.deepEqual(queuedTask.mutation, createUpsertMutation({
    isFavorite: true,
  }));
  assert.equal(queuedTask.status, 'queued');
  assert.equal(queuedTask.createdAt, '2026-04-13T14:52:00.000Z');
  assert.equal(queuedTask.updatedAt, '2026-04-13T14:52:00.000Z');
  assert.equal(queuedTask.enqueuedAt, '2026-04-13T14:52:00.000Z');
  assert.equal(queuedTask.startedAt, null);
  assert.equal(queuedTask.completedAt, null);
  assert.equal(queuedTask.nextRetryAt, null);
  assert.equal(queuedTask.retryCount, 0);
  assert.equal(queuedTask.attemptCount, 0);
  assert.equal(queuedTask.localRevision, null);
  assert.equal(queuedTask.remoteCursor, null);
  assert.equal(queuedTask.lastFailure, null);
  assert.equal(queuedTask.lastConflict, null);
});

test('clearTrash enqueues queued permanent-delete sync tasks for each removed trashed note in one snapshot', async () => {
  const { servicesModule, storeModule } = await loadWorkspaceStoreModule();
  const syncQueueStore = {
    async loadQueue() {
      syncQueueStore.loadQueueCallCount += 1;
      return { tasks: [] };
    },
    async saveQueue(snapshot) {
      syncQueueStore.savedSnapshots.push(snapshot);
    },
    async clearQueue() {},
    loadQueueCallCount: 0,
    savedSnapshots: [],
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
  });

  store.setState({
    notes: [],
    trashedNotes: [
      createSummary('note-31', 'Trash 31', {
        deletedAt: '2026-04-13T14:54:00.000Z',
      }),
      createSummary('note-32', 'Trash 32', {
        deletedAt: '2026-04-13T14:54:30.000Z',
      }),
    ],
    activeNoteId: null,
    activeNote: null,
    recoveredDrafts: [],
    activeRecoveredDraft: null,
    saveState: 'idle',
    errorMessage: null,
  });

  const originalDate = globalThis.Date;
  class FixedDate extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super('2026-04-13T14:55:00.000Z');
        return;
      }
      super(...args);
    }

    static now() {
      return originalDate.parse('2026-04-13T14:55:00.000Z');
    }
  }

  globalThis.Date = FixedDate;

  try {
    const cleared = await store.getState().clearTrash();

    assert.equal(cleared, true);
    assert.equal(syncQueueStore.loadQueueCallCount, 1);
    assert.equal(syncQueueStore.savedSnapshots.length, 1);

    const snapshot = syncQueueStore.savedSnapshots[0];
    assert.equal(Array.isArray(snapshot.tasks), true);
    assert.equal(snapshot.tasks.length, 2);
    assert.deepEqual(
      snapshot.tasks.map((task) => ({
        entityType: task.entityType,
        entityId: task.entityId,
        operation: task.operation,
        replayable: task.replayable,
        mutation: task.mutation,
        status: task.status,
        createdAt: task.createdAt,
      })),
      [
        {
          entityType: 'note',
          entityId: 'note-31',
          operation: 'permanent-delete',
          replayable: false,
          mutation: createIntentMutation('permanent-delete'),
          status: 'queued',
          createdAt: '2026-04-13T14:55:00.000Z',
        },
        {
          entityType: 'note',
          entityId: 'note-32',
          operation: 'permanent-delete',
          replayable: false,
          mutation: createIntentMutation('permanent-delete'),
          status: 'queued',
          createdAt: '2026-04-13T14:55:00.000Z',
        },
      ],
    );
  } finally {
    globalThis.Date = originalDate;
  }
});
