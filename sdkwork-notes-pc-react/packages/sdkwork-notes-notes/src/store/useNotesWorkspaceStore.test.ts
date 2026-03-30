import { describe, expect, it, vi } from 'vitest';
import type {
  Note,
  NoteFolder,
  NoteSummary,
  Page,
  PageRequest,
  ServiceResult,
} from '@sdkwork/notes-types';
import { createNotesWorkspaceStore } from './useNotesWorkspaceStore';

function ok<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

function page<T>(content: T[]): Page<T> {
  return {
    content,
    pageable: {
      pageNumber: 0,
      pageSize: content.length || 20,
      offset: 0,
      paged: true,
      unpaged: false,
      sort: { sorted: true, unsorted: false, empty: false },
    },
    last: true,
    totalPages: 1,
    totalElements: content.length,
    size: content.length || 20,
    number: 0,
    sort: { sorted: true, unsorted: false, empty: false },
    first: true,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

function createSummary(id: string, title: string, overrides: Partial<NoteSummary> = {}): NoteSummary {
  return {
    id,
    uuid: `uuid-${id}`,
    title,
    type: 'doc',
    parentId: null,
    tags: [],
    isFavorite: false,
    snippet: `${title} summary`,
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T12:00:00Z',
    ...overrides,
  };
}

function createNote(id: string, title: string, overrides: Partial<Note> = {}): Note {
  return {
    ...createSummary(id, title),
    content: `${title} content`,
    ...overrides,
  };
}

function createFolder(id: string, name: string, overrides: Partial<NoteFolder> = {}): NoteFolder {
  return {
    id,
    uuid: `folder-${id}`,
    name,
    parentId: null,
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T12:00:00Z',
    ...overrides,
  };
}

function createWorkspaceServiceStub(overrides: Partial<ReturnType<typeof createWorkspaceServiceDefaults>> = {}) {
  return {
    ...createWorkspaceServiceDefaults(),
    ...overrides,
  };
}

function createWorkspaceServiceDefaults() {
  return {
    queryWorkspaceSnapshot: vi.fn(async (_pageRequest?: PageRequest) =>
      ok({
        notes: [],
        trashedNotes: [],
        folders: [],
      })),
    findAll: vi.fn(async () => ok(page<NoteSummary>([]))),
    findTrashed: vi.fn(async () => ok(page<NoteSummary>([]))),
    getFolders: vi.fn(async () => ok([])),
    findById: vi.fn(async (_id: string) => ok<Note | null>(null)),
    save: vi.fn(async (_entity: Partial<Note>) => ok(createSummary('new-note', 'Untitled'))),
    createFolder: vi.fn(async (name: string, parentId: string | null) =>
      ok(createFolder('folder-new', name, { parentId }))),
    renameFolder: vi.fn(async (id: string) => ok(id)),
    moveToTrash: vi.fn(async (id: string) => ok(createSummary(id, `Trashed ${id}`, { deletedAt: '2026-03-30T13:00:00Z' }))),
    restoreFromTrash: vi.fn(async (id: string) => ok(createSummary(id, `Restored ${id}`))),
    deleteById: vi.fn(async (_id: string) => ok(undefined)),
    clearTrash: vi.fn(async () => ok(0)),
    deleteFolder: vi.fn(async (_id: string) => ok(undefined)),
    moveFolder: vi.fn(async (_id: string, _newParentId: string | null) => ok(undefined)),
    moveNote: vi.fn(async (_note: NoteSummary, _newParentId: string | null) => ok(undefined)),
    delete: vi.fn(async (entity: NoteSummary) => ok(undefined)),
    deleteAll: vi.fn(async (_ids: string[]) => ok(undefined)),
    findAllById: vi.fn(async (_ids: string[]) => ok([])),
    saveAll: vi.fn(async (_entities: Partial<NoteSummary>[]) => ok([])),
    count: vi.fn(async () => 0),
  };
}

describe('createNotesWorkspaceStore', () => {
  it('loads workspace snapshot, restores sidebar width, and opens the first note', async () => {
    const notes = [createSummary('note-1', 'Project brief')];
    const folders = [createFolder('folder-1', 'Strategy')];
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok({
          notes,
          trashedNotes: [],
          folders,
        })),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Project brief') : null)),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 368),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();

    expect(store.getState().sidebarWidth).toBe(368);
    expect(store.getState().notes).toEqual(notes);
    expect(store.getState().folders).toEqual(folders);
    expect(store.getState().activeNoteId).toBe('note-1');
    expect(store.getState().activeNote?.content).toBe('Project brief content');
    expect(store.getState().isLoading).toBe(false);
  });

  it('creates a new note and selects the created detail', async () => {
    const createdSummary = createSummary('note-42', 'Shipping checklist', { type: 'article' });
    const createdDetail = createNote('note-42', 'Shipping checklist', {
      type: 'article',
      content: '<p>Ready to ship</p>',
    });
    const workspaceService = createWorkspaceServiceStub({
      save: vi.fn(async () => ok(createdSummary)),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-42' ? createdDetail : null)),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    const createdId = await store.getState().createNote({
      title: 'Shipping checklist',
      type: 'article',
      parentId: null,
    });

    expect(createdId).toBe('note-42');
    expect(store.getState().activeNoteId).toBe('note-42');
    expect(store.getState().activeNote).toMatchObject({
      id: 'note-42',
      type: 'article',
      content: '<p>Ready to ship</p>',
    });
    expect(store.getState().notes[0]).toMatchObject({
      id: 'note-42',
      title: 'Shipping checklist',
    });
  });

  it('moves the active note to trash and clears the editor selection', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok({
          notes: [createSummary('note-7', 'Daily log')],
          trashedNotes: [],
          folders: [],
        })),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-7' ? createNote('note-7', 'Daily log') : null)),
      moveToTrash: vi.fn(async (id: string) =>
        ok(createSummary(id, 'Daily log', {
          deletedAt: '2026-03-30T18:00:00Z',
          type: 'log',
        }))),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();
    const moved = await store.getState().moveNoteToTrash('note-7');

    expect(moved).toBe(true);
    expect(store.getState().notes).toHaveLength(0);
    expect(store.getState().trashedNotes[0]).toMatchObject({
      id: 'note-7',
      deletedAt: '2026-03-30T18:00:00Z',
    });
    expect(store.getState().activeNoteId).toBeNull();
    expect(store.getState().activeNote).toBeNull();
  });

  it('renames a folder and keeps the selection on the updated entity', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok({
          notes: [],
          trashedNotes: [],
          folders: [createFolder('folder-7', 'Projects')],
        })),
      renameFolder: vi.fn(async () => ok('folder-7')),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();
    store.getState().setSelectedFolderId('folder-7');

    const renamedId = await store.getState().renameFolder('folder-7', 'Roadmaps');

    expect(renamedId).toBe('folder-7');
    expect(store.getState().selectedFolderId).toBe('folder-7');
    expect(store.getState().folders[0]).toMatchObject({
      id: 'folder-7',
      name: 'Roadmaps',
    });
  });

  it('keeps the current draft selected when saving fails during note switching', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok({
          notes: [
            createSummary('note-1', 'Draft one'),
            createSummary('note-2', 'Draft two', { updatedAt: '2026-03-30T11:00:00Z' }),
          ],
          trashedNotes: [],
          folders: [],
        })),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Draft one') : createNote('note-2', 'Draft two'))),
      save: vi.fn(async () => ({ success: false, message: 'Save failed' })),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();
    store.getState().updateActiveNoteDraft({ content: 'unsaved local edit' });

    await store.getState().selectNote('note-2');

    expect(store.getState().activeNoteId).toBe('note-1');
    expect(store.getState().activeNote?.content).toBe('unsaved local edit');
    expect(store.getState().saveState).toBe('error');
    expect(workspaceService.findById).toHaveBeenCalledTimes(1);
  });

  it('continues blocking note switching after a failed draft save leaves the note in error state', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok({
          notes: [
            createSummary('note-1', 'Draft one'),
            createSummary('note-2', 'Draft two', { updatedAt: '2026-03-30T11:00:00Z' }),
          ],
          trashedNotes: [],
          folders: [],
        })),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Draft one') : createNote('note-2', 'Draft two'))),
      save: vi.fn(async () => ({ success: false, message: 'Save failed' })),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();
    store.getState().updateActiveNoteDraft({ content: 'unsaved local edit' });

    await store.getState().selectNote('note-2');
    await store.getState().selectNote('note-2');

    expect(store.getState().activeNoteId).toBe('note-1');
    expect(store.getState().activeNote?.content).toBe('unsaved local edit');
    expect(store.getState().saveState).toBe('error');
    expect(workspaceService.save).toHaveBeenCalledTimes(2);
    expect(workspaceService.findById).toHaveBeenCalledTimes(1);
  });

  it('does not move a dirty note to trash when the save step fails', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok({
          notes: [createSummary('note-7', 'Daily log')],
          trashedNotes: [],
          folders: [],
        })),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-7' ? createNote('note-7', 'Daily log') : null)),
      save: vi.fn(async () => ({ success: false, message: 'Save failed' })),
      moveToTrash: vi.fn(async (id: string) =>
        ok(createSummary(id, 'Daily log', {
          deletedAt: '2026-03-30T18:00:00Z',
          type: 'log',
        }))),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();
    store.getState().updateActiveNoteDraft({ content: 'unsaved local edit' });

    const moved = await store.getState().moveNoteToTrash('note-7');

    expect(moved).toBe(false);
    expect(workspaceService.moveToTrash).not.toHaveBeenCalled();
    expect(store.getState().activeNoteId).toBe('note-7');
    expect(store.getState().activeNote?.content).toBe('unsaved local edit');
    expect(store.getState().saveState).toBe('error');
  });

  it('does not create a new note when the active draft cannot be saved first', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok({
          notes: [createSummary('note-1', 'Draft one')],
          trashedNotes: [],
          folders: [],
        })),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Draft one') : createNote(id, 'New note'))),
      save: vi.fn(async (entity: Partial<Note>) => (
        entity.id
          ? { success: false, message: 'Save failed' }
          : ok(createSummary('note-2', 'New note'))
      )),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();
    store.getState().updateActiveNoteDraft({ content: 'unsaved local edit' });

    const createdId = await store.getState().createNote({ title: 'New note' });

    expect(createdId).toBe('');
    expect(store.getState().activeNoteId).toBe('note-1');
    expect(store.getState().activeNote?.content).toBe('unsaved local edit');
    expect(store.getState().saveState).toBe('error');
    expect(workspaceService.findById).toHaveBeenCalledTimes(1);
    expect(workspaceService.save).toHaveBeenCalledTimes(1);
    expect(workspaceService.save).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 'note-1',
      content: 'unsaved local edit',
    }));
  });

  it('keeps unsaved draft fields when toggling favorite on the active dirty note', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok({
          notes: [createSummary('note-9', 'Remote title')],
          trashedNotes: [],
          folders: [],
        })),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-9' ? createNote('note-9', 'Remote title', {
          content: 'Remote body',
          tags: ['remote'],
        }) : null)),
      save: vi.fn(async () => ok(createSummary('note-9', 'Remote title', { isFavorite: true, tags: ['remote'] }))),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();
    store.getState().updateActiveNoteDraft({
      title: 'Local draft title',
      content: 'Local unsaved body',
      tags: ['local'],
    });

    const toggled = await store.getState().toggleFavorite('note-9');

    expect(toggled).toBe(true);
    expect(store.getState().activeNote).toMatchObject({
      id: 'note-9',
      title: 'Local draft title',
      content: 'Local unsaved body',
      tags: ['local'],
      isFavorite: true,
    });
    expect(store.getState().notes[0]).toMatchObject({
      id: 'note-9',
      title: 'Local draft title',
      tags: ['local'],
      isFavorite: true,
    });
    expect(store.getState().saveState).toBe('dirty');
  });

  it('deletes a folder, clears the selection, and refreshes the workspace snapshot', async () => {
    const queryWorkspaceSnapshot = vi
      .fn()
      .mockResolvedValueOnce(ok({
        notes: [createSummary('note-1', 'Project brief', { parentId: 'folder-1' })],
        trashedNotes: [],
        folders: [
          createFolder('folder-1', 'Projects'),
          createFolder('folder-2', 'Q2', { parentId: 'folder-1' }),
        ],
      }))
      .mockResolvedValueOnce(ok({
        notes: [createSummary('note-1', 'Project brief')],
        trashedNotes: [],
        folders: [],
      }));

    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot,
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Project brief') : null)),
      deleteFolder: vi.fn(async () => ok(undefined)),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();
    store.getState().setSelectedFolderId('folder-2');

    const removed = await store.getState().deleteFolder('folder-1');

    expect(removed).toBe(true);
    expect(workspaceService.deleteFolder).toHaveBeenCalledWith('folder-1');
    expect(queryWorkspaceSnapshot).toHaveBeenCalledTimes(2);
    expect(store.getState().selectedFolderId).toBeNull();
    expect(store.getState().folders).toHaveLength(0);
  });
});
