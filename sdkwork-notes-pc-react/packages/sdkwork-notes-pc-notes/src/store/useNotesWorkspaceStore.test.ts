import { describe, expect, it, vi } from 'vitest';
import type {
  Note,
  NoteFolder,
  NoteSummary,
  PageRequest,
  ServiceResult,
} from '@sdkwork/notes-pc-types-commons';
import {
  createEmptyNoteWorkspaceSnapshot,
  createRemoteAppSdkNoteWorkspaceDataSource,
  type NoteWorkspaceSnapshot,
} from '../types/notesWorkspace';
import { createNotesWorkspaceStore, type NoteWorkspaceStoreService } from './useNotesWorkspaceStore';
import { createNotesWorkspaceSaveRetryPolicy } from '../services/noteWorkspaceSaveRetryPolicy';

function ok<T>(data: T): ServiceResult<T> {
  return { success: true, data };
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

function createWorkspaceSnapshot(
  overrides: Partial<NoteWorkspaceSnapshot> = {},
): NoteWorkspaceSnapshot {
  return createEmptyNoteWorkspaceSnapshot(overrides);
}

function createWorkspaceServiceStub(overrides: Partial<NoteWorkspaceStoreService> = {}) {
  return {
    ...createWorkspaceServiceDefaults(),
    ...overrides,
  };
}

function createStoreWithoutSaveRetries(
  overrides: Parameters<typeof createNotesWorkspaceStore>[0] = {},
) {
  return createNotesWorkspaceStore({
    saveRetryPolicy: createNotesWorkspaceSaveRetryPolicy({ retryDelaysMs: [] }),
    ...overrides,
  });
}

function createWorkspaceServiceDefaults(): NoteWorkspaceStoreService {
  return {
    queryWorkspaceSnapshot: vi.fn(async (_pageRequest?: PageRequest) =>
      ok(createWorkspaceSnapshot())),
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
  };
}

type WorkspaceSnapshotResult = ServiceResult<NoteWorkspaceSnapshot>;

describe('createNotesWorkspaceStore', () => {
  it('loads workspace snapshot, restores sidebar width, and opens the first note', async () => {
    const notes = [createSummary('note-1', 'Project brief')];
    const folders = [createFolder('folder-1', 'Strategy')];
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok(createWorkspaceSnapshot({
          notes,
          folders,
        }))),
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
    expect(store.getState().dataSource).toEqual(createRemoteAppSdkNoteWorkspaceDataSource());
    expect(store.getState().activeNoteId).toBe('note-1');
    expect(store.getState().activeNote?.content).toBe('Project brief content');
    expect(store.getState().isLoading).toBe(false);
  });

  it('deduplicates overlapping initialize calls so StrictMode-style remounts do not reload the workspace twice', async () => {
    let hasPendingSnapshotResolver = false;
    let resolveSnapshot!: (value: WorkspaceSnapshotResult) => void;

    const queryWorkspaceSnapshot = vi.fn(
      () =>
        new Promise<WorkspaceSnapshotResult>((resolve) => {
          hasPendingSnapshotResolver = true;
          resolveSnapshot = resolve;
        }),
    );
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot,
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Project brief') : null)),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 320),
        saveSidebarWidth: vi.fn(),
      },
    });

    const firstInitialize = store.getState().initialize();
    const secondInitialize = store.getState().initialize();

    expect(queryWorkspaceSnapshot).toHaveBeenCalledTimes(1);

    if (!hasPendingSnapshotResolver) {
      throw new Error('Expected initialize to start loading the workspace snapshot.');
    }

    resolveSnapshot(ok(createWorkspaceSnapshot({
      notes: [createSummary('note-1', 'Project brief')],
    })));

    await Promise.all([firstInitialize, secondInitialize]);

    expect(queryWorkspaceSnapshot).toHaveBeenCalledTimes(1);
    expect(workspaceService.findById).toHaveBeenCalledTimes(1);
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

  it('enqueues a sync task after creating a new note', async () => {
    const createdSummary = createSummary('note-42', 'Shipping checklist', {
      type: 'article',
      updatedAt: '2026-04-13T14:00:00Z',
    });
    const createdDetail = createNote('note-42', 'Shipping checklist', {
      type: 'article',
      content: '<p>Ready to ship</p>',
      updatedAt: '2026-04-13T14:00:00Z',
    });
    const workspaceService = createWorkspaceServiceStub({
      save: vi.fn(async () => ok(createdSummary)),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-42' ? createdDetail : null)),
    });
    const syncQueueStore = {
      loadQueue: vi.fn(async () => ({ tasks: [] })),
      saveQueue: vi.fn(async (_snapshot: { tasks: unknown[] }) => undefined),
      clearQueue: vi.fn(async () => undefined),
    };

    const store = createNotesWorkspaceStore(
      Object.assign({
        workspaceService,
        layoutService: {
          getSidebarWidth: vi.fn(() => 300),
          saveSidebarWidth: vi.fn(),
        },
      }, {
        syncQueueStore,
      }) as Parameters<typeof createNotesWorkspaceStore>[0],
    );

    await store.getState().createNote({
      title: 'Shipping checklist',
      type: 'article',
      parentId: null,
    });

    expect(syncQueueStore.loadQueue).toHaveBeenCalledTimes(1);
    expect(syncQueueStore.saveQueue).toHaveBeenCalledTimes(1);
    expect(syncQueueStore.saveQueue).toHaveBeenCalledWith({
      tasks: [
        expect.objectContaining({
          id: expect.any(String),
          entityType: 'note',
          entityId: 'note-42',
          operation: 'upsert',
          replayable: false,
          status: 'queued',
          createdAt: '2026-04-13T14:00:00.000Z',
          updatedAt: '2026-04-13T14:00:00.000Z',
          enqueuedAt: '2026-04-13T14:00:00.000Z',
          startedAt: null,
          completedAt: null,
          nextRetryAt: null,
          retryCount: 0,
          attemptCount: 0,
          localRevision: null,
          remoteCursor: null,
          lastFailure: null,
          lastConflict: null,
        }),
      ],
    });
  });

  it('requests a sync drain after creating a new note when a sync runtime is available', async () => {
    const createdSummary = createSummary('note-42', 'Shipping checklist', {
      type: 'article',
      updatedAt: '2026-04-13T14:00:00Z',
    });
    const createdDetail = createNote('note-42', 'Shipping checklist', {
      type: 'article',
      content: '<p>Ready to ship</p>',
      updatedAt: '2026-04-13T14:00:00Z',
    });
    const workspaceService = createWorkspaceServiceStub({
      save: vi.fn(async () => ok(createdSummary)),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-42' ? createdDetail : null)),
    });
    const syncQueueStore = {
      loadQueue: vi.fn(async () => ({ tasks: [] })),
      saveQueue: vi.fn(async (_snapshot: { tasks: unknown[] }) => undefined),
      clearQueue: vi.fn(async () => undefined),
    };
    const syncRuntime = {
      requestDrain: vi.fn(async () => undefined),
      dispose: vi.fn(),
    };

    const store = createNotesWorkspaceStore(
      Object.assign({
        workspaceService,
        layoutService: {
          getSidebarWidth: vi.fn(() => 300),
          saveSidebarWidth: vi.fn(),
        },
      }, {
        syncQueueStore,
        syncRuntime,
      }) as Parameters<typeof createNotesWorkspaceStore>[0],
    );

    await store.getState().createNote({
      title: 'Shipping checklist',
      type: 'article',
      parentId: null,
    });

    expect(syncQueueStore.saveQueue).toHaveBeenCalledTimes(1);
    expect(syncRuntime.requestDrain).toHaveBeenCalledTimes(1);
  });

  it('requests a sync drain after initialize when a sync runtime is available', async () => {
    const notes = [createSummary('note-1', 'Project brief')];
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok(createWorkspaceSnapshot({
          notes,
        }))),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Project brief') : null)),
    });
    const syncRuntime = {
      requestDrain: vi.fn(async () => undefined),
      dispose: vi.fn(),
    };

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 368),
        saveSidebarWidth: vi.fn(),
      },
      syncRuntime,
    } as Parameters<typeof createNotesWorkspaceStore>[0]);

    await store.getState().initialize();

    expect(syncRuntime.requestDrain).toHaveBeenCalledTimes(1);
  });

  it('moves the active note to trash and clears the editor selection', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok(createWorkspaceSnapshot({
          notes: [createSummary('note-7', 'Daily log')],
        }))),
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
        ok(createWorkspaceSnapshot({
          folders: [createFolder('folder-7', 'Projects')],
        }))),
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

  it('rewires descendants and note parents when a folder rename resolves to a different id', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok(createWorkspaceSnapshot({
          notes: [createSummary('note-1', 'Project brief', { parentId: 'folder-7' })],
          trashedNotes: [],
          folders: [
            createFolder('folder-7', 'Projects'),
            createFolder('folder-8', 'Specs', { parentId: 'folder-7' }),
          ],
        }))),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Project brief', { parentId: 'folder-7' }) : null)),
      renameFolder: vi.fn(async () => ok('folder-99')),
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
    store.getState().toggleFolderExpanded('folder-7');

    const renamedId = await store.getState().renameFolder('folder-7', 'Roadmaps');

    expect(renamedId).toBe('folder-99');
    expect(store.getState().selectedFolderId).toBe('folder-99');
    expect(store.getState().expandedFolderIds).toContain('folder-99');
    expect(store.getState().folders).toEqual([
      expect.objectContaining({
        id: 'folder-99',
        name: 'Roadmaps',
      }),
      expect.objectContaining({
        id: 'folder-8',
        parentId: 'folder-99',
      }),
    ]);
    expect(store.getState().notes[0]).toMatchObject({
      id: 'note-1',
      parentId: 'folder-99',
    });
    expect(store.getState().activeNote).toMatchObject({
      id: 'note-1',
      parentId: 'folder-99',
    });
  });

  it('keeps the current draft selected when saving fails during note switching', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok(createWorkspaceSnapshot({
          notes: [
            createSummary('note-1', 'Draft one'),
            createSummary('note-2', 'Draft two', { updatedAt: '2026-03-30T11:00:00Z' }),
          ],
          trashedNotes: [],
          folders: [],
        }))),
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
        ok(createWorkspaceSnapshot({
          notes: [
            createSummary('note-1', 'Draft one'),
            createSummary('note-2', 'Draft two', { updatedAt: '2026-03-30T11:00:00Z' }),
          ],
          trashedNotes: [],
          folders: [],
        }))),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Draft one') : createNote('note-2', 'Draft two'))),
      save: vi.fn(async () => ({ success: false, message: 'Save failed' })),
    });

    const store = createStoreWithoutSaveRetries({
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
        ok(createWorkspaceSnapshot({
          notes: [createSummary('note-7', 'Daily log')],
          trashedNotes: [],
          folders: [],
        }))),
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
        ok(createWorkspaceSnapshot({
          notes: [createSummary('note-1', 'Draft one')],
          trashedNotes: [],
          folders: [],
        }))),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Draft one') : createNote(id, 'New note'))),
      save: vi.fn(async (entity: Partial<Note>) => (
        entity.id
          ? { success: false, message: 'Save failed' }
          : ok(createSummary('note-2', 'New note'))
      )),
    });

    const store = createStoreWithoutSaveRetries({
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
        ok(createWorkspaceSnapshot({
          notes: [createSummary('note-9', 'Remote title')],
          trashedNotes: [],
          folders: [],
        }))),
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

  it('persists document status changes as a focused delta through the workspace service', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok(createWorkspaceSnapshot({
          notes: [createSummary('note-5', 'Architecture review', { publishStatus: 'draft' })],
          trashedNotes: [],
          folders: [],
        }))),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-5' ? createNote('note-5', 'Architecture review', { publishStatus: 'draft' }) : null)),
      save: vi.fn(async () =>
        ok(createSummary('note-5', 'Architecture review', {
          publishStatus: 'archived',
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
    store.getState().updateActiveNoteDraft({ publishStatus: 'archived' });

    const saved = await store.getState().persistActiveNote();

    expect(saved).toBe(true);
    expect(workspaceService.save).toHaveBeenLastCalledWith({
      id: 'note-5',
      publishStatus: 'archived',
    });
    expect(store.getState().activeNote).toMatchObject({
      id: 'note-5',
      publishStatus: 'archived',
    });
  });

  it('deletes a folder, clears the selection, and refreshes the workspace snapshot', async () => {
    const queryWorkspaceSnapshot = vi
      .fn()
      .mockResolvedValueOnce(ok(createWorkspaceSnapshot({
        notes: [createSummary('note-1', 'Project brief', { parentId: 'folder-1' })],
        trashedNotes: [],
        folders: [
          createFolder('folder-1', 'Projects'),
          createFolder('folder-2', 'Q2', { parentId: 'folder-1' }),
        ],
      })))
      .mockResolvedValueOnce(ok(createWorkspaceSnapshot({
        notes: [createSummary('note-1', 'Project brief')],
        trashedNotes: [],
        folders: [],
      })));

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

  it('moves a note into another folder and keeps the active note parent in sync', async () => {
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok(createWorkspaceSnapshot({
          notes: [createSummary('note-1', 'Project brief', { parentId: null })],
          trashedNotes: [],
          folders: [
            createFolder('folder-a', 'Projects'),
            createFolder('folder-b', 'Roadmap'),
          ],
        }))),
      findById: vi.fn(async (id: string) =>
        ok(id === 'note-1' ? createNote('note-1', 'Project brief', { parentId: null }) : null)),
      moveNote: vi.fn(async (_note: NoteSummary, _newParentId: string | null) => ok(undefined)),
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();

    const moved = await store.getState().moveNote('note-1', 'folder-b');

    expect(moved).toBe(true);
    expect(workspaceService.moveNote).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'note-1',
        parentId: null,
      }),
      'folder-b',
    );
    expect(store.getState().notes[0]).toMatchObject({
      id: 'note-1',
      parentId: 'folder-b',
    });
    expect(store.getState().activeNote).toMatchObject({
      id: 'note-1',
      parentId: 'folder-b',
    });
  });

  it('moves a folder to the root level and rejects invalid descendant moves', async () => {
    const moveFolder = vi.fn(async (_id: string, _newParentId: string | null) => ok(undefined));
    const workspaceService = createWorkspaceServiceStub({
      queryWorkspaceSnapshot: vi.fn(async () =>
        ok(createWorkspaceSnapshot({
          notes: [],
          trashedNotes: [],
          folders: [
            createFolder('folder-a', 'Projects'),
            createFolder('folder-b', 'Roadmap', { parentId: 'folder-a' }),
            createFolder('folder-c', 'Research', { parentId: 'folder-b' }),
          ],
        }))),
      moveFolder,
    });

    const store = createNotesWorkspaceStore({
      workspaceService,
      layoutService: {
        getSidebarWidth: vi.fn(() => 300),
        saveSidebarWidth: vi.fn(),
      },
    });

    await store.getState().initialize();

    const invalidMove = await store.getState().moveFolder('folder-a', 'folder-c');
    const movedToRoot = await store.getState().moveFolder('folder-b', null);

    expect(invalidMove).toBe(false);
    expect(moveFolder).toHaveBeenCalledTimes(1);
    expect(moveFolder).toHaveBeenCalledWith('folder-b', null);
    expect(movedToRoot).toBe(true);
    expect(store.getState().folders.find((folder) => folder.id === 'folder-b')).toMatchObject({
      id: 'folder-b',
      parentId: null,
    });
  });
});
