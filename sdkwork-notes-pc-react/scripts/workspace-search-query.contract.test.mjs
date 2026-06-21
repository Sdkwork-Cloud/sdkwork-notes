import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { applyContractModuleStubs } from './contract-transpile-helpers.mjs';

const workspaceRoot = process.cwd();

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadTsModule(relativePath) {
  const entryPoint = path.resolve(workspaceRoot, relativePath);
  const source = await readFile(entryPoint, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  });

  return import(createDataModuleUrl(applyContractModuleStubs(transpiled.outputText)));
}

function createSearchDocument(noteId, title, overrides = {}) {
  return {
    id: `note:${noteId}`,
    kind: 'note',
    noteId,
    title,
    body: `${title} body`,
    snippet: `${title} snippet`,
    tags: [],
    folder: {
      id: null,
      name: null,
      path: [],
    },
    updatedAt: '2026-04-13T12:00:00.000Z',
    type: 'doc',
    isFavorite: false,
    isTrashed: false,
    hasLocalDraft: false,
    draftCapturedAt: null,
    ...overrides,
  };
}

const notesSearchSourcePath = 'packages/sdkwork-notes-pc-search/src/index.ts';
const notesSearchModule = await loadTsModule(notesSearchSourcePath);
const notesSearchSource = await readFile(
  path.resolve(workspaceRoot, notesSearchSourcePath),
  'utf8',
);

test('notes search package exposes a unified query API with filtering, ranking, and source-aware results', () => {
  assert.match(notesSearchSource, /export function searchNotesSearchDocuments\(/);
  assert.match(notesSearchSource, /export function createInMemoryNotesSearchService\(/);
  assert.equal(typeof notesSearchModule.searchNotesSearchDocuments, 'function');
  assert.equal(typeof notesSearchModule.createInMemoryNotesSearchService, 'function');

  const documents = [
    createSearchDocument('note-1', 'Recovery runbook', {
      body: 'Recovery checklist and rollback plan',
      tags: ['backend', 'ops'],
      folder: {
        id: 'folder-backend',
        name: 'Backend',
        path: ['Projects', 'Backend'],
      },
      updatedAt: '2026-04-13T13:05:00.000Z',
      type: 'code',
      isFavorite: true,
    }),
    createSearchDocument('note-2', 'Backend roadmap', {
      body: 'Recovery milestones and rollout steps',
      tags: ['planning'],
      folder: {
        id: 'folder-backend',
        name: 'Backend',
        path: ['Projects', 'Backend'],
      },
      updatedAt: '2026-04-13T12:30:00.000Z',
    }),
    createSearchDocument('trash-1', 'Archive reference', {
      body: 'Legacy recovery notes and historical fixes',
      tags: ['backend'],
      folder: {
        id: 'folder-archive',
        name: 'Archive',
        path: ['Projects', 'Archive'],
      },
      updatedAt: '2026-04-13T14:00:00.000Z',
      isTrashed: true,
    }),
    createSearchDocument('note-3', 'Projects overview', {
      body: 'General planning and navigation notes',
      tags: ['overview'],
      folder: {
        id: 'folder-projects',
        name: 'Projects',
        path: ['Projects'],
      },
      updatedAt: '2026-04-13T11:00:00.000Z',
    }),
  ];

  const recoveryResults = notesSearchModule.searchNotesSearchDocuments(
    documents,
    {
      text: 'recovery',
      limit: 10,
    },
  );

  assert.deepEqual(
    recoveryResults.map((result) => result.document.noteId),
    ['note-1', 'note-2'],
  );
  assert.equal(recoveryResults[0].source, 'workspace-search');
  assert.ok(recoveryResults[0].score > recoveryResults[1].score);

  const folderAndTagResults = notesSearchModule.searchNotesSearchDocuments(
    documents,
    {
      tags: ['backend'],
      folderId: 'folder-backend',
      includeTrashed: true,
      limit: 10,
    },
    {
      source: 'command-palette',
    },
  );

  assert.deepEqual(
    folderAndTagResults.map((result) => result.document.noteId),
    ['note-1'],
  );
  assert.equal(folderAndTagResults[0].source, 'command-palette');

  const recoveryWithTrash = notesSearchModule.searchNotesSearchDocuments(
    documents,
    {
      text: 'recovery',
      includeTrashed: true,
      limit: 10,
    },
  );

  assert.deepEqual(
    recoveryWithTrash.map((result) => result.document.noteId),
    ['note-1', 'note-2', 'trash-1'],
  );

  const limitedResults = notesSearchModule.searchNotesSearchDocuments(
    documents,
    {
      text: 'recovery',
      limit: 1,
      includeTrashed: true,
    },
  );

  assert.deepEqual(
    limitedResults.map((result) => result.document.noteId),
    ['note-1'],
  );
});

test('in-memory search service rebuilds its document source and delegates to the shared query API', async () => {
  const initialDocuments = [
    createSearchDocument('note-1', 'Recovery runbook', {
      body: 'Recovery checklist and rollback plan',
      tags: ['backend'],
      updatedAt: '2026-04-13T13:05:00.000Z',
    }),
  ];

  const nextDocuments = [
    createSearchDocument('note-3', 'Projects overview', {
      body: 'General planning and navigation notes',
      tags: ['overview'],
      updatedAt: '2026-04-13T11:00:00.000Z',
    }),
  ];

  const service = notesSearchModule.createInMemoryNotesSearchService(initialDocuments);

  assert.deepEqual(
    (await service.search(
      notesSearchModule.normalizeNotesSearchQuery({
        text: 'recovery',
        limit: 5,
      }),
    )).map((result) => result.document.noteId),
    ['note-1'],
  );

  await service.rebuild(nextDocuments);

  assert.deepEqual(
    (await service.search(
      notesSearchModule.normalizeNotesSearchQuery({
        text: 'projects',
        limit: 5,
      }),
    )).map((result) => result.document.noteId),
    ['note-3'],
  );
});
