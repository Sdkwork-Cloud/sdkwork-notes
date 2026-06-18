import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
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

async function loadWorkspaceSelectorModule() {
  const selectorModule = await transpileTypeScriptModule(
    'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceSelectors.ts',
  );
  const notesSearchModuleUrl = createDataModuleUrl(
    (
      await transpileTypeScriptModule('packages/sdkwork-notes-pc-search/src/index.ts')
    ).outputText,
  );
  const moduleSource = selectorModule.outputText
    .replaceAll("'@sdkwork/notes-pc-search'", `'${notesSearchModuleUrl}'`)
    .replaceAll('"@sdkwork/notes-pc-search"', `"${notesSearchModuleUrl}"`);

  return import(createDataModuleUrl(moduleSource));
}

const workspaceSelectorModule = await loadWorkspaceSelectorModule();

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

function createNote(id, title, overrides = {}) {
  return {
    ...createSummary(id, title),
    content: [
      '<h1>Weekly review</h1>',
      '<p>Draft sprint summary and action items.</p>',
      '<ul data-type="taskList">',
      '<li data-type="taskItem" data-checked="true"><p>Publish update</p></li>',
      '<li data-type="taskItem" data-checked="false"><p>Sync metrics</p></li>',
      '</ul>',
      '<h2>Follow-up</h2>',
    ].join(''),
    ...overrides,
  };
}

test('workspace view model selector composes visible notes, counts, and active note insights', () => {
  const activeNote = createNote('note-1', 'Weekly sprint review', {
    parentId: 'folder-a',
    isFavorite: true,
    tags: ['sprint'],
    snippet: 'Sprint summary',
    updatedAt: '2026-03-30T11:30:00Z',
  });

  const result = workspaceSelectorModule.buildNotesWorkspaceViewModel({
    notes: [
      createSummary('note-2', 'Architecture review', {
        parentId: 'folder-a',
        updatedAt: '2026-03-29T12:00:00Z',
      }),
      {
        ...activeNote,
      },
    ],
    trashedNotes: [
      createSummary('trash-1', 'Deleted retrospective', {
        deletedAt: '2026-03-28T10:00:00Z',
      }),
    ],
    folders: [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Archive'),
    ],
    activeView: 'favorites',
    searchQuery: 'sprint',
    selectedFolderId: 'folder-a',
    activeNote,
    locale: 'en-US',
    nowValue: Date.parse('2026-03-30T12:00:00Z'),
    syncTasks: [
      {
        id: 'sync-queued-1',
        entityId: 'note-1',
        status: 'queued',
        at: '2026-03-30T11:40:00Z',
        nextRetryAt: null,
        lastFailure: null,
        lastConflict: null,
      },
      {
        id: 'sync-retrying-1',
        entityId: 'note-1',
        status: 'retrying',
        at: '2026-03-30T11:35:00Z',
        nextRetryAt: '2026-03-30T12:05:00Z',
        lastFailure: {
          code: 'network-error',
          message: 'Temporary connectivity loss',
          retryable: true,
          occurredAt: '2026-03-30T11:50:00Z',
        },
        lastConflict: null,
      },
      {
        id: 'sync-conflict-1',
        entityId: 'note-1',
        status: 'conflict',
        at: '2026-03-30T11:30:00Z',
        nextRetryAt: null,
        lastFailure: null,
        lastConflict: {
          code: 'stale-base-version',
          message: 'Remote note changed before replay',
          occurredAt: '2026-03-30T11:58:00Z',
        },
      },
    ],
  });

  assert.deepEqual(result.visibleNotes.map((note) => note.id), ['note-1']);
  assert.deepEqual(result.counts, {
    all: 2,
    favorites: 1,
    recent: 2,
    trash: 1,
  });
  assert.equal(result.activeNoteFolderName, 'Projects');
  assert.equal(result.activeWordCount, 13);
  assert.deepEqual(result.activeTaskProgress, {
    total: 2,
    completed: 1,
    remaining: 1,
    ratio: 0.5,
  });
  assert.deepEqual(result.activeOutline, [
    { level: 1, text: 'Weekly review', anchor: 'weekly-review' },
    { level: 2, text: 'Follow-up', anchor: 'follow-up' },
  ]);
  assert.equal(result.activeNoteUpdatedLabel, '30 minutes ago');
  assert.deepEqual(result.syncSummary, {
    queueDepth: 3,
    pendingCount: 2,
    blockingCount: 1,
    queuedCount: 1,
    retryingCount: 1,
    failedCount: 0,
    conflictCount: 1,
    completedCount: 0,
    primaryStatus: 'conflict',
    primaryTaskId: 'sync-conflict-1',
    primaryEntityId: 'note-1',
    primaryCode: 'stale-base-version',
    primaryMessage: 'Remote note changed before replay',
    nextRetryLabel: 'in 5 minutes',
  });
});

test('workspace view model search surfaces notes when the query matches the folder path in shared search documents', () => {
  const result = workspaceSelectorModule.buildNotesWorkspaceViewModel({
    notes: [
      createSummary('note-1', 'Weekly sprint review', {
        parentId: 'folder-a',
        tags: ['planning'],
        snippet: 'Delivery checklist',
      }),
      createSummary('note-2', 'Travel checklist', {
        parentId: 'folder-b',
        tags: ['trip'],
        snippet: 'Packing plan',
      }),
    ],
    trashedNotes: [],
    folders: [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Personal'),
    ],
    activeView: 'all',
    searchQuery: 'projects',
    selectedFolderId: null,
    activeNote: null,
    syncTasks: [],
  });

  assert.deepEqual(result.visibleNotes.map((note) => note.id), ['note-1']);
  assert.deepEqual(result.syncSummary, {
    queueDepth: 0,
    pendingCount: 0,
    blockingCount: 0,
    queuedCount: 0,
    retryingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    completedCount: 0,
    primaryStatus: 'idle',
    primaryTaskId: null,
    primaryEntityId: null,
    primaryCode: null,
    primaryMessage: null,
    nextRetryLabel: '',
  });
});
