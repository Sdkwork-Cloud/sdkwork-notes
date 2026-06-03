import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceWritePathModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-notes/src/services/noteWorkspaceWriteCoordinator.ts',
  );
  const source = await readFile(entryPoint, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  });

  return import(createDataModuleUrl(transpiled.outputText));
}

const workspaceWritePathModule = await loadWorkspaceWritePathModule();

function createFolder(id, name, overrides = {}) {
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
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T12:00:00Z',
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

test('create note plan selects the created note, removes stale trash copies, and expands the parent folder', () => {
  const createdSummary = createSummary('note-9', 'Shipping checklist', {
    parentId: 'folder-a',
    updatedAt: '2026-03-31T09:00:00Z',
  });
  const createdDetail = createNote('note-9', 'Shipping checklist', {
    parentId: 'folder-a',
    updatedAt: '2026-03-31T09:00:00Z',
    content: '<p>Ready to ship</p>',
  });

  const result = workspaceWritePathModule.planCreatedNoteState({
    notes: [createSummary('note-1', 'Existing note', { updatedAt: '2026-03-30T12:00:00Z' })],
    trashedNotes: [createSummary('note-9', 'Stale trash copy', { deletedAt: '2026-03-29T18:00:00Z' })],
    expandedFolderIds: ['folder-root'],
    createdSummary,
    createdDetail,
  });

  assert.equal(result.activeNoteId, 'note-9');
  assert.equal(result.activeNote.content, '<p>Ready to ship</p>');
  assert.equal(result.activeView, 'all');
  assert.equal(result.selectedFolderId, 'folder-a');
  assert.deepEqual(result.expandedFolderIds, ['folder-root', 'folder-a']);
  assert.deepEqual(result.trashedNotes, []);
  assert.deepEqual(
    result.notes.map((note) => note.id),
    ['note-9', 'note-1'],
  );
});

test('create folder plan appends the created folder and expands the parent branch', () => {
  const result = workspaceWritePathModule.planCreatedFolderState({
    folders: [
      createFolder('folder-b', 'Roadmap'),
      createFolder('folder-a', 'Archive'),
    ],
    expandedFolderIds: ['folder-root'],
    createdFolder: createFolder('folder-c', 'Specs', { parentId: 'folder-b' }),
  });

  assert.deepEqual(
    result.folders.map((folder) => folder.name),
    ['Archive', 'Roadmap', 'Specs'],
  );
  assert.deepEqual(result.expandedFolderIds, ['folder-root', 'folder-b']);
});

test('write coordinator create folder state persists the folder and returns the folder create plan', async () => {
  const createFolderCalls = [];
  const coordinator = workspaceWritePathModule.createNotesWorkspaceWriteCoordinator({
    saveNote: async () => ({
      success: false,
      message: 'not used',
    }),
    findNoteDetail: async () => ({
      success: false,
      data: null,
    }),
    createFolder: async (name, parentId) => {
      createFolderCalls.push({ name, parentId });
      return {
        success: true,
        data: createFolder('folder-c', name, { parentId }),
      };
    },
  });

  const result = await coordinator.createFolderState({
    folders: [
      createFolder('folder-b', 'Roadmap'),
      createFolder('folder-a', 'Archive'),
    ],
    expandedFolderIds: ['folder-root'],
    name: 'Specs',
    parentId: 'folder-b',
  });

  assert.deepEqual(createFolderCalls, [
    {
      name: 'Specs',
      parentId: 'folder-b',
    },
  ]);
  assert.equal(result.status, 'apply');
  assert.equal(result.createdFolderId, 'folder-c');
  assert.deepEqual(
    result.folders.map((folder) => folder.name),
    ['Archive', 'Roadmap', 'Specs'],
  );
  assert.deepEqual(result.expandedFolderIds, ['folder-root', 'folder-b']);
});

test('rename folder plan rewires descendants, note parents, selection, and expansion state', () => {
  const result = workspaceWritePathModule.planRenamedFolderState({
    folders: [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Specs', { parentId: 'folder-a' }),
    ],
    notes: [createSummary('note-1', 'Project brief', { parentId: 'folder-a' })],
    trashedNotes: [createSummary('note-2', 'Archived brief', { parentId: 'folder-a', deletedAt: '2026-03-29T09:00:00Z' })],
    activeNote: createNote('note-1', 'Project brief', { parentId: 'folder-a' }),
    expandedFolderIds: ['folder-a'],
    selectedFolderId: 'folder-a',
    folderId: 'folder-a',
    resolvedFolderId: 'folder-z',
    requestedName: 'Roadmaps',
  });

  assert.equal(result.status, 'apply');
  assert.equal(result.selectedFolderId, 'folder-z');
  assert.deepEqual(result.expandedFolderIds, ['folder-z']);
  assert.deepEqual(
    result.folders.map((folder) => ({ id: folder.id, parentId: folder.parentId, name: folder.name })),
    [
      { id: 'folder-z', parentId: null, name: 'Roadmaps' },
      { id: 'folder-b', parentId: 'folder-z', name: 'Specs' },
    ],
  );
  assert.equal(result.notes[0].parentId, 'folder-z');
  assert.equal(result.trashedNotes[0].parentId, 'folder-z');
  assert.equal(result.activeNote?.parentId, 'folder-z');
});

test('write coordinator rename folder state persists the rename and returns the rename plan', async () => {
  const renameFolderCalls = [];
  const coordinator = workspaceWritePathModule.createNotesWorkspaceWriteCoordinator({
    saveNote: async () => ({
      success: false,
      message: 'not used',
    }),
    findNoteDetail: async () => ({
      success: false,
      data: null,
    }),
    createFolder: async () => ({
      success: false,
      message: 'not used',
    }),
    renameFolder: async (folderId, newName) => {
      renameFolderCalls.push({ folderId, newName });
      return {
        success: true,
        data: 'folder-z',
      };
    },
  });

  const result = await coordinator.renameFolderState({
    folders: [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Specs', { parentId: 'folder-a' }),
    ],
    notes: [createSummary('note-1', 'Project brief', { parentId: 'folder-a' })],
    trashedNotes: [
      createSummary('note-2', 'Archived brief', {
        parentId: 'folder-a',
        deletedAt: '2026-03-29T09:00:00Z',
      }),
    ],
    activeNote: createNote('note-1', 'Project brief', { parentId: 'folder-a' }),
    expandedFolderIds: ['folder-a'],
    selectedFolderId: 'folder-a',
    folderId: 'folder-a',
    requestedName: 'Roadmaps',
  });

  assert.deepEqual(renameFolderCalls, [
    {
      folderId: 'folder-a',
      newName: 'Roadmaps',
    },
  ]);
  assert.equal(result.status, 'apply');
  assert.equal(result.resolvedFolderId, 'folder-z');
  assert.equal(result.selectedFolderId, 'folder-z');
  assert.deepEqual(result.expandedFolderIds, ['folder-z']);
  assert.deepEqual(
    result.folders.map((folder) => ({ id: folder.id, parentId: folder.parentId, name: folder.name })),
    [
      { id: 'folder-z', parentId: null, name: 'Roadmaps' },
      { id: 'folder-b', parentId: 'folder-z', name: 'Specs' },
    ],
  );
  assert.equal(result.notes[0].parentId, 'folder-z');
  assert.equal(result.trashedNotes[0].parentId, 'folder-z');
  assert.equal(result.activeNote?.parentId, 'folder-z');
});

test('move note plan updates the note parent, keeps the active detail in sync, and expands the target parent', () => {
  const result = workspaceWritePathModule.planMovedNoteState({
    notes: [createSummary('note-1', 'Project brief', { parentId: null })],
    activeNote: createNote('note-1', 'Project brief', { parentId: null }),
    expandedFolderIds: ['folder-root'],
    noteId: 'note-1',
    requestedParentId: 'folder-b',
    updatedAt: '2026-03-31T10:30:00Z',
  });

  assert.equal(result.status, 'apply');
  assert.equal(result.nextParentId, 'folder-b');
  assert.equal(result.notes[0].parentId, 'folder-b');
  assert.equal(result.notes[0].updatedAt, '2026-03-31T10:30:00Z');
  assert.equal(result.activeNote?.parentId, 'folder-b');
  assert.deepEqual(result.expandedFolderIds, ['folder-root', 'folder-b']);
});

test('write coordinator move note state persists the move and returns the move plan', async () => {
  const moveNoteCalls = [];
  const coordinator = workspaceWritePathModule.createNotesWorkspaceWriteCoordinator({
    saveNote: async () => ({
      success: false,
      message: 'not used',
    }),
    findNoteDetail: async () => ({
      success: false,
      data: null,
    }),
    createFolder: async () => ({
      success: false,
      message: 'not used',
    }),
    renameFolder: async () => ({
      success: false,
      message: 'not used',
    }),
    moveNote: async (note, newParentId) => {
      moveNoteCalls.push({ noteId: note.id, newParentId });
      return {
        success: true,
        data: undefined,
      };
    },
  });

  const result = await coordinator.moveNoteState({
    notes: [createSummary('note-1', 'Project brief', { parentId: null })],
    activeNote: createNote('note-1', 'Project brief', { parentId: null }),
    expandedFolderIds: ['folder-root'],
    note: createSummary('note-1', 'Project brief', { parentId: null }),
    requestedParentId: 'folder-b',
    updatedAt: '2026-03-31T10:30:00Z',
  });

  assert.deepEqual(moveNoteCalls, [
    {
      noteId: 'note-1',
      newParentId: 'folder-b',
    },
  ]);
  assert.equal(result.status, 'apply');
  assert.equal(result.nextParentId, 'folder-b');
  assert.equal(result.notes[0].parentId, 'folder-b');
  assert.equal(result.notes[0].updatedAt, '2026-03-31T10:30:00Z');
  assert.equal(result.activeNote?.parentId, 'folder-b');
  assert.deepEqual(result.expandedFolderIds, ['folder-root', 'folder-b']);
});

test('write coordinator create note state persists the note, loads detail, and returns the create plan', async () => {
  const saveCalls = [];
  const detailCalls = [];
  const createdSummary = createSummary('note-9', 'Shipping checklist', {
    parentId: 'folder-a',
    type: 'article',
    updatedAt: '2026-03-31T09:00:00Z',
  });
  const createdDetail = createNote('note-9', 'Shipping checklist', {
    parentId: 'folder-a',
    type: 'article',
    updatedAt: '2026-03-31T09:00:00Z',
    content: '<p>Ready to ship</p>',
  });

  const coordinator = workspaceWritePathModule.createNotesWorkspaceWriteCoordinator({
    saveNote: async (payload) => {
      saveCalls.push(payload);
      return {
        success: true,
        data: createdSummary,
      };
    },
    findNoteDetail: async (noteId) => {
      detailCalls.push(noteId);
      return {
        success: true,
        data: createdDetail,
      };
    },
  });

  const result = await coordinator.createNoteState({
    notes: [createSummary('note-1', 'Existing note', { updatedAt: '2026-03-30T12:00:00Z' })],
    trashedNotes: [
      createSummary('note-9', 'Stale trash copy', {
        deletedAt: '2026-03-29T18:00:00Z',
      }),
    ],
    expandedFolderIds: ['folder-root'],
    input: {
      title: 'Shipping checklist',
      type: 'article',
      parentId: 'folder-a',
      content: '<p>Ready to ship</p>',
      tags: ['release'],
      isFavorite: false,
    },
  });

  assert.deepEqual(saveCalls, [
    {
      title: 'Shipping checklist',
      type: 'article',
      parentId: 'folder-a',
      content: '<p>Ready to ship</p>',
      tags: ['release'],
      isFavorite: false,
    },
  ]);
  assert.deepEqual(detailCalls, ['note-9']);
  assert.equal(result.status, 'apply');
  assert.equal(result.createdNoteId, 'note-9');
  assert.equal(result.activeNoteId, 'note-9');
  assert.equal(result.activeNote.content, '<p>Ready to ship</p>');
  assert.equal(result.selectedFolderId, 'folder-a');
  assert.deepEqual(result.expandedFolderIds, ['folder-root', 'folder-a']);
  assert.deepEqual(
    result.notes.map((note) => note.id),
    ['note-9', 'note-1'],
  );
  assert.deepEqual(result.trashedNotes, []);
});
