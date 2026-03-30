import { create, type StateCreator } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { Note, NoteFolder, NoteSummary, PageRequest, ServiceResult } from '@sdkwork/notes-types';
import { noteLayoutService, noteWorkspaceService } from '../services';
import type {
  CreateNoteInput,
  NoteSaveState,
  NotesCollectionView,
  NoteWorkspaceSnapshot,
} from '../types/notesWorkspace';

const DEFAULT_NOTE_TITLE = 'Untitled';

export interface NoteWorkspaceStoreService {
  queryWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>>;
  findById(id: string): Promise<ServiceResult<Note | null>>;
  save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>>;
  createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>>;
  renameFolder(id: string, newName: string): Promise<ServiceResult<string>>;
  deleteFolder(id: string): Promise<ServiceResult<void>>;
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
}

export interface NotesWorkspaceStoreState {
  isLoading: boolean;
  saveState: NoteSaveState;
  errorMessage: string | null;
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
  activeNoteId: string | null;
  activeNote: Note | null;
  activeView: NotesCollectionView;
  searchQuery: string;
  selectedFolderId: string | null;
  sidebarWidth: number;
  expandedFolderIds: string[];
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  selectNote: (id: string | null) => Promise<void>;
  createNote: (input?: Partial<CreateNoteInput>) => Promise<string>;
  createFolder: (name: string, parentId?: string | null) => Promise<string>;
  renameFolder: (id: string, newName: string) => Promise<string>;
  deleteFolder: (id: string) => Promise<boolean>;
  updateActiveNoteDraft: (patch: Partial<Note>) => void;
  persistActiveNote: () => Promise<boolean>;
  moveNoteToTrash: (id: string) => Promise<boolean>;
  restoreNoteFromTrash: (id: string) => Promise<boolean>;
  deleteNotePermanently: (id: string) => Promise<boolean>;
  clearTrash: () => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
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

function collectFolderTreeIds(folders: NoteFolder[], rootId: string) {
  const ids = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || ids.has(currentId)) {
      continue;
    }

    ids.add(currentId);
    folders.forEach((folder) => {
      if (folder.parentId === currentId) {
        queue.push(folder.id);
      }
    });
  }

  return ids;
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

function createNotesWorkspaceStoreState(
  dependencies: NotesWorkspaceStoreDependencies,
): StateCreator<NotesWorkspaceStoreState, [], [], NotesWorkspaceStoreState> {
  const { workspaceService, layoutService } = dependencies;
  let selectionRequestId = 0;

  return (set, get) => {
    const persistUnsavedActiveNoteIfNeeded = async () => {
      const { activeNote, saveState } = get();
      if (!activeNote || (saveState !== 'dirty' && saveState !== 'error')) {
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
        set({
          activeNoteId: null,
          activeNote: null,
          saveState: 'idle',
        });
        return;
      }

      const requestId = selectionRequestId + 1;
      selectionRequestId = requestId;

      set({
        activeNoteId: nextNoteId,
        errorMessage: null,
      });

      const result = await workspaceService.findById(nextNoteId);
      if (requestId !== selectionRequestId) {
        return;
      }

      if (!result.success) {
        set({
          activeNote: null,
          saveState: 'error',
          errorMessage: toErrorMessage(result.message, 'Failed to load note'),
        });
        return;
      }

      const deletedSummary = get().trashedNotes.find((note) => note.id === nextNoteId);

      set({
        activeNote: result.data ?? (deletedSummary
          ? {
              ...deletedSummary,
              content: deletedSummary.snippet,
            }
          : null),
        saveState: 'idle',
      });
    };

    const applySnapshot = async (snapshot: NoteWorkspaceSnapshot) => {
      const nextNotes = sortNotesByUpdatedAt(snapshot.notes || []);
      const nextTrashedNotes = sortNotesByUpdatedAt(snapshot.trashedNotes || []);
      const nextFolders = sortFoldersByName(snapshot.folders || []);
      const currentActiveId = get().activeNoteId;
      const resolvedActiveId =
        currentActiveId && nextNotes.some((note) => note.id === currentActiveId)
          ? currentActiveId
          : (nextNotes[0]?.id ?? null);

      set({
        notes: nextNotes,
        trashedNotes: nextTrashedNotes,
        folders: nextFolders,
        isLoading: false,
        errorMessage: null,
      });

      await loadActiveNote(resolvedActiveId, true);
    };

    return {
      isLoading: false,
      saveState: 'idle',
      errorMessage: null,
      notes: [],
      trashedNotes: [],
      folders: [],
      activeNoteId: null,
      activeNote: null,
      activeView: 'all',
      searchQuery: '',
      selectedFolderId: null,
      sidebarWidth: layoutService.getSidebarWidth(),
      expandedFolderIds: [],
      async initialize() {
        set({
          isLoading: true,
          errorMessage: null,
          sidebarWidth: layoutService.getSidebarWidth(get().sidebarWidth),
        });

        const snapshotResult = await workspaceService.queryWorkspaceSnapshot();

        if (!snapshotResult.success || !snapshotResult.data) {
          set({
            isLoading: false,
            saveState: 'error',
            errorMessage: toErrorMessage(snapshotResult.message, 'Failed to load notes workspace'),
          });
          return;
        }

        await applySnapshot(snapshotResult.data);
      },
      async refresh() {
        await get().initialize();
      },
      async selectNote(id) {
        await loadActiveNote(id);
      },
      async createNote(input = {}) {
        const persisted = await persistUnsavedActiveNoteIfNeeded();
        if (!persisted) {
          return '';
        }

        const result = await workspaceService.save({
          title: normalizeString(input.title) || DEFAULT_NOTE_TITLE,
          type: input.type ?? 'doc',
          parentId: input.parentId ?? null,
          content: input.content ?? '',
          tags: input.tags ?? [],
          isFavorite: false,
        });

        if (!result.success || !result.data) {
          set({
            saveState: 'error',
            errorMessage: toErrorMessage(result.message, 'Failed to create note'),
          });
          return '';
        }

        const createdSummary = result.data;
        const detailResult = await workspaceService.findById(createdSummary.id);
        const createdDetail = detailResult.success && detailResult.data
          ? detailResult.data
          : {
              ...createdSummary,
              content: input.content ?? '',
            };

        set((state) => ({
          notes: sortNotesByUpdatedAt(upsertById(state.notes, createdSummary)),
          trashedNotes: removeById(state.trashedNotes, createdSummary.id),
          activeNoteId: createdSummary.id,
          activeNote: createdDetail,
          activeView: 'all',
          selectedFolderId: createdSummary.parentId,
          expandedFolderIds: withExpandedFolder(state.expandedFolderIds, createdSummary.parentId),
          saveState: 'saved',
          errorMessage: null,
        }));

        return createdSummary.id;
      },
      async createFolder(name, parentId = null) {
        const result = await workspaceService.createFolder(name, parentId);
        if (!result.success || !result.data) {
          set({
            errorMessage: toErrorMessage(result.message, 'Failed to create folder'),
          });
          return '';
        }

        set((state) => ({
          folders: sortFoldersByName([...state.folders, result.data!]),
          expandedFolderIds: withExpandedFolder(state.expandedFolderIds, parentId),
          errorMessage: null,
        }));

        return result.data.id;
      },
      async renameFolder(id, newName) {
        const result = await workspaceService.renameFolder(id, newName);
        if (!result.success || !result.data) {
          set({
            errorMessage: toErrorMessage(result.message, 'Failed to rename folder'),
          });
          return id;
        }

        set((state) => ({
          folders: sortFoldersByName(
            state.folders.map((folder) =>
              folder.id === id
                ? {
                    ...folder,
                    id: result.data || id,
                    name: normalizeString(newName) || folder.name,
                  }
                : folder),
          ),
          expandedFolderIds: state.expandedFolderIds.map((folderId) =>
            folderId === id ? (result.data || id) : folderId),
          selectedFolderId: state.selectedFolderId === id ? (result.data || id) : state.selectedFolderId,
          errorMessage: null,
        }));

        return result.data;
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

        const removedFolderIds = collectFolderTreeIds(get().folders, folderId);

        set((state) => ({
          selectedFolderId: state.selectedFolderId && removedFolderIds.has(state.selectedFolderId)
            ? null
            : state.selectedFolderId,
          expandedFolderIds: state.expandedFolderIds.filter((expandedId) => !removedFolderIds.has(expandedId)),
          errorMessage: null,
        }));

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

        set((state) => ({
          activeNote: nextActiveNote,
          notes: nextActiveNote.deletedAt
            ? removeById(state.notes, nextActiveNote.id)
            : sortNotesByUpdatedAt(upsertById(state.notes, nextSummary)),
          trashedNotes: nextActiveNote.deletedAt
            ? sortNotesByUpdatedAt(upsertById(state.trashedNotes, nextSummary))
            : removeById(state.trashedNotes, nextActiveNote.id),
          saveState: 'dirty',
          errorMessage: null,
        }));
      },
      async persistActiveNote() {
        const activeNote = get().activeNote;
        if (!activeNote) {
          return true;
        }

        set({
          saveState: 'saving',
          errorMessage: null,
        });

        const result = await workspaceService.save({
          id: activeNote.id,
          title: activeNote.title,
          content: activeNote.content,
          type: activeNote.type,
          parentId: activeNote.parentId,
          tags: activeNote.tags,
          isFavorite: activeNote.isFavorite,
        });

        if (!result.success || !result.data) {
          set({
            saveState: 'error',
            errorMessage: toErrorMessage(result.message, 'Failed to save note'),
          });
          return false;
        }

        const savedSummary = result.data;
        const nextActiveNote = mergeSummaryIntoNote(activeNote, savedSummary);

        set((state) => ({
          notes: sortNotesByUpdatedAt(upsertById(state.notes, savedSummary)),
          trashedNotes: removeById(state.trashedNotes, savedSummary.id),
          activeNote: nextActiveNote,
          activeNoteId: nextActiveNote.id,
          saveState: 'saved',
          errorMessage: null,
        }));

        return true;
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

        set((state) => ({
          notes: removeById(state.notes, noteId),
          trashedNotes: sortNotesByUpdatedAt(upsertById(state.trashedNotes, result.data!)),
          activeNoteId: state.activeNoteId === noteId ? null : state.activeNoteId,
          activeNote: state.activeNoteId === noteId ? null : state.activeNote,
          saveState: state.activeNoteId === noteId ? 'idle' : state.saveState,
          errorMessage: null,
        }));

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

        set((state) => ({
          notes: removeById(state.notes, noteId),
          trashedNotes: removeById(state.trashedNotes, noteId),
          activeNoteId: state.activeNoteId === noteId ? null : state.activeNoteId,
          activeNote: state.activeNoteId === noteId ? null : state.activeNote,
          saveState: state.activeNoteId === noteId ? 'idle' : state.saveState,
          errorMessage: null,
        }));

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

        set({
          trashedNotes: [],
          activeNoteId: activeNoteId && trashedIdSet.has(activeNoteId) ? null : activeNoteId,
          activeNote: activeNoteId && trashedIdSet.has(activeNoteId) ? null : get().activeNote,
          saveState: activeNoteId && trashedIdSet.has(activeNoteId) ? 'idle' : get().saveState,
          errorMessage: null,
        });

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

        return true;
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
  const dependencies: NotesWorkspaceStoreDependencies = {
    workspaceService: overrides.workspaceService ?? noteWorkspaceService,
    layoutService: overrides.layoutService ?? noteLayoutService,
  };

  return createStore<NotesWorkspaceStoreState>()(
    createNotesWorkspaceStoreState(dependencies),
  );
}

export const notesWorkspaceStore = createNotesWorkspaceStore();

export const useNotesWorkspaceStore = create<NotesWorkspaceStoreState>()(
  createNotesWorkspaceStoreState({
    workspaceService: noteWorkspaceService,
    layoutService: noteLayoutService,
  }),
);
