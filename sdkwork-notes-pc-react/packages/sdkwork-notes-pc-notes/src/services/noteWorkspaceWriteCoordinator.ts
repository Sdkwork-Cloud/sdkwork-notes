import type { Note, NoteFolder, NoteSummary, ServiceResult } from '@sdkwork/notes-pc-types';
import { normalizeString } from '@sdkwork/notes-pc-commons';

export interface NoteWorkspaceCreatedNotePlan {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  activeNoteId: string;
  activeNote: Note;
  activeView: 'all';
  selectedFolderId: string | null;
  expandedFolderIds: string[];
}

export interface NoteWorkspaceCreatedFolderPlan {
  folders: NoteFolder[];
  expandedFolderIds: string[];
}

export interface NoteWorkspaceRenameFolderPlan {
  status: 'missing' | 'apply';
  folders: NoteFolder[];
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  activeNote: Note | null;
  expandedFolderIds: string[];
  selectedFolderId: string | null;
}

export interface NoteWorkspaceMoveNotePlan {
  status: 'missing' | 'noop' | 'apply';
  notes: NoteSummary[];
  activeNote: Note | null;
  expandedFolderIds: string[];
  nextParentId: string | null;
}

export interface NotesWorkspaceWriteCoordinatorDependencies {
  saveNote: (entity: Partial<Note>) => Promise<ServiceResult<NoteSummary>>;
  findNoteDetail: (id: string) => Promise<ServiceResult<Note | null>>;
  createFolder: (name: string, parentId: string | null) => Promise<ServiceResult<NoteFolder>>;
  renameFolder: (id: string, newName: string) => Promise<ServiceResult<string>>;
  moveNote: (note: NoteSummary, newParentId: string | null) => Promise<ServiceResult<void>>;
}

export type NoteWorkspaceCreateNoteStateResult =
  | ({
      status: 'apply';
      createdNoteId: string;
      errorMessage: null;
    } & NoteWorkspaceCreatedNotePlan)
  | {
      status: 'error';
      createdNoteId: '';
      errorMessage: string;
    };

export type NoteWorkspaceCreateFolderStateResult =
  | ({
      status: 'apply';
      createdFolderId: string;
      errorMessage: null;
    } & NoteWorkspaceCreatedFolderPlan)
  | {
      status: 'error';
      createdFolderId: '';
      errorMessage: string;
    };

export type NoteWorkspaceRenameFolderStateResult =
  | ({
      resolvedFolderId: string;
      errorMessage: null;
    } & NoteWorkspaceRenameFolderPlan)
  | {
      status: 'error';
      resolvedFolderId: string;
      errorMessage: string;
    };

export type NoteWorkspaceMoveNoteStateResult =
  | ({
      errorMessage: null;
    } & NoteWorkspaceMoveNotePlan)
  | {
      status: 'error';
      nextParentId: string | null;
      errorMessage: string;
    };

function normalizeParentId(parentId: string | null | undefined) {
  return normalizeString(parentId) || null;
}

function toErrorMessage(message: string | undefined, fallback: string) {
  const normalizedMessage = normalizeString(message);
  return normalizedMessage || fallback;
}

function normalizeFolderIds(folderIds: string[] | undefined) {
  const seen = new Set<string>();
  const normalizedIds: string[] = [];

  for (const folderId of folderIds ?? []) {
    const normalizedFolderId = normalizeString(folderId);
    if (!normalizedFolderId || seen.has(normalizedFolderId)) {
      continue;
    }

    seen.add(normalizedFolderId);
    normalizedIds.push(normalizedFolderId);
  }

  return normalizedIds;
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

export function planCreatedNoteState(options: {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  expandedFolderIds: string[];
  createdSummary: NoteSummary;
  createdDetail: Note;
}): NoteWorkspaceCreatedNotePlan {
  const { notes, trashedNotes, expandedFolderIds, createdSummary, createdDetail } = options;
  const nextParentId = normalizeParentId(createdSummary.parentId);
  const normalizedSummary = {
    ...createdSummary,
    parentId: nextParentId,
  };
  const normalizedDetail = {
    ...createdDetail,
    parentId: nextParentId,
  };

  return {
    notes: sortNotesByUpdatedAt(upsertById(notes, normalizedSummary)),
    trashedNotes: removeById(trashedNotes, normalizedSummary.id),
    activeNoteId: normalizedSummary.id,
    activeNote: normalizedDetail,
    activeView: 'all',
    selectedFolderId: nextParentId,
    expandedFolderIds: withExpandedFolder(normalizeFolderIds(expandedFolderIds), nextParentId),
  };
}

export function planCreatedFolderState(options: {
  folders: NoteFolder[];
  expandedFolderIds: string[];
  createdFolder: NoteFolder;
}): NoteWorkspaceCreatedFolderPlan {
  const { folders, expandedFolderIds, createdFolder } = options;
  const normalizedFolder = {
    ...createdFolder,
    parentId: normalizeParentId(createdFolder.parentId),
  };

  return {
    folders: sortFoldersByName([...folders, normalizedFolder]),
    expandedFolderIds: withExpandedFolder(
      normalizeFolderIds(expandedFolderIds),
      normalizedFolder.parentId,
    ),
  };
}

export function planRenamedFolderState(options: {
  folders: NoteFolder[];
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  activeNote: Note | null;
  expandedFolderIds: string[];
  selectedFolderId: string | null;
  folderId: string;
  resolvedFolderId: string;
  requestedName: string;
}): NoteWorkspaceRenameFolderPlan {
  const {
    folders,
    notes,
    trashedNotes,
    activeNote,
    expandedFolderIds,
    selectedFolderId,
    folderId,
    resolvedFolderId,
    requestedName,
  } = options;
  const normalizedFolderId = normalizeString(folderId);
  const currentFolder = folders.find((folder) => folder.id === normalizedFolderId);
  const normalizedExpandedFolderIds = normalizeFolderIds(expandedFolderIds);
  const normalizedSelectedFolderId = normalizeString(selectedFolderId) || null;

  if (!normalizedFolderId || !currentFolder) {
    return {
      status: 'missing',
      folders: sortFoldersByName(folders.map((folder) => ({
        ...folder,
        parentId: normalizeParentId(folder.parentId),
      }))),
      notes: sortNotesByUpdatedAt(notes.map((note) => ({
        ...note,
        parentId: normalizeParentId(note.parentId),
      }))),
      trashedNotes: sortNotesByUpdatedAt(trashedNotes.map((note) => ({
        ...note,
        parentId: normalizeParentId(note.parentId),
      }))),
      activeNote: activeNote
        ? {
            ...activeNote,
            parentId: normalizeParentId(activeNote.parentId),
          }
        : null,
      expandedFolderIds: normalizedExpandedFolderIds,
      selectedFolderId: normalizedSelectedFolderId,
    };
  }

  const nextFolderId = normalizeString(resolvedFolderId) || normalizedFolderId;
  const nextFolderName = normalizeString(requestedName) || currentFolder.name;
  const remapParentId = (parentId: string | null | undefined) => {
    const normalizedParentId = normalizeParentId(parentId);
    return normalizedParentId === normalizedFolderId ? nextFolderId : normalizedParentId;
  };

  return {
    status: 'apply',
    folders: sortFoldersByName(
      folders.map((folder) => {
        if (folder.id === normalizedFolderId) {
          return {
            ...folder,
            id: nextFolderId,
            name: nextFolderName,
            parentId: normalizeParentId(folder.parentId),
          };
        }

        return {
          ...folder,
          parentId: remapParentId(folder.parentId),
        };
      }),
    ),
    notes: sortNotesByUpdatedAt(
      notes.map((note) => ({
        ...note,
        parentId: remapParentId(note.parentId),
      })),
    ),
    trashedNotes: sortNotesByUpdatedAt(
      trashedNotes.map((note) => ({
        ...note,
        parentId: remapParentId(note.parentId),
      })),
    ),
    activeNote: activeNote
      ? {
          ...activeNote,
          parentId: remapParentId(activeNote.parentId),
        }
      : null,
    expandedFolderIds: normalizedExpandedFolderIds.map((expandedFolderId) =>
      expandedFolderId === normalizedFolderId ? nextFolderId : expandedFolderId),
    selectedFolderId:
      normalizedSelectedFolderId === normalizedFolderId
        ? nextFolderId
        : normalizedSelectedFolderId,
  };
}

export function planMovedNoteState(options: {
  notes: NoteSummary[];
  activeNote: Note | null;
  expandedFolderIds: string[];
  noteId: string;
  requestedParentId: string | null | undefined;
  updatedAt: string;
}): NoteWorkspaceMoveNotePlan {
  const { notes, activeNote, expandedFolderIds, noteId, requestedParentId, updatedAt } = options;
  const normalizedNoteId = normalizeString(noteId);
  const normalizedExpandedFolderIds = normalizeFolderIds(expandedFolderIds);
  const currentNote = notes.find((note) => note.id === normalizedNoteId);

  if (!normalizedNoteId || !currentNote) {
    return {
      status: 'missing',
      notes: sortNotesByUpdatedAt(notes),
      activeNote,
      expandedFolderIds: normalizedExpandedFolderIds,
      nextParentId: normalizeParentId(requestedParentId),
    };
  }

  const nextParentId = normalizeParentId(requestedParentId);
  if (normalizeParentId(currentNote.parentId) === nextParentId) {
    return {
      status: 'noop',
      notes: sortNotesByUpdatedAt(notes),
      activeNote,
      expandedFolderIds: normalizedExpandedFolderIds,
      nextParentId,
    };
  }

  const movedSummary = {
    ...currentNote,
    parentId: nextParentId,
    updatedAt,
  };

  return {
    status: 'apply',
    notes: sortNotesByUpdatedAt(upsertById(notes, movedSummary)),
    activeNote: activeNote?.id === normalizedNoteId
      ? {
          ...activeNote,
          parentId: nextParentId,
          updatedAt,
        }
      : activeNote,
    expandedFolderIds: withExpandedFolder(normalizedExpandedFolderIds, nextParentId),
    nextParentId,
  };
}

export function createNotesWorkspaceWriteCoordinator(
  dependencies: NotesWorkspaceWriteCoordinatorDependencies,
) {
  const { saveNote, findNoteDetail, createFolder, renameFolder, moveNote } = dependencies;

  return {
    async createFolderState(options: {
      folders: NoteFolder[];
      expandedFolderIds: string[];
      name: string;
      parentId: string | null;
    }): Promise<NoteWorkspaceCreateFolderStateResult> {
      const result = await createFolder(options.name, options.parentId);
      if (!result.success || !result.data) {
        return {
          status: 'error',
          createdFolderId: '',
          errorMessage: toErrorMessage(result.message, 'Failed to create folder'),
        };
      }

      return {
        status: 'apply',
        createdFolderId: result.data.id,
        errorMessage: null,
        ...planCreatedFolderState({
          folders: options.folders,
          expandedFolderIds: options.expandedFolderIds,
          createdFolder: result.data,
        }),
      };
    },
    async createNoteState(options: {
      notes: NoteSummary[];
      trashedNotes: NoteSummary[];
      expandedFolderIds: string[];
      input: Partial<Note>;
    }): Promise<NoteWorkspaceCreateNoteStateResult> {
      const result = await saveNote(options.input);
      if (!result.success || !result.data) {
        return {
          status: 'error',
          createdNoteId: '',
          errorMessage: toErrorMessage(result.message, 'Failed to create note'),
        };
      }

      const createdSummary = result.data;
      const detailResult = await findNoteDetail(createdSummary.id);
      const createdDetail = detailResult.success && detailResult.data
        ? detailResult.data
        : {
            ...createdSummary,
            content: typeof options.input.content === 'string' ? options.input.content : '',
          };

      return {
        status: 'apply',
        createdNoteId: createdSummary.id,
        errorMessage: null,
        ...planCreatedNoteState({
          notes: options.notes,
          trashedNotes: options.trashedNotes,
          expandedFolderIds: options.expandedFolderIds,
          createdSummary,
          createdDetail,
        }),
      };
    },
    async renameFolderState(options: {
      folders: NoteFolder[];
      notes: NoteSummary[];
      trashedNotes: NoteSummary[];
      activeNote: Note | null;
      expandedFolderIds: string[];
      selectedFolderId: string | null;
      folderId: string;
      requestedName: string;
    }): Promise<NoteWorkspaceRenameFolderStateResult> {
      const normalizedFolderId = normalizeString(options.folderId);
      const result = await renameFolder(options.folderId, options.requestedName);
      if (!result.success) {
        return {
          status: 'error',
          resolvedFolderId: normalizedFolderId,
          errorMessage: toErrorMessage(result.message, 'Failed to rename folder'),
        };
      }

      const resolvedFolderId = normalizeString(result.data) || normalizedFolderId;

      return {
        errorMessage: null,
        resolvedFolderId,
        ...planRenamedFolderState({
          folders: options.folders,
          notes: options.notes,
          trashedNotes: options.trashedNotes,
          activeNote: options.activeNote,
          expandedFolderIds: options.expandedFolderIds,
          selectedFolderId: options.selectedFolderId,
          folderId: normalizedFolderId,
          resolvedFolderId,
          requestedName: options.requestedName,
        }),
      };
    },
    async moveNoteState(options: {
      notes: NoteSummary[];
      activeNote: Note | null;
      expandedFolderIds: string[];
      note: NoteSummary;
      requestedParentId: string | null;
      updatedAt: string;
    }): Promise<NoteWorkspaceMoveNoteStateResult> {
      const movePlan = planMovedNoteState({
        notes: options.notes,
        activeNote: options.activeNote,
        expandedFolderIds: options.expandedFolderIds,
        noteId: options.note.id,
        requestedParentId: options.requestedParentId,
        updatedAt: options.updatedAt,
      });

      if (movePlan.status === 'missing' || movePlan.status === 'noop') {
        return {
          errorMessage: null,
          ...movePlan,
        };
      }

      const result = await moveNote(options.note, movePlan.nextParentId);
      if (!result.success) {
        return {
          status: 'error',
          nextParentId: movePlan.nextParentId,
          errorMessage: toErrorMessage(result.message, 'Failed to move note'),
        };
      }

      return {
        errorMessage: null,
        ...movePlan,
      };
    },
  };
}
