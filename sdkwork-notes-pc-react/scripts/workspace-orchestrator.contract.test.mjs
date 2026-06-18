import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function transpileTypeScriptModule(relativePath) {
  const entryPoint = path.resolve(
    process.cwd(),
    relativePath,
  );
  const source = await readFile(entryPoint, 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  });
}

async function loadWorkspaceOrchestratorModule() {
  const workspaceTypesModuleUrl = createDataModuleUrl(
    (await transpileTypeScriptModule('packages/sdkwork-notes-pc-notes/src/types/notesWorkspace.ts')).outputText,
  );
  const orchestratorSource = (
    await transpileTypeScriptModule('packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceOrchestrator.ts')
  ).outputText.replace(
    "../types/notesWorkspace",
    workspaceTypesModuleUrl,
  );

  return import(createDataModuleUrl(orchestratorSource));
}

const workspaceOrchestratorModule = await loadWorkspaceOrchestratorModule();

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

test('workspace orchestrator sorts snapshot data and keeps the current active note when it still exists', async () => {
  const workspaceService = {
    queryWorkspaceSnapshot: async () =>
      ok({
        notes: [
          createSummary('note-2', 'Beta', { updatedAt: '2026-03-29T12:00:00Z' }),
          createSummary('note-1', 'Alpha', { updatedAt: '2026-03-30T12:00:00Z' }),
        ],
        trashedNotes: [
          createSummary('trash-2', 'Trash B', {
            deletedAt: '2026-03-30T15:00:00Z',
            updatedAt: '2026-03-30T15:00:00Z',
          }),
          createSummary('trash-1', 'Trash A', {
            deletedAt: '2026-03-30T18:00:00Z',
            updatedAt: '2026-03-30T18:00:00Z',
          }),
        ],
        folders: [
          createFolder('folder-b', 'Roadmap'),
          createFolder('folder-a', 'Architecture'),
        ],
      }),
    findById: async (id) => ok(id === 'note-2' ? createNote('note-2', 'Beta') : createNote('note-1', 'Alpha')),
  };

  const orchestrator = workspaceOrchestratorModule.createNoteWorkspaceOrchestrator(workspaceService);
  const result = await orchestrator.initializeWorkspace({ currentActiveNoteId: 'note-2' });

  assert.equal(result.success, true);
  assert.deepEqual(result.data.notes.map((note) => note.id), ['note-1', 'note-2']);
  assert.deepEqual(result.data.trashedNotes.map((note) => note.id), ['trash-1', 'trash-2']);
  assert.deepEqual(result.data.folders.map((folder) => folder.id), ['folder-a', 'folder-b']);
  assert.equal(result.data.activeNoteId, 'note-2');
  assert.equal(result.data.activeNote?.id, 'note-2');
});

test('workspace orchestrator selects the newest note when the current active note is no longer present', async () => {
  const workspaceService = {
    queryWorkspaceSnapshot: async () =>
      ok({
        notes: [
          createSummary('note-1', 'Alpha', { updatedAt: '2026-03-30T12:00:00Z' }),
          createSummary('note-2', 'Beta', { updatedAt: '2026-03-29T12:00:00Z' }),
        ],
        trashedNotes: [],
        folders: [],
      }),
    findById: async (id) => ok(id === 'note-1' ? createNote('note-1', 'Alpha') : createNote('note-2', 'Beta')),
  };

  const orchestrator = workspaceOrchestratorModule.createNoteWorkspaceOrchestrator(workspaceService);
  const result = await orchestrator.initializeWorkspace({ currentActiveNoteId: 'missing-note' });

  assert.equal(result.success, true);
  assert.equal(result.data.activeNoteId, 'note-1');
  assert.equal(result.data.activeNote?.id, 'note-1');
});

test('workspace orchestrator resolves refresh fallback from the current trash view list source', async () => {
  const trashedLatest = createSummary('trash-2', 'Deleted latest', {
    deletedAt: '2026-03-30T20:00:00Z',
    updatedAt: '2026-03-30T20:00:00Z',
  });
  const workspaceService = {
    queryWorkspaceSnapshot: async () =>
      ok({
        notes: [
          createSummary('note-1', 'Alpha', { updatedAt: '2026-03-30T12:00:00Z' }),
        ],
        trashedNotes: [
          createSummary('trash-1', 'Deleted earlier', {
            deletedAt: '2026-03-30T18:00:00Z',
            updatedAt: '2026-03-30T18:00:00Z',
          }),
          trashedLatest,
        ],
        folders: [],
      }),
    findById: async (id) => ok(id === 'note-1' ? createNote('note-1', 'Alpha') : null),
  };

  const orchestrator = workspaceOrchestratorModule.createNoteWorkspaceOrchestrator(workspaceService);
  const result = await orchestrator.initializeWorkspace({
    currentActiveView: 'trash',
    currentActiveNoteId: 'missing-trash-note',
  });

  assert.equal(result.success, true);
  assert.equal(result.data.activeNoteId, 'trash-2');
  assert.deepEqual(result.data.activeNote, {
    ...trashedLatest,
    content: trashedLatest.snippet,
  });
});

test('workspace orchestrator preserves folder selection only when the folder remains valid for the current view', async () => {
  const workspaceService = {
    queryWorkspaceSnapshot: async () =>
      ok({
        notes: [
          createSummary('note-1', 'Alpha', {
            parentId: 'folder-a',
            updatedAt: '2026-03-30T12:00:00Z',
          }),
        ],
        trashedNotes: [],
        folders: [
          createFolder('folder-a', 'Projects'),
        ],
      }),
    findById: async (id) => ok(id === 'note-1' ? createNote('note-1', 'Alpha', { parentId: 'folder-a' }) : null),
  };

  const orchestrator = workspaceOrchestratorModule.createNoteWorkspaceOrchestrator(workspaceService);
  const keptResult = await orchestrator.initializeWorkspace({
    currentActiveView: 'all',
    currentSelectedFolderId: 'folder-a',
  });
  const missingResult = await orchestrator.initializeWorkspace({
    currentActiveView: 'all',
    currentSelectedFolderId: 'missing-folder',
  });
  const trashResult = await orchestrator.initializeWorkspace({
    currentActiveView: 'trash',
    currentSelectedFolderId: 'folder-a',
  });

  assert.equal(keptResult.success, true);
  assert.equal(keptResult.data.selectedFolderId, 'folder-a');
  assert.equal(missingResult.success, true);
  assert.equal(missingResult.data.selectedFolderId, null);
  assert.equal(trashResult.success, true);
  assert.equal(trashResult.data.selectedFolderId, null);
});

test('workspace orchestrator falls back to trashed summaries when note detail is unavailable', async () => {
  const trashedSummary = createSummary('trash-1', 'Deleted note', {
    deletedAt: '2026-03-30T18:00:00Z',
  });
  const workspaceService = {
    queryWorkspaceSnapshot: async () =>
      ok({
        notes: [],
        trashedNotes: [trashedSummary],
        folders: [],
      }),
    findById: async () => ok(null),
  };

  const orchestrator = workspaceOrchestratorModule.createNoteWorkspaceOrchestrator(workspaceService);
  const result = await orchestrator.loadWorkspaceNote('trash-1', {
    trashedNotes: [trashedSummary],
  });

  assert.equal(result.success, true);
  assert.equal(result.data.activeNoteId, 'trash-1');
  assert.deepEqual(result.data.activeNote, {
    ...trashedSummary,
    content: trashedSummary.snippet,
  });
});
