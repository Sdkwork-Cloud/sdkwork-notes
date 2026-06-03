import { useStore, type StateCreator } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { notesLocalStore, type NotesLocalStore } from '@sdkwork/notes-local';
import {
  createBrowserNotesSyncQueueStore,
  createEmptyNotesSyncQueueSnapshot,
  createNotesSyncTask,
  resolveNotesSyncQueueSnapshot,
  type NotesSyncMutationIntent,
  type NotesSyncNoteUpsertMutationPatch,
  type NotesSyncOperationType,
  type NotesSyncQueueSnapshot,
  type NotesSyncQueueStore,
  type NotesSyncTaskMutation,
} from '@sdkwork/notes-sync';
import type { Note, NoteFolder, NoteSummary, PageRequest, ServiceResult } from '@sdkwork/notes-types';
import {
  captureNotesWorkspaceExitRecoverySnapshot,
  clearNotesWorkspaceExitRecoverySnapshot,
  createNotesWorkspaceWriteCoordinator,
  createNoteWorkspaceOrchestrator,
  createNotesWorkspaceSaveQueue,
  createNotesWorkspaceSaveRetryPolicy,
  noteLayoutService,
  planDeletedFolderState,
  planMovedFolderState,
  planMovedNoteState,
  noteWorkspaceService,
  removeNotesWorkspaceRecoveredDraft,
  resolveActiveNotesWorkspaceRecoveredDraft,
  resolveNotesWorkspaceRecoveredDrafts,
  resolveNotesWorkspaceSaveCompletion,
  resolveNotesWorkspaceSaveRequestState,
  resolveNotesWorkspaceSaveSuccessState,
  restoreNotesWorkspaceRecoveredDraft,
  type NotesWorkspaceSaveRetryPolicy,
  type NotesWorkspaceExitRecoveryTrigger,
  type NotesWorkspaceRecoveredDraft,
  type NoteWorkspaceOrchestrator,
} from '../services';
import type { NotesWorkspaceSyncRuntime } from '../services/noteWorkspaceSyncRuntime';
import { createRemoteAppSdkNoteWorkspaceDataSource } from '../types/notesWorkspace';
import type {
  CreateNoteInput,
  NoteSaveState,
  NotesCollectionView,
  NoteWorkspaceDataSource,
  NoteWorkspaceSnapshot,
} from '../types/notesWorkspace';

const DEFAULT_NOTE_TITLE = 'Untitled';

export interface NoteWorkspaceStoreService {
  queryWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>>;
  findById(id: string): Promise<ServiceResult<Note | null>>;
  save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>>;
  createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>>;
  renameFolder(id: string, newName: string): Promise<ServiceResult<string>>;
  moveFolder(id: string, newParentId: string | null): Promise<ServiceResult<void>>;
  deleteFolder(id: string): Promise<ServiceResult<void>>;
  moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>>;
  moveToTrash(id: string): Promise<ServiceResult<NoteSummary>>;
  restoreFromTrash(id: string): Promise<ServiceResult<NoteSummary>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  clearTrash(): Promise<ServiceResult<number>>;
}

export interface NoteLayoutStoreService {
  getSidebarWidth(fallback?: number): number;
  saveSidebarWidth(value: number): void;
}

export interface NotesWorkspaceStoreDependencies {
  workspaceService: NoteWorkspaceStoreService;
  layoutService: NoteLayoutStoreService;
  workspaceOrchestrator: NoteWorkspaceOrchestrator;
  localStore?: NotesLocalStore;
  saveRetryPolicy?: NotesWorkspaceSaveRetryPolicy;
  syncQueueStore?: NotesSyncQueueStore;
  syncRuntime?: NotesWorkspaceSyncRuntime;
}

export interface NotesWorkspaceStoreState {
  isLoading: boolean;
  saveState: NoteSaveState;
  errorMessage: string | null;
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
  dataSource: NoteWorkspaceDataSource;
  syncQueueSnapshot: NotesSyncQueueSnapshot;
  activeNoteId: string | null;
  activeNote: Note | null;
  recoveredDrafts: NotesWorkspaceRecoveredDraft[];
  activeRecoveredDraft: NotesWorkspaceRecoveredDraft | null;
  activeView: NotesCollectionView;
  searchQuery: string;
  selectedFolderId: string | null;
  sidebarWidth: number;
  expandedFolderIds: string[];
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  captureActiveNoteExitRecovery: (trigger: NotesWorkspaceExitRecoveryTrigger) => Promise<boolean>;
  selectNote: (id: string | null) => Promise<void>;
  createNote: (input?: Partial<CreateNoteInput>) => Promise<string>;
  createFolder: (name: string, parentId?: string | null) => Promise<string>;
  renameFolder: (id: string, newName: string) => Promise<string>;
  moveFolder: (id: string, newParentId: string | null) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  updateActiveNoteDraft: (patch: Partial<Note>) => void;
  restoreRecoveredDraft: (noteId: string) => Promise<boolean>;
  dismissRecoveredDraft: (noteId: string) => Promise<boolean>;
  persistActiveNote: () => Promise<boolean>;
  moveNote: (id: string, newParentId: string | null) => Promise<boolean>;
  moveNoteToTrash: (id: string) => Promise<boolean>;
  restoreNoteFromTrash: (id: string) => Promise<boolean>;
  deleteNotePermanently: (id: string) => Promise<boolean>;
  clearTrash: () => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  requestSyncDrain: () => Promise<boolean>;
  setActiveView: (view: NotesCollectionView) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFolderId: (folderId: string | null) => void;
  setSidebarWidth: (width: number) => void;
  toggleFolderExpanded: (folderId: string) => void;
  clearError: () => void;
}

function normalizeString(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function toTimestamp(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = normalizeString(value);
  if (!normalized) {
    return 0;
  }
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createSnippet(content: string, fallback?: string) {
  const normalizedFallback = normalizeString(fallback);
  if (normalizedFallback) {
    return normalizedFallback;
  }

  const plain = normalizeString(content)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) {
    return '';
  }

  return plain.length <= 180 ? plain : `${plain.slice(0, 180)}...`;
}

function areStringArraysEqual(left: string[] | undefined, right: string[] | undefined) {
  const normalizedLeft = Array.isArray(left) ? left : [];
  const normalizedRight = Array.isArray(right) ? right : [];
  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function sortNotesByUpdatedAt<T extends Pick<NoteSummary, 'updatedAt' | 'title'>>(items: T[]) {
  return [...items].sort((left, right) => {
    const delta = toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
    if (delta !== 0) {
      return delta;
    }
    return left.title.localeCompare(right.title);
  });
}

function sortFoldersByName(folders: NoteFolder[]) {
  return [...folders].sort((left, right) => left.name.localeCompare(right.name));
}

function removeById<T extends { id: string }>(items: T[], id: string) {
  return items.filter((item) => item.id !== id);
}

function upsertById<T extends { id: string }>(items: T[], entity: T) {
  return [entity, ...removeById(items, entity.id)];
}

function withExpandedFolder(expandedFolderIds: string[], folderId: string | null | undefined) {
  const normalizedFolderId = normalizeString(folderId);
  if (!normalizedFolderId || expandedFolderIds.includes(normalizedFolderId)) {
    return expandedFolderIds;
  }
  return [...expandedFolderIds, normalizedFolderId];
}

function normalizeParentId(parentId: string | null | undefined) {
  return normalizeString(parentId) || null;
}

function hasOwnProperty(value: object, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function createNotesSyncTaskId(
  entityType: 'note' | 'folder',
  entityId: string,
  operation: NotesSyncOperationType,
  at: string,
) {
  return `${entityType}:${entityId}:${operation}:${at}`;
}

function createNoteUpsertSyncMutationFromPayload(payload: Partial<Note>): NotesSyncTaskMutation {
  const patch: NotesSyncNoteUpsertMutationPatch = {};

  if (hasOwnProperty(payload, 'title') && payload.title !== undefined) {
    patch.title = payload.title;
  }
  if (hasOwnProperty(payload, 'content') && payload.content !== undefined) {
    patch.content = payload.content;
  }
  if (hasOwnProperty(payload, 'type') && payload.type !== undefined) {
    patch.type = payload.type;
  }
  if (hasOwnProperty(payload, 'parentId') && payload.parentId !== undefined) {
    patch.parentId = normalizeParentId(payload.parentId);
  }
  if (hasOwnProperty(payload, 'tags') && payload.tags !== undefined) {
    patch.tags = Array.isArray(payload.tags) ? [...payload.tags] : [];
  }
  if (hasOwnProperty(payload, 'isFavorite') && payload.isFavorite !== undefined) {
    patch.isFavorite = Boolean(payload.isFavorite);
  }
  if (hasOwnProperty(payload, 'publishStatus') && payload.publishStatus !== undefined) {
    patch.publishStatus = payload.publishStatus;
  }

  return {
    patch,
  };
}

function createNoteUpsertSyncMutationFromNote(note: Note): NotesSyncTaskMutation {
  return createNoteUpsertSyncMutationFromPayload({
    title: note.title,
    content: note.content,
    type: note.type,
    parentId: note.parentId ?? null,
    tags: Array.isArray(note.tags) ? [...note.tags] : [],
    isFavorite: Boolean(note.isFavorite),
    publishStatus: note.publishStatus,
  });
}

function createNoteMoveSyncMutation(targetParentId: string | null): NotesSyncTaskMutation {
  return {
    targetParentId: normalizeParentId(targetParentId),
  };
}

function createNoteIntentSyncMutation(intent: NotesSyncMutationIntent): NotesSyncTaskMutation {
  return {
    intent,
  };
}

function toSummary(note: Note): NoteSummary {
  return {
    id: note.id,
    uuid: note.uuid,
    title: normalizeString(note.title) || DEFAULT_NOTE_TITLE,
    type: note.type,
    parentId: note.parentId ?? null,
    tags: Array.isArray(note.tags) ? note.tags : [],
    isFavorite: Boolean(note.isFavorite),
    snippet: createSnippet(note.content, note.snippet),
    metadata: note.metadata,
    publishStatus: note.publishStatus,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    deletedAt: note.deletedAt,
  };
}

function mergeSummaryIntoNote(note: Note, summary: NoteSummary) {
  return {
    ...note,
    ...summary,
    content: note.content,
    snippet: summary.snippet,
  };
}

function toErrorMessage(message: string | undefined, fallback: string) {
  const normalized = normalizeString(message);
  return normalized || fallback;
}

function toThrownErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return toErrorMessage(error.message, fallback);
  }

  return fallback;
}

function delayMilliseconds(durationMs: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, Math.max(0, durationMs));
  });
}

function createNotesWorkspaceStoreState(
  dependencies: NotesWorkspaceStoreDependencies,
): StateCreator<NotesWorkspaceStoreState, [], [], NotesWorkspaceStoreState> {
  const {
    workspaceService,
    layoutService,
    workspaceOrchestrator,
    localStore = notesLocalStore,
  } = dependencies;
  const syncQueueStore = dependencies.syncQueueStore ?? createBrowserNotesSyncQueueStore();
  const syncRuntime = dependencies.syncRuntime;
  const workspaceWriteCoordinator = createNotesWorkspaceWriteCoordinator({
    saveNote: (entity) => workspaceService.save(entity),
    findNoteDetail: (id) => workspaceService.findById(id),
    createFolder: (name, parentId) => workspaceService.createFolder(name, parentId),
    renameFolder: (id, newName) => workspaceService.renameFolder(id, newName),
    moveNote: (note, newParentId) => workspaceService.moveNote(note, newParentId),
  });
  const activeNoteSaveQueue = createNotesWorkspaceSaveQueue();
  const activeNoteSaveRetryPolicy = dependencies.saveRetryPolicy ?? createNotesWorkspaceSaveRetryPolicy();
  let selectionRequestId = 0;
  let persistedActiveNoteSnapshot: Note | null = null;
  let hasInitializedWorkspace = false;
  let initializeRequest: Promise<void> | null = null;

  return (set, get) => {
    const updatePersistedActiveNoteSnapshot = (note: Note | null) => {
      persistedActiveNoteSnapshot = note;
    };

    const createEmptyLocalWorkspaceSnapshot = () => ({
      notes: [],
      folders: [],
      drafts: [],
    });

    const loadLocalWorkspaceSnapshot = async () => {
      try {
        return await localStore.loadWorkspace();
      } catch {
        return createEmptyLocalWorkspaceSnapshot();
      }
    };

    const resolveRecoverySelection = (
      recoveredDrafts: NotesWorkspaceRecoveredDraft[],
      activeNoteId: string | null | undefined,
    ) => resolveActiveNotesWorkspaceRecoveredDraft(recoveredDrafts, activeNoteId);

    const loadSyncQueueSnapshot = async () => {
      const snapshot = resolveNotesSyncQueueSnapshot(await syncQueueStore.loadQueue());
      set({ syncQueueSnapshot: snapshot });
      return snapshot;
    };

    const requestSyncDrain = async () => {
      if (!syncRuntime) {
        return false;
      }

      await syncRuntime.requestDrain();
      await loadSyncQueueSnapshot();
      return true;
    };

    syncQueueStore.subscribe?.((snapshot) => {
      set({
        syncQueueSnapshot: resolveNotesSyncQueueSnapshot(snapshot),
      });
    });

    const enqueueNotesSyncTasks = async (
      pendingTasks: Array<{
        noteId: string;
        operation: NotesSyncOperationType;
        atValue: unknown;
        mutation: NotesSyncTaskMutation;
      }>,
    ) => {
      const normalizedTasks = pendingTasks
        .map(({ noteId, operation, atValue, mutation }) => {
          const normalizedNoteId = normalizeString(noteId);
          if (!normalizedNoteId) {
            return null;
          }

          return {
            noteId: normalizedNoteId,
            operation,
            at: normalizeString(atValue) || new Date().toISOString(),
            mutation,
          };
        })
        .filter((task): task is {
          noteId: string;
          operation: NotesSyncOperationType;
          at: string;
          mutation: NotesSyncTaskMutation;
        } => task !== null);

      if (normalizedTasks.length === 0) {
        return;
      }

      const snapshot = resolveNotesSyncQueueSnapshot(await syncQueueStore.loadQueue());
      const nextSnapshot = {
        tasks: [
          ...snapshot.tasks,
          ...normalizedTasks.map(({ noteId, operation, at, mutation }) =>
            createNotesSyncTask({
              id: createNotesSyncTaskId('note', noteId, operation, at),
              entityType: 'note',
              entityId: noteId,
              operation,
              at,
              replayable: false,
              mutation,
            })),
        ],
      };
      await syncQueueStore.saveQueue(nextSnapshot);
      set({ syncQueueSnapshot: nextSnapshot });
      await requestSyncDrain();
    };

    const enqueueNoteSyncTask = async (
      noteId: string,
      operation: NotesSyncOperationType,
      atValue: unknown,
      mutation: NotesSyncTaskMutation,
    ) => enqueueNotesSyncTasks([{ noteId, operation, atValue, mutation }]);

    const enqueueNoteUpsertSyncTask = async (
      noteId: string,
      updatedAt: unknown,
      mutation: NotesSyncTaskMutation,
    ) => enqueueNoteSyncTask(noteId, 'upsert', updatedAt, mutation);

    const buildSavePayload = (note: Note) => {
      const baseline = persistedActiveNoteSnapshot;
      const payload: Partial<Note> = {
        id: note.id,
      };

      if (!baseline || baseline.title !== note.title) {
        payload.title = note.title;
      }
      if (!baseline || baseline.content !== note.content) {
        payload.content = note.content;
      }
      if (!baseline || baseline.type !== note.type) {
        payload.type = note.type;
      }
      if (!baseline || baseline.parentId !== note.parentId) {
        payload.parentId = note.parentId;
      }
      if (!baseline || !areStringArraysEqual(baseline.tags, note.tags)) {
        payload.tags = note.tags;
      }
      if (!baseline || baseline.isFavorite !== note.isFavorite) {
        payload.isFavorite = note.isFavorite;
      }
      if (!baseline || baseline.publishStatus !== note.publishStatus) {
        payload.publishStatus = note.publishStatus;
      }

      return payload;
    };

    const persistUnsavedActiveNoteIfNeeded = async () => {
      const { activeNote, saveState } = get();
      if (!activeNote) {
        return true;
      }

      if (saveState === 'saving' || saveState === 'retrying') {
        return activeNoteSaveQueue.waitForActiveRequest();
      }

      if (saveState !== 'dirty' && saveState !== 'error') {
        return true;
      }

      return get().persistActiveNote();
    };

    const loadActiveNote = async (noteId: string | null, skipPersist = false) => {
      const nextNoteId = normalizeString(noteId);
      const currentActiveId = get().activeNoteId;

      if (!skipPersist && currentActiveId && currentActiveId !== nextNoteId) {
        const persisted = await persistUnsavedActiveNoteIfNeeded();
        if (!persisted) {
          return;
        }
      }

      if (!nextNoteId) {
        selectionRequestId += 1;
        updatePersistedActiveNoteSnapshot(null);
        set({
          activeNoteId: null,
          activeNote: null,
          activeRecoveredDraft: null,
          saveState: 'idle',
        });
        return;
      }

      const requestId = selectionRequestId + 1;
      selectionRequestId = requestId;

      set({
        activeNoteId: nextNoteId,
        activeRecoveredDraft: resolveRecoverySelection(get().recoveredDrafts, nextNoteId),
        errorMessage: null,
      });

      const result = await workspaceOrchestrator.loadWorkspaceNote(nextNoteId, {
        trashedNotes: get().trashedNotes,
      });
      if (requestId !== selectionRequestId) {
        return;
      }

      if (!result.success || !result.data) {
        updatePersistedActiveNoteSnapshot(null);
        set({
          activeNote: null,
          activeRecoveredDraft: resolveRecoverySelection(get().recoveredDrafts, nextNoteId),
          saveState: 'error',
          errorMessage: toErrorMessage(result.message, 'Failed to load note'),
        });
        return;
      }

      const nextActiveNote = result.data.activeNote;
      updatePersistedActiveNoteSnapshot(nextActiveNote);

      set({
        activeNote: nextActiveNote,
        activeRecoveredDraft: resolveRecoverySelection(get().recoveredDrafts, nextNoteId),
        saveState: 'idle',
      });
    };

    return {
      isLoading: false,
      saveState: 'idle',
      errorMessage: null,
      notes: [],
      trashedNotes: [],
      folders: [],
      dataSource: createRemoteAppSdkNoteWorkspaceDataSource(),
      syncQueueSnapshot: createEmptyNotesSyncQueueSnapshot(),
      activeNoteId: null,
      activeNote: null,
      recoveredDrafts: [],
      activeRecoveredDraft: null,
      activeView: 'all',
      searchQuery: '',
      selectedFolderId: null,
      sidebarWidth: layoutService.getSidebarWidth(),
      expandedFolderIds: [],
      async initialize() {
        if (initializeRequest) {
          return initializeRequest;
        }

        if (hasInitializedWorkspace) {
          return;
        }

        let request: Promise<void>;
        request = (async () => {
          set({
            isLoading: true,
            errorMessage: null,
            sidebarWidth: layoutService.getSidebarWidth(get().sidebarWidth),
          });

          const initializationResult = await workspaceOrchestrator.initializeWorkspace({
            currentActiveNoteId: get().activeNoteId,
            currentActiveView: get().activeView,
            currentSelectedFolderId: get().selectedFolderId,
          });

          if (!initializationResult.success || !initializationResult.data) {
            set({
              isLoading: false,
              recoveredDrafts: [],
              activeRecoveredDraft: null,
              saveState: 'error',
              errorMessage: toErrorMessage(initializationResult.message, 'Failed to load notes workspace'),
            });
            return;
          }

          const localWorkspaceSnapshot = await loadLocalWorkspaceSnapshot();
          const syncQueueSnapshot = await loadSyncQueueSnapshot();
          const recoveredDrafts = resolveNotesWorkspaceRecoveredDrafts({
            drafts: localWorkspaceSnapshot.drafts,
            notes: initializationResult.data.notes,
            trashedNotes: initializationResult.data.trashedNotes,
          });
          updatePersistedActiveNoteSnapshot(initializationResult.data.activeNote);
          set({
            notes: initializationResult.data.notes,
            trashedNotes: initializationResult.data.trashedNotes,
            folders: initializationResult.data.folders,
            dataSource: initializationResult.data.dataSource,
            syncQueueSnapshot,
            activeNoteId: initializationResult.data.activeNoteId,
            activeNote: initializationResult.data.activeNote,
            recoveredDrafts,
            activeRecoveredDraft: resolveRecoverySelection(
              recoveredDrafts,
              initializationResult.data.activeNoteId,
            ),
            selectedFolderId: initializationResult.data.selectedFolderId,
            isLoading: false,
            saveState: initializationResult.data.activeNoteErrorMessage ? 'error' : 'idle',
            errorMessage: initializationResult.data.activeNoteErrorMessage,
          });
          hasInitializedWorkspace = true;

          try {
            await requestSyncDrain();
          } catch (error) {
            set({
              errorMessage: toThrownErrorMessage(
                error,
                'Loaded notes workspace but failed to request queued sync replay',
              ),
            });
          }
        })().finally(() => {
          if (initializeRequest === request) {
            initializeRequest = null;
          }
        });

        initializeRequest = request;
        return request;
      },
      async refresh() {
        if (initializeRequest) {
          await initializeRequest;
        }

        hasInitializedWorkspace = false;
        await get().initialize();
      },
      async captureActiveNoteExitRecovery(trigger) {
        return captureNotesWorkspaceExitRecoverySnapshot(localStore, {
          activeNote: get().activeNote,
          saveState: get().saveState,
          trigger,
        });
      },
      async selectNote(id) {
        await loadActiveNote(id);
      },
      async createNote(input = {}) {
        const persisted = await persistUnsavedActiveNoteIfNeeded();
        if (!persisted) {
          return '';
        }

        const createNoteResult = await workspaceWriteCoordinator.createNoteState({
          notes: get().notes,
          trashedNotes: get().trashedNotes,
          expandedFolderIds: get().expandedFolderIds,
          input: {
            title: normalizeString(input.title) || DEFAULT_NOTE_TITLE,
            type: input.type ?? 'doc',
            parentId: input.parentId ?? null,
            content: input.content ?? '',
            tags: input.tags ?? [],
            isFavorite: false,
          },
        });

        if (createNoteResult.status !== 'apply') {
          set({
            saveState: 'error',
            errorMessage: createNoteResult.errorMessage,
          });
          return '';
        }

        updatePersistedActiveNoteSnapshot(createNoteResult.activeNote);

        set({
          notes: createNoteResult.notes,
          trashedNotes: createNoteResult.trashedNotes,
          activeNoteId: createNoteResult.activeNoteId,
          activeNote: createNoteResult.activeNote,
          activeView: createNoteResult.activeView,
          selectedFolderId: createNoteResult.selectedFolderId,
          expandedFolderIds: createNoteResult.expandedFolderIds,
          saveState: 'saved',
          errorMessage: null,
        });

        try {
          await enqueueNoteUpsertSyncTask(
            createNoteResult.activeNote.id,
            createNoteResult.activeNote.updatedAt,
            createNoteUpsertSyncMutationFromNote(createNoteResult.activeNote),
          );
        } catch (error) {
          set({
            errorMessage: toThrownErrorMessage(
              error,
              'Created note but failed to schedule sync work',
            ),
          });
        }

        return createNoteResult.createdNoteId;
      },
      async createFolder(name, parentId = null) {
        const createFolderResult = await workspaceWriteCoordinator.createFolderState({
          folders: get().folders,
          expandedFolderIds: get().expandedFolderIds,
          name,
          parentId,
        });

        if (createFolderResult.status !== 'apply') {
          set({
            errorMessage: createFolderResult.errorMessage,
          });
          return '';
        }

        set({
          folders: createFolderResult.folders,
          expandedFolderIds: createFolderResult.expandedFolderIds,
          errorMessage: null,
        });

        return createFolderResult.createdFolderId;
      },
      async renameFolder(id, newName) {
        const renameFolderResult = await workspaceWriteCoordinator.renameFolderState({
          folders: get().folders,
          notes: get().notes,
          trashedNotes: get().trashedNotes,
          activeNote: get().activeNote,
          expandedFolderIds: get().expandedFolderIds,
          selectedFolderId: get().selectedFolderId,
          folderId: id,
          requestedName: newName,
        });

        if (renameFolderResult.status === 'error') {
          set({
            errorMessage: renameFolderResult.errorMessage,
          });
          return id;
        }

        if (renameFolderResult.status === 'apply') {
          set({
            folders: renameFolderResult.folders,
            notes: renameFolderResult.notes,
            trashedNotes: renameFolderResult.trashedNotes,
            activeNote: renameFolderResult.activeNote,
            expandedFolderIds: renameFolderResult.expandedFolderIds,
            selectedFolderId: renameFolderResult.selectedFolderId,
            errorMessage: null,
          });

          if (renameFolderResult.activeNote) {
            updatePersistedActiveNoteSnapshot(renameFolderResult.activeNote);
          }
        }

        return renameFolderResult.resolvedFolderId;
      },
      async moveFolder(id, newParentId) {
        const folderId = normalizeString(id);
        const movePlan = planMovedFolderState({
          folders: get().folders,
          movedFolderId: folderId,
          requestedParentId: newParentId,
          expandedFolderIds: get().expandedFolderIds,
        });

        if (movePlan.status === 'missing') {
          return false;
        }

        if (movePlan.status === 'noop') {
          return true;
        }

        if (movePlan.status === 'invalid') {
          set({
            errorMessage: movePlan.errorMessage,
          });
          return false;
        }

        const result = await workspaceService.moveFolder(folderId, movePlan.nextParentId);
        if (!result.success) {
          set({
            errorMessage: toErrorMessage(result.message, 'Failed to move folder'),
          });
          return false;
        }

        set((state) => ({
          folders: sortFoldersByName(
            state.folders.map((folder) =>
              folder.id === folderId
                ? {
                    ...folder,
                    parentId: movePlan.nextParentId,
                    updatedAt: new Date().toISOString(),
                  }
                : folder,
            ),
          ),
          expandedFolderIds: planMovedFolderState({
            folders: state.folders,
            movedFolderId: folderId,
            requestedParentId: movePlan.nextParentId,
            expandedFolderIds: state.expandedFolderIds,
          }).expandedFolderIds,
          errorMessage: null,
        }));

        return true;
      },
      async deleteFolder(id) {
        const folderId = normalizeString(id);
        if (!folderId) {
          return false;
        }

        const persisted = await persistUnsavedActiveNoteIfNeeded();
        if (!persisted) {
          return false;
        }

        const result = await workspaceService.deleteFolder(folderId);
        if (!result.success) {
          set({
            errorMessage: toErrorMessage(result.message, 'Failed to delete folder'),
          });
          return false;
        }

        set((state) => {
          const deletePlan = planDeletedFolderState({
            folders: state.folders,
            deletedFolderId: folderId,
            selectedFolderId: state.selectedFolderId,
            expandedFolderIds: state.expandedFolderIds,
          });

          return {
            selectedFolderId: deletePlan.selectedFolderId,
            expandedFolderIds: deletePlan.expandedFolderIds,
            errorMessage: null,
          };
        });

        await get().refresh();
        return true;
      },
      updateActiveNoteDraft(patch) {
        const activeNote = get().activeNote;
        if (!activeNote) {
          return;
        }

        const nextActiveNote: Note = {
          ...activeNote,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        const nextSummary = toSummary(nextActiveNote);

        set((state) => {
          const recoveredDrafts = removeNotesWorkspaceRecoveredDraft(state.recoveredDrafts, nextActiveNote.id);
          return {
            activeNote: nextActiveNote,
            notes: nextActiveNote.deletedAt
              ? removeById(state.notes, nextActiveNote.id)
              : sortNotesByUpdatedAt(upsertById(state.notes, nextSummary)),
            trashedNotes: nextActiveNote.deletedAt
              ? sortNotesByUpdatedAt(upsertById(state.trashedNotes, nextSummary))
              : removeById(state.trashedNotes, nextActiveNote.id),
            recoveredDrafts,
            activeRecoveredDraft: resolveRecoverySelection(recoveredDrafts, nextActiveNote.id),
            saveState: 'dirty',
            errorMessage: null,
          };
        });

        void captureNotesWorkspaceExitRecoverySnapshot(localStore, {
          activeNote: nextActiveNote,
          saveState: 'dirty',
          trigger: 'draft-change',
        });
      },
      async restoreRecoveredDraft(noteId) {
        const normalizedNoteId = normalizeString(noteId);
        const activeNote = get().activeNote;
        const recoveredDraft = get().recoveredDrafts.find((draft) => draft.noteId === normalizedNoteId) ?? null;
        if (!normalizedNoteId || !activeNote || activeNote.id !== normalizedNoteId || !recoveredDraft) {
          return false;
        }

        const restoredAt = new Date().toISOString();
        const nextActiveNote = restoreNotesWorkspaceRecoveredDraft(
          activeNote,
          recoveredDraft,
          restoredAt,
        );
        const nextSummary = toSummary(nextActiveNote);

        set((state) => {
          const recoveredDrafts = removeNotesWorkspaceRecoveredDraft(state.recoveredDrafts, normalizedNoteId);
          return {
            activeNote: nextActiveNote,
            notes: sortNotesByUpdatedAt(upsertById(state.notes, nextSummary)),
            recoveredDrafts,
            activeRecoveredDraft: resolveRecoverySelection(recoveredDrafts, normalizedNoteId),
            saveState: 'dirty',
            errorMessage: null,
          };
        });

        void captureNotesWorkspaceExitRecoverySnapshot(localStore, {
          activeNote: nextActiveNote,
          saveState: 'dirty',
          trigger: 'draft-change',
        });
        return true;
      },
      async dismissRecoveredDraft(noteId) {
        const normalizedNoteId = normalizeString(noteId);
        if (!normalizedNoteId) {
          return false;
        }

        await clearNotesWorkspaceExitRecoverySnapshot(localStore, normalizedNoteId);
        set((state) => {
          const recoveredDrafts = removeNotesWorkspaceRecoveredDraft(state.recoveredDrafts, normalizedNoteId);
          return {
            recoveredDrafts,
            activeRecoveredDraft: resolveRecoverySelection(recoveredDrafts, state.activeNoteId),
            errorMessage: null,
          };
        });
        return true;
      },
      async persistActiveNote() {
        const { activeNote, saveState } = get();
        if (!activeNote) {
          return true;
        }

        if (activeNoteSaveQueue.hasActiveRequest()) {
          if (saveState === 'dirty' || saveState === 'error') {
            return activeNoteSaveQueue.requestReplay();
          }

          return activeNoteSaveQueue.waitForActiveRequest();
        }

        return activeNoteSaveQueue.run(async () => {
          let requestState = resolveNotesWorkspaceSaveRequestState(get().saveState);
          let retryAttempt = 0;
          const maxRetryCount = activeNoteSaveRetryPolicy.getMaximumRetryCount();

          while (true) {
            const requestedActiveNote = get().activeNote;
            if (!requestedActiveNote) {
              return true;
            }

            const payload = buildSavePayload(requestedActiveNote);
            if (Object.keys(payload).length === 1) {
              updatePersistedActiveNoteSnapshot(requestedActiveNote);
              const recoveredDrafts = removeNotesWorkspaceRecoveredDraft(
                get().recoveredDrafts,
                requestedActiveNote.id,
              );
              set({
                recoveredDrafts,
                activeRecoveredDraft: resolveRecoverySelection(recoveredDrafts, requestedActiveNote.id),
                saveState: resolveNotesWorkspaceSaveSuccessState(requestState),
                errorMessage: null,
              });
              void clearNotesWorkspaceExitRecoverySnapshot(localStore, requestedActiveNote.id);
              return true;
            }

            const syncMutation = createNoteUpsertSyncMutationFromPayload(payload);

            set({
              saveState: requestState,
              errorMessage: null,
            });

            const result = await workspaceService.save(payload);

            if (result.success && result.data) {
              const savedSummary = result.data;
              const completion = resolveNotesWorkspaceSaveCompletion({
                currentActiveNote: get().activeNote,
                requestedActiveNote,
                savedSummary,
                successSaveState: resolveNotesWorkspaceSaveSuccessState(requestState),
                mergeSummaryIntoNote,
              });
              updatePersistedActiveNoteSnapshot(completion.persistedActiveNote);

              set((state) => {
                const shouldPreserveDirtyDraft =
                  completion.saveState === 'dirty'
                  && completion.activeNote?.id === savedSummary.id;
                const nextSummary: NoteSummary = shouldPreserveDirtyDraft && completion.activeNote
                  ? toSummary(completion.activeNote)
                  : savedSummary;
                const recoveredDrafts = removeNotesWorkspaceRecoveredDraft(state.recoveredDrafts, savedSummary.id);
                const nextActiveNoteId = completion.activeNote?.id ?? state.activeNoteId;

                return {
                  notes: sortNotesByUpdatedAt(upsertById(state.notes, nextSummary)),
                  trashedNotes: removeById(state.trashedNotes, savedSummary.id),
                  activeNote: completion.activeNote,
                  activeNoteId: nextActiveNoteId,
                  recoveredDrafts,
                  activeRecoveredDraft: resolveRecoverySelection(recoveredDrafts, nextActiveNoteId),
                  saveState: completion.saveState,
                  errorMessage: null,
                };
              });
              void clearNotesWorkspaceExitRecoverySnapshot(localStore, savedSummary.id);

              try {
                await enqueueNoteUpsertSyncTask(
                  requestedActiveNote.id,
                  requestedActiveNote.updatedAt,
                  syncMutation,
                );
              } catch (error) {
                set({
                  errorMessage: toThrownErrorMessage(
                    error,
                    'Saved note but failed to schedule sync work',
                  ),
                });
              }

              if (retryAttempt > 0) {
                await activeNoteSaveRetryPolicy.recordRetryRecovered({
                  noteId: requestedActiveNote.id,
                  retryAttempt,
                  maxRetryCount,
                });
              }

              return true;
            }

            const errorMessage = toErrorMessage(result.message, 'Failed to save note');
            retryAttempt += 1;
            const retryDelayMs = activeNoteSaveRetryPolicy.resolveNextRetryDelay(retryAttempt);
            if (retryDelayMs === null) {
              await activeNoteSaveRetryPolicy.recordRetryExhausted({
                noteId: requestedActiveNote.id,
                retryAttempt,
                maxRetryCount,
                errorMessage,
              });
              set({
                saveState: 'error',
                errorMessage,
              });
              return false;
            }

            await activeNoteSaveRetryPolicy.recordRetryScheduled({
              noteId: requestedActiveNote.id,
              retryAttempt,
              retryDelayMs,
              maxRetryCount,
              errorMessage,
            });
            requestState = 'retrying';
            set({
              saveState: 'retrying',
              errorMessage,
            });
            await delayMilliseconds(retryDelayMs);
          }
        });
      },
      async moveNoteToTrash(id) {
        const noteId = normalizeString(id);
        if (!noteId) {
          return false;
        }

        if (get().activeNoteId === noteId) {
          const persisted = await persistUnsavedActiveNoteIfNeeded();
          if (!persisted) {
            return false;
          }
        }

        const result = await workspaceService.moveToTrash(noteId);
        if (!result.success || !result.data) {
          set({
            errorMessage: toErrorMessage(result.message, 'Failed to move note to trash'),
          });
          return false;
        }

        set((state) => {
          const nextActiveNoteId = state.activeNoteId === noteId ? null : state.activeNoteId;
          const recoveredDrafts = removeNotesWorkspaceRecoveredDraft(state.recoveredDrafts, noteId);
          return {
            notes: removeById(state.notes, noteId),
            trashedNotes: sortNotesByUpdatedAt(upsertById(state.trashedNotes, result.data!)),
            activeNoteId: nextActiveNoteId,
            activeNote: state.activeNoteId === noteId ? null : state.activeNote,
            recoveredDrafts,
            activeRecoveredDraft: resolveRecoverySelection(recoveredDrafts, nextActiveNoteId),
            saveState: state.activeNoteId === noteId ? 'idle' : state.saveState,
            errorMessage: null,
          };
        });
        void clearNotesWorkspaceExitRecoverySnapshot(localStore, noteId);
        if (get().activeNoteId === null) {
          updatePersistedActiveNoteSnapshot(null);
        }

        try {
          await enqueueNoteSyncTask(
            noteId,
            'delete',
            result.data.deletedAt ?? result.data.updatedAt,
            createNoteIntentSyncMutation('move-to-trash'),
          );
        } catch (error) {
          set({
            errorMessage: toThrownErrorMessage(
              error,
              'Moved note to trash but failed to schedule sync work',
            ),
          });
        }

        return true;
      },
      async moveNote(id, newParentId) {
        const noteId = normalizeString(id);
        if (!noteId) {
          return false;
        }

        const note = get().notes.find((item) => item.id === noteId);
        if (!note) {
          return false;
        }

        const nextParentId = normalizeParentId(newParentId);
        if (normalizeParentId(note.parentId) === nextParentId) {
          return true;
        }

        if (get().activeNoteId === noteId) {
          const persisted = await persistUnsavedActiveNoteIfNeeded();
          if (!persisted) {
            return false;
          }
        }

        const moveNoteResult = await workspaceWriteCoordinator.moveNoteState({
          notes: get().notes,
          activeNote: get().activeNote,
          expandedFolderIds: get().expandedFolderIds,
          note,
          requestedParentId: nextParentId,
          updatedAt: new Date().toISOString(),
        });

        if (moveNoteResult.status === 'error') {
          set({
            errorMessage: moveNoteResult.errorMessage,
          });
          return false;
        }

        if (moveNoteResult.status === 'apply') {
          set((state) => ({
            notes: moveNoteResult.notes,
            activeNote: moveNoteResult.activeNote,
            activeRecoveredDraft: resolveRecoverySelection(state.recoveredDrafts, state.activeNoteId),
            expandedFolderIds: moveNoteResult.expandedFolderIds,
            errorMessage: null,
          }));

          if (moveNoteResult.activeNote?.id === noteId) {
            updatePersistedActiveNoteSnapshot(moveNoteResult.activeNote);
          }

          const movedNote = moveNoteResult.notes.find((item) => item.id === noteId);
          try {
            await enqueueNoteSyncTask(
              noteId,
              'move',
              movedNote?.updatedAt ?? moveNoteResult.activeNote?.updatedAt,
              createNoteMoveSyncMutation(nextParentId),
            );
          } catch (error) {
            set({
              errorMessage: toThrownErrorMessage(
                error,
                'Moved note but failed to schedule sync work',
              ),
            });
          }
        }

        return true;
      },
      async restoreNoteFromTrash(id) {
        const noteId = normalizeString(id);
        if (!noteId) {
          return false;
        }

        const result = await workspaceService.restoreFromTrash(noteId);
        if (!result.success || !result.data) {
          set({
            errorMessage: toErrorMessage(result.message, 'Failed to restore note'),
          });
          return false;
        }

        set((state) => ({
          notes: sortNotesByUpdatedAt(upsertById(state.notes, result.data!)),
          trashedNotes: removeById(state.trashedNotes, noteId),
          errorMessage: null,
        }));

        try {
          await enqueueNoteSyncTask(
            noteId,
            'restore',
            result.data.updatedAt,
            createNoteIntentSyncMutation('restore-from-trash'),
          );
        } catch (error) {
          set({
            errorMessage: toThrownErrorMessage(
              error,
              'Restored note but failed to schedule sync work',
            ),
          });
        }

        return true;
      },
      async deleteNotePermanently(id) {
        const noteId = normalizeString(id);
        if (!noteId) {
          return false;
        }

        const result = await workspaceService.deleteById(noteId);
        if (!result.success) {
          set({
            errorMessage: toErrorMessage(result.message, 'Failed to delete note permanently'),
          });
          return false;
        }

        set((state) => {
          const nextActiveNoteId = state.activeNoteId === noteId ? null : state.activeNoteId;
          const recoveredDrafts = removeNotesWorkspaceRecoveredDraft(state.recoveredDrafts, noteId);
          return {
            notes: removeById(state.notes, noteId),
            trashedNotes: removeById(state.trashedNotes, noteId),
            activeNoteId: nextActiveNoteId,
            activeNote: state.activeNoteId === noteId ? null : state.activeNote,
            recoveredDrafts,
            activeRecoveredDraft: resolveRecoverySelection(recoveredDrafts, nextActiveNoteId),
            saveState: state.activeNoteId === noteId ? 'idle' : state.saveState,
            errorMessage: null,
          };
        });
        void clearNotesWorkspaceExitRecoverySnapshot(localStore, noteId);
        if (get().activeNoteId === null) {
          updatePersistedActiveNoteSnapshot(null);
        }

        try {
          await enqueueNoteSyncTask(
            noteId,
            'permanent-delete',
            undefined,
            createNoteIntentSyncMutation('permanent-delete'),
          );
        } catch (error) {
          set({
            errorMessage: toThrownErrorMessage(
              error,
              'Deleted note permanently but failed to schedule sync work',
            ),
          });
        }

        return true;
      },
      async clearTrash() {
        const result = await workspaceService.clearTrash();
        if (!result.success) {
          set({
            errorMessage: toErrorMessage(result.message, 'Failed to clear trash'),
          });
          return false;
        }

        const activeNoteId = get().activeNoteId;
        const trashedIdSet = new Set(get().trashedNotes.map((note) => note.id));

        const nextRecoveredDrafts = get().recoveredDrafts.filter((draft) => !trashedIdSet.has(draft.noteId));
        const nextActiveNoteId = activeNoteId && trashedIdSet.has(activeNoteId) ? null : activeNoteId;

        set({
          trashedNotes: [],
          activeNoteId: nextActiveNoteId,
          activeNote: activeNoteId && trashedIdSet.has(activeNoteId) ? null : get().activeNote,
          recoveredDrafts: nextRecoveredDrafts,
          activeRecoveredDraft: resolveRecoverySelection(nextRecoveredDrafts, nextActiveNoteId),
          saveState: activeNoteId && trashedIdSet.has(activeNoteId) ? 'idle' : get().saveState,
          errorMessage: null,
        });
        void Promise.all(
          [...trashedIdSet].map((noteIdToClear) => clearNotesWorkspaceExitRecoverySnapshot(localStore, noteIdToClear)),
        );
        if (activeNoteId && trashedIdSet.has(activeNoteId)) {
          updatePersistedActiveNoteSnapshot(null);
        }

        try {
          const enqueuedAt = new Date().toISOString();
          await enqueueNotesSyncTasks(
            [...trashedIdSet].map((noteIdToClear) => ({
              noteId: noteIdToClear,
              operation: 'permanent-delete',
              atValue: enqueuedAt,
              mutation: createNoteIntentSyncMutation('permanent-delete'),
            })),
          );
        } catch (error) {
          set({
            errorMessage: toThrownErrorMessage(
              error,
              'Cleared trash but failed to schedule sync work',
            ),
          });
        }

        return true;
      },
      async toggleFavorite(id) {
        const noteId = normalizeString(id);
        const activeNote = get().activeNote;
        const saveState = get().saveState;
        const currentSummary = get().notes.find((note) => note.id === noteId)
          ?? (activeNote?.id === noteId ? toSummary(activeNote) : null);

        if (!noteId || !currentSummary) {
          return false;
        }

        const nextFavorite = !currentSummary.isFavorite;
        const previousActiveNote = activeNote;

        if (
          activeNote?.id === noteId
          && (saveState === 'dirty' || saveState === 'error')
        ) {
          set((state) => ({
            notes: sortNotesByUpdatedAt(
              state.notes.map((note) =>
                note.id === noteId
                  ? {
                      ...note,
                      isFavorite: nextFavorite,
                    }
                  : note),
            ),
            activeNote: state.activeNote?.id === noteId
              ? {
                  ...state.activeNote,
                  isFavorite: nextFavorite,
                }
              : state.activeNote,
            errorMessage: null,
          }));

          return true;
        }

        set((state) => ({
          notes: sortNotesByUpdatedAt(
            state.notes.map((note) =>
              note.id === noteId
                ? {
                    ...note,
                    isFavorite: nextFavorite,
                  }
                : note),
          ),
          activeNote: state.activeNote?.id === noteId
            ? {
                ...state.activeNote,
                isFavorite: nextFavorite,
              }
            : state.activeNote,
          errorMessage: null,
        }));

        const result = await workspaceService.save({
          id: noteId,
          isFavorite: nextFavorite,
        });

        if (!result.success || !result.data) {
          set((state) => ({
            notes: sortNotesByUpdatedAt(
              state.notes.map((note) =>
                note.id === noteId
                  ? {
                      ...note,
                      isFavorite: currentSummary.isFavorite,
                    }
                  : note),
            ),
            activeNote: previousActiveNote,
            errorMessage: toErrorMessage(result.message, 'Failed to update favorite state'),
          }));
          return false;
        }

        set((state) => ({
          notes: sortNotesByUpdatedAt(upsertById(state.notes, result.data!)),
          activeNote: state.activeNote?.id === noteId && previousActiveNote
            ? mergeSummaryIntoNote(previousActiveNote, result.data!)
            : state.activeNote,
          errorMessage: null,
        }));
        if (previousActiveNote?.id === noteId) {
          updatePersistedActiveNoteSnapshot(mergeSummaryIntoNote(previousActiveNote, result.data!));
        }

        try {
          await enqueueNoteUpsertSyncTask(
            noteId,
            result.data.updatedAt,
            createNoteUpsertSyncMutationFromPayload({
              isFavorite: nextFavorite,
            }),
          );
        } catch (error) {
          set({
            errorMessage: toThrownErrorMessage(
              error,
              'Updated favorite state but failed to schedule sync work',
            ),
          });
        }

        return true;
      },
      async requestSyncDrain() {
        return requestSyncDrain();
      },
      setActiveView(activeView) {
        set({
          activeView,
          selectedFolderId: activeView === 'trash' ? null : get().selectedFolderId,
        });
      },
      setSearchQuery(searchQuery) {
        set({
          searchQuery,
        });
      },
      setSelectedFolderId(selectedFolderId) {
        set({
          selectedFolderId,
          activeView: selectedFolderId ? 'all' : get().activeView,
        });
      },
      setSidebarWidth(sidebarWidth) {
        layoutService.saveSidebarWidth(sidebarWidth);
        set({ sidebarWidth });
      },
      toggleFolderExpanded(folderId) {
        const normalizedFolderId = normalizeString(folderId);
        if (!normalizedFolderId) {
          return;
        }

        set((state) => ({
          expandedFolderIds: state.expandedFolderIds.includes(normalizedFolderId)
            ? state.expandedFolderIds.filter((id) => id !== normalizedFolderId)
            : [...state.expandedFolderIds, normalizedFolderId],
        }));
      },
      clearError() {
        set({ errorMessage: null });
      },
    };
  };
}

export function createNotesWorkspaceStore(
  overrides: Partial<NotesWorkspaceStoreDependencies> = {},
) {
  const workspaceService = overrides.workspaceService ?? noteWorkspaceService;
  const dependencies: NotesWorkspaceStoreDependencies = {
    workspaceService,
    layoutService: overrides.layoutService ?? noteLayoutService,
    workspaceOrchestrator:
      overrides.workspaceOrchestrator ?? createNoteWorkspaceOrchestrator(workspaceService),
    localStore: overrides.localStore ?? notesLocalStore,
    saveRetryPolicy: overrides.saveRetryPolicy,
    syncQueueStore: overrides.syncQueueStore ?? createBrowserNotesSyncQueueStore(),
    syncRuntime: overrides.syncRuntime,
  };

  return createStore<NotesWorkspaceStoreState>()(
    createNotesWorkspaceStoreState(dependencies),
  );
}

export type NotesWorkspaceStore = ReturnType<typeof createNotesWorkspaceStore>;

function createDefaultNotesWorkspaceStore() {
  return createNotesWorkspaceStore();
}

export let notesWorkspaceStore: NotesWorkspaceStore = createDefaultNotesWorkspaceStore();

export function getNotesWorkspaceStore(): NotesWorkspaceStore {
  return notesWorkspaceStore;
}

export function setNotesWorkspaceStore(store: NotesWorkspaceStore): NotesWorkspaceStore {
  notesWorkspaceStore = store;
  return notesWorkspaceStore;
}

export function configureNotesWorkspaceStore(
  overrides: Partial<NotesWorkspaceStoreDependencies> = {},
): NotesWorkspaceStore {
  return setNotesWorkspaceStore(createNotesWorkspaceStore(overrides));
}

export function resetNotesWorkspaceStore(): NotesWorkspaceStore {
  return setNotesWorkspaceStore(createDefaultNotesWorkspaceStore());
}

export function useNotesWorkspaceStore(): NotesWorkspaceStoreState;
export function useNotesWorkspaceStore<T>(
  selector: (state: NotesWorkspaceStoreState) => T,
): T;
export function useNotesWorkspaceStore<T>(
  selector?: (state: NotesWorkspaceStoreState) => T,
) {
  const store = notesWorkspaceStore;
  if (selector) {
    return useStore(store, selector);
  }

  return useStore(store);
}
