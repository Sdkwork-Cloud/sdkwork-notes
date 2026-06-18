import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

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

  return import(createDataModuleUrl(transpiled.outputText));
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
    snippet: `${title} snippet`,
    createdAt: '2026-04-13T08:00:00.000Z',
    updatedAt: '2026-04-13T12:00:00.000Z',
    ...overrides,
  };
}

function createFolder(id, name, overrides = {}) {
  return {
    id,
    uuid: `folder-${id}`,
    name,
    parentId: null,
    createdAt: '2026-04-13T08:00:00.000Z',
    updatedAt: '2026-04-13T12:00:00.000Z',
    ...overrides,
  };
}

const notesSearchSourcePath = 'packages/sdkwork-notes-pc-search/src/index.ts';
const notesSearchModule = await loadTsModule(notesSearchSourcePath);
const notesSearchSource = await readFile(
  path.resolve(workspaceRoot, notesSearchSourcePath),
  'utf8',
);

test('notes search package freezes a shared index document and query/result contract for workspace search and command palette', () => {
  assert.match(notesSearchSource, /export type NotesSearchNoteType =/);
  assert.match(notesSearchSource, /export interface NotesSearchDocumentFolder \{/);
  assert.match(notesSearchSource, /export interface NotesSearchDocument \{/);
  assert.match(notesSearchSource, /kind: 'note';/);
  assert.match(notesSearchSource, /noteId: string;/);
  assert.match(notesSearchSource, /body: string;/);
  assert.match(notesSearchSource, /snippet: string;/);
  assert.match(notesSearchSource, /folder: NotesSearchDocumentFolder;/);
  assert.match(notesSearchSource, /updatedAt: string;/);
  assert.match(notesSearchSource, /type: NotesSearchNoteType;/);
  assert.match(notesSearchSource, /isFavorite: boolean;/);
  assert.match(notesSearchSource, /isTrashed: boolean;/);
  assert.match(notesSearchSource, /hasLocalDraft: boolean;/);
  assert.match(notesSearchSource, /draftCapturedAt: string \| null;/);
  assert.match(notesSearchSource, /export interface NotesSearchQuery \{/);
  assert.match(notesSearchSource, /text: string;/);
  assert.match(notesSearchSource, /folderId: string \| null;/);
  assert.match(notesSearchSource, /includeTrashed: boolean;/);
  assert.match(notesSearchSource, /export interface NotesSearchResult \{/);
  assert.match(notesSearchSource, /document: NotesSearchDocument;/);
  assert.match(notesSearchSource, /source: 'workspace-search' \| 'command-palette';/);
  assert.match(notesSearchSource, /export function normalizeNotesSearchQuery\(/);
  assert.match(notesSearchSource, /export function buildNotesSearchDocuments\(/);
  assert.match(notesSearchSource, /export function createNotesSearchResult\(/);

  assert.equal(notesSearchModule.NOTES_SEARCH_PACKAGE, '@sdkwork/notes-pc-search');
  assert.equal(notesSearchModule.NOTES_SEARCH_QUERY_LIMIT_DEFAULT, 20);
  assert.equal(typeof notesSearchModule.normalizeNotesSearchQuery, 'function');
  assert.equal(typeof notesSearchModule.buildNotesSearchDocuments, 'function');
  assert.equal(typeof notesSearchModule.createNotesSearchResult, 'function');

  assert.deepEqual(
    notesSearchModule.normalizeNotesSearchQuery({
      text: '  recovery plan  ',
      tags: [' backend ', '', 'backend', 'Recovery '],
      folderId: '  folder-child ',
      limit: 0,
      includeTrashed: 1,
    }),
    {
      text: 'recovery plan',
      tags: ['backend', 'recovery'],
      folderId: 'folder-child',
      limit: 20,
      includeTrashed: true,
    },
  );

  const documents = notesSearchModule.buildNotesSearchDocuments({
    workspaceSnapshot: {
      notes: [
        createSummary('note-1', 'API recovery summary', {
          type: 'article',
          parentId: 'folder-child',
          tags: ['summary'],
          snippet: 'Summary fallback preview',
          updatedAt: '2026-04-13T12:15:00.000Z',
        }),
      ],
      trashedNotes: [
        createSummary('trash-1', 'Deleted API draft', {
          type: 'doc',
          parentId: 'folder-root',
          tags: ['trash'],
          snippet: 'Deleted preview',
          updatedAt: '2026-04-13T11:00:00.000Z',
          deletedAt: '2026-04-13T11:30:00.000Z',
        }),
      ],
      folders: [
        createFolder('folder-root', 'Projects'),
        createFolder('folder-child', 'Backend', {
          parentId: 'folder-root',
        }),
      ],
    },
    localSnapshot: {
      notes: [
        {
          id: 'note-1',
          updatedAt: '2026-04-13T13:05:00.000Z',
        },
      ],
      folders: [
        {
          id: 'folder-child',
          updatedAt: '2026-04-13T13:00:00.000Z',
        },
      ],
      drafts: [
        {
          noteId: 'note-1',
          capturedAt: '2026-04-13T13:05:00.000Z',
          revision: 7,
          trigger: 'draft-change',
          saveState: 'dirty',
          draft: {
            title: 'API recovery draft',
            content: '<p>Latest <strong>recovery</strong> body</p><h1>Retry budget</h1>',
            type: 'code',
            parentId: 'folder-child',
            tags: ['recovery', 'backend'],
            isFavorite: true,
            publishStatus: 'draft',
          },
        },
      ],
    },
  });

  assert.equal(documents.length, 2);

  const recoveryDocument = documents.find((document) => document.noteId === 'note-1');
  const deletedDocument = documents.find((document) => document.noteId === 'trash-1');

  assert.deepEqual(recoveryDocument, {
    id: 'note:note-1',
    kind: 'note',
    noteId: 'note-1',
    title: 'API recovery draft',
    body: 'Latest recovery body Retry budget',
    snippet: 'Latest recovery body Retry budget',
    tags: ['recovery', 'backend'],
    folder: {
      id: 'folder-child',
      name: 'Backend',
      path: ['Projects', 'Backend'],
    },
    updatedAt: '2026-04-13T13:05:00.000Z',
    type: 'code',
    isFavorite: true,
    isTrashed: false,
    hasLocalDraft: true,
    draftCapturedAt: '2026-04-13T13:05:00.000Z',
  });

  assert.deepEqual(deletedDocument, {
    id: 'note:trash-1',
    kind: 'note',
    noteId: 'trash-1',
    title: 'Deleted API draft',
    body: 'Deleted preview',
    snippet: 'Deleted preview',
    tags: ['trash'],
    folder: {
      id: 'folder-root',
      name: 'Projects',
      path: ['Projects'],
    },
    updatedAt: '2026-04-13T11:00:00.000Z',
    type: 'doc',
    isFavorite: false,
    isTrashed: true,
    hasLocalDraft: false,
    draftCapturedAt: null,
  });

  assert.deepEqual(
    notesSearchModule.createNotesSearchResult(recoveryDocument),
    {
      document: recoveryDocument,
      score: 1,
      source: 'workspace-search',
    },
  );
  assert.deepEqual(
    notesSearchModule.createNotesSearchResult(recoveryDocument, {
      score: 420,
      source: 'command-palette',
    }),
    {
      document: recoveryDocument,
      score: 420,
      source: 'command-palette',
    },
  );
});
