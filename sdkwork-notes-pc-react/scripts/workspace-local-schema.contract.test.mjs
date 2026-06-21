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

function createMemoryStorage() {
  const records = new Map();

  return {
    getItem(key) {
      return records.has(key) ? records.get(key) : null;
    },
    setItem(key, value) {
      records.set(key, value);
    },
    removeItem(key) {
      records.delete(key);
    },
  };
}

const notesLocalModule = await loadTsModule('packages/sdkwork-notes-pc-local/src/index.ts');
const storageKey = 'sdkwork-notes-test-local-workspace-schema';

test('browser local store migrates legacy workspace snapshots and rewrites them with an explicit schema envelope', async () => {
  const storage = createMemoryStorage();
  storage.setItem(
    storageKey,
    JSON.stringify({
      notes: [
        {
          id: 'note-legacy',
          updatedAt: '2026-04-13T11:00:00.000Z',
        },
      ],
      folders: [
        {
          id: 'folder-legacy',
          updatedAt: '2026-04-13T10:30:00.000Z',
        },
      ],
      drafts: [
        {
          noteId: 'note-legacy',
          capturedAt: '2026-04-13T11:05:00.000Z',
          revision: 3,
          trigger: 'pagehide',
          saveState: 'retrying',
          draft: {
            title: 'Legacy Draft',
            content: '<p>legacy</p>',
            type: 'article',
            parentId: 'folder-legacy',
            tags: ['legacy'],
            isFavorite: true,
            publishStatus: 'archived',
          },
        },
      ],
    }),
  );

  const localStore = notesLocalModule.createBrowserNotesLocalStore({
    storage,
    storageKey,
  });

  const loadedWorkspace = await localStore.loadWorkspace();
  assert.equal(notesLocalModule.NOTES_LOCAL_WORKSPACE_SCHEMA_VERSION, 1);
  assert.deepEqual(loadedWorkspace, {
    notes: [
      {
        id: 'note-legacy',
        updatedAt: '2026-04-13T11:00:00.000Z',
      },
    ],
    folders: [
      {
        id: 'folder-legacy',
        updatedAt: '2026-04-13T10:30:00.000Z',
      },
    ],
    drafts: [
      {
        noteId: 'note-legacy',
        capturedAt: '2026-04-13T11:05:00.000Z',
        revision: 3,
        trigger: 'pagehide',
        saveState: 'retrying',
        draft: {
          title: 'Legacy Draft',
          content: '<p>legacy</p>',
          type: 'article',
          parentId: 'folder-legacy',
          tags: ['legacy'],
          isFavorite: true,
          publishStatus: 'archived',
        },
      },
    ],
  });

  await localStore.saveDraft({
    noteId: 'note-legacy',
    capturedAt: '2026-04-13T11:06:00.000Z',
    revision: 4,
    trigger: 'draft-change',
    saveState: 'dirty',
    draft: {
      title: 'Migrated Draft',
      content: '<p>migrated</p>',
      type: 'doc',
      parentId: 'folder-legacy',
      tags: ['legacy', 'migrated'],
      isFavorite: false,
      publishStatus: 'draft',
    },
  });

  assert.deepEqual(JSON.parse(storage.getItem(storageKey)), {
    version: 1,
    workspace: {
      notes: [
        {
          id: 'note-legacy',
          updatedAt: '2026-04-13T11:00:00.000Z',
        },
      ],
      folders: [
        {
          id: 'folder-legacy',
          updatedAt: '2026-04-13T10:30:00.000Z',
        },
      ],
      drafts: [
        {
          noteId: 'note-legacy',
          capturedAt: '2026-04-13T11:06:00.000Z',
          revision: 4,
          trigger: 'draft-change',
          saveState: 'dirty',
          draft: {
            title: 'Migrated Draft',
            content: '<p>migrated</p>',
            type: 'doc',
            parentId: 'folder-legacy',
            tags: ['legacy', 'migrated'],
            isFavorite: false,
            publishStatus: 'draft',
          },
        },
      ],
    },
  });
});

test('browser local store reads the current schema envelope and safely ignores unknown versions or corrupted payloads', async () => {
  const storage = createMemoryStorage();
  const localStore = notesLocalModule.createBrowserNotesLocalStore({
    storage,
    storageKey,
  });

  storage.setItem(
    storageKey,
    JSON.stringify({
      version: 1,
      workspace: {
        notes: [
          {
            id: 'note-envelope',
            updatedAt: '2026-04-13T12:00:00.000Z',
          },
        ],
        folders: [],
        drafts: [
          {
            noteId: 'note-envelope',
            capturedAt: '2026-04-13T12:05:00.000Z',
            revision: 8,
            trigger: 'visibility-hidden',
            saveState: 'error',
            draft: {
              title: 'Envelope Draft',
              content: '<p>envelope</p>',
              type: 'code',
              parentId: null,
              tags: ['env'],
              isFavorite: false,
              publishStatus: 'draft',
            },
          },
        ],
      },
    }),
  );

  assert.deepEqual(await localStore.loadWorkspace(), {
    notes: [
      {
        id: 'note-envelope',
        updatedAt: '2026-04-13T12:00:00.000Z',
      },
    ],
    folders: [],
    drafts: [
      {
        noteId: 'note-envelope',
        capturedAt: '2026-04-13T12:05:00.000Z',
        revision: 8,
        trigger: 'visibility-hidden',
        saveState: 'error',
        draft: {
          title: 'Envelope Draft',
          content: '<p>envelope</p>',
          type: 'code',
          parentId: null,
          tags: ['env'],
          isFavorite: false,
          publishStatus: 'draft',
        },
      },
    ],
  });

  storage.setItem(
    storageKey,
    JSON.stringify({
      version: 99,
      workspace: {
        notes: [{ id: 'note-ignored', updatedAt: '2026-04-13T12:10:00.000Z' }],
        folders: [],
        drafts: [],
      },
    }),
  );
  assert.deepEqual(await localStore.loadWorkspace(), {
    notes: [],
    folders: [],
    drafts: [],
  });

  storage.setItem(storageKey, '{"version":1,"workspace":');
  assert.deepEqual(await localStore.loadWorkspace(), {
    notes: [],
    folders: [],
    drafts: [],
  });
});
