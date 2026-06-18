import type { Note, NoteFolder, NoteSummary, PageRequest, ServiceResult } from '@sdkwork/notes-pc-types';
import {
  createRemoteAppSdkNoteWorkspaceDataSource,
  type NoteWorkspaceDataSource,
  type NotesCollectionView,
  type NoteWorkspaceSnapshot,
} from '../types/notesWorkspace';

export interface NoteWorkspaceOrchestratorService {
  queryWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>>;
  findById(id: string): Promise<ServiceResult<Note | null>>;
}

export interface NoteWorkspaceSelectionState {
  activeNoteId: string | null;
  activeNote: Note | null;
}

export interface NoteWorkspaceInitializationState extends NoteWorkspaceSelectionState {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
  dataSource: NoteWorkspaceDataSource;
  selectedFolderId: string | null;
  activeNoteErrorMessage: string | null;
}

export interface NoteWorkspaceOrchestrator {
  initializeWorkspace(options?: {
    currentActiveNoteId?: string | null;
    currentActiveView?: NotesCollectionView;
    currentSelectedFolderId?: string | null;
    pageRequest?: PageRequest;
  }): Promise<ServiceResult<NoteWorkspaceInitializationState>>;
  loadWorkspaceNote(
    noteId: string | null,
    options?: {
      trashedNotes?: NoteSummary[];
    },
  ): Promise<ServiceResult<NoteWorkspaceSelectionState>>;
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

function toErrorMessage(message: string | undefined, fallback: string) {
  const normalized = normalizeString(message);
  return normalized || fallback;
}

function toDeletedNoteFallback(note: NoteSummary): Note {
  return {
    ...note,
    content: note.snippet,
  };
}

function resolveInitialActiveNoteId(notes: NoteSummary[], currentActiveNoteId?: string | null) {
  const normalizedCurrentId = normalizeString(currentActiveNoteId);
  if (normalizedCurrentId && notes.some((note) => note.id === normalizedCurrentId)) {
    return normalizedCurrentId;
  }

  return notes[0]?.id ?? null;
}

function resolveSelectionSource(options: {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  activeView?: NotesCollectionView;
}) {
  const { notes, trashedNotes, activeView } = options;

  if (activeView === 'trash') {
    return trashedNotes;
  }

  if (activeView === 'favorites') {
    return notes.filter((note) => note.isFavorite);
  }

  if (activeView === 'recent') {
    return notes.slice(0, 12);
  }

  return notes;
}

function resolveSelectedFolderId(
  folders: NoteFolder[],
  currentSelectedFolderId?: string | null,
  activeView?: NotesCollectionView,
) {
  if (activeView === 'trash') {
    return null;
  }

  const normalizedSelectedFolderId = normalizeString(currentSelectedFolderId);
  if (!normalizedSelectedFolderId) {
    return null;
  }

  return folders.some((folder) => folder.id === normalizedSelectedFolderId)
    ? normalizedSelectedFolderId
    : null;
}

class DefaultNoteWorkspaceOrchestrator implements NoteWorkspaceOrchestrator {
  constructor(private readonly service: NoteWorkspaceOrchestratorService) {}

  async loadWorkspaceNote(
    noteId: string | null,
    options: {
      trashedNotes?: NoteSummary[];
    } = {},
  ): Promise<ServiceResult<NoteWorkspaceSelectionState>> {
    const normalizedNoteId = normalizeString(noteId);
    if (!normalizedNoteId) {
      return {
        success: true,
        data: {
          activeNoteId: null,
          activeNote: null,
        },
      };
    }

    const result = await this.service.findById(normalizedNoteId);
    if (!result.success) {
      return {
        success: false,
        message: toErrorMessage(result.message, 'Failed to load note'),
      };
    }

    const deletedFallback = (options.trashedNotes ?? []).find((note) => note.id === normalizedNoteId);
    return {
      success: true,
      data: {
        activeNoteId: normalizedNoteId,
        activeNote: result.data ?? (deletedFallback ? toDeletedNoteFallback(deletedFallback) : null),
      },
    };
  }

  async initializeWorkspace(options: {
    currentActiveNoteId?: string | null;
    currentActiveView?: NotesCollectionView;
    currentSelectedFolderId?: string | null;
    pageRequest?: PageRequest;
  } = {}): Promise<ServiceResult<NoteWorkspaceInitializationState>> {
    const snapshotResult = await this.service.queryWorkspaceSnapshot(options.pageRequest);
    if (!snapshotResult.success || !snapshotResult.data) {
      return {
        success: false,
        message: toErrorMessage(snapshotResult.message, 'Failed to load notes workspace'),
      };
    }

    const notes = sortNotesByUpdatedAt(snapshotResult.data.notes || []);
    const trashedNotes = sortNotesByUpdatedAt(snapshotResult.data.trashedNotes || []);
    const folders = sortFoldersByName(snapshotResult.data.folders || []);
    const dataSource = snapshotResult.data.dataSource ?? createRemoteAppSdkNoteWorkspaceDataSource();
    const selectionSource = resolveSelectionSource({
      notes,
      trashedNotes,
      activeView: options.currentActiveView,
    });
    const selectedFolderId = resolveSelectedFolderId(
      folders,
      options.currentSelectedFolderId,
      options.currentActiveView,
    );
    const activeNoteId = resolveInitialActiveNoteId(selectionSource, options.currentActiveNoteId);

    const activeNoteResult = await this.loadWorkspaceNote(activeNoteId, { trashedNotes });
    if (!activeNoteResult.success || !activeNoteResult.data) {
      return {
        success: true,
        data: {
          notes,
          trashedNotes,
          folders,
          dataSource,
          selectedFolderId,
          activeNoteId,
          activeNote: null,
          activeNoteErrorMessage: toErrorMessage(activeNoteResult.message, 'Failed to load note'),
        },
      };
    }

    return {
      success: true,
      data: {
        notes,
        trashedNotes,
        folders,
        dataSource,
        selectedFolderId,
        activeNoteId: activeNoteResult.data.activeNoteId,
        activeNote: activeNoteResult.data.activeNote,
        activeNoteErrorMessage: null,
      },
    };
  }
}

export function createNoteWorkspaceOrchestrator(
  service: NoteWorkspaceOrchestratorService,
): NoteWorkspaceOrchestrator {
  return new DefaultNoteWorkspaceOrchestrator(service);
}
