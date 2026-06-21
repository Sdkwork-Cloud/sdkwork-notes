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

const notesLocalSourcePath = 'packages/sdkwork-notes-pc-local/src/index.ts';
const notesLocalModule = await loadTsModule(notesLocalSourcePath);
const notesLocalSource = await readFile(
  path.resolve(workspaceRoot, notesLocalSourcePath),
  'utf8',
);

test('notes local package exports a standardized workspace snapshot reader boundary for downstream consumers', async () => {
  assert.match(notesLocalSource, /export interface NotesLocalWorkspaceSnapshotReader \{/);
  assert.match(
    notesLocalSource,
    /readWorkspaceSnapshot\(\): Promise<NotesLocalWorkspaceSnapshot>;/,
  );
  assert.match(
    notesLocalSource,
    /export const notesLocalWorkspaceSnapshotReader = createNotesLocalWorkspaceSnapshotReader\(\);/,
  );
  assert.equal(typeof notesLocalModule.createEmptyNotesLocalWorkspaceSnapshot, 'function');
  assert.equal(typeof notesLocalModule.resolveNotesLocalWorkspaceSnapshot, 'function');
  assert.equal(typeof notesLocalModule.createNotesLocalWorkspaceSnapshotReader, 'function');

  const standardizedEmptySnapshot = notesLocalModule.createEmptyNotesLocalWorkspaceSnapshot();
  assert.deepEqual(standardizedEmptySnapshot, {
    notes: [],
    folders: [],
    drafts: [],
  });

  const reader = notesLocalModule.createNotesLocalWorkspaceSnapshotReader({
    async loadWorkspace() {
      return {
        version: notesLocalModule.NOTES_LOCAL_WORKSPACE_SCHEMA_VERSION,
        workspace: {
          notes: [
            {
              id: 'note-snapshot',
              updatedAt: '2026-04-13T13:00:00.000Z',
              ignored: 'value',
            },
          ],
          folders: [
            {
              id: 'folder-snapshot',
              updatedAt: '2026-04-13T12:55:00.000Z',
            },
          ],
          drafts: [
            {
              noteId: 'note-snapshot',
              capturedAt: '2026-04-13T13:05:00.000Z',
              revision: 9,
              trigger: 'visibility-hidden',
              saveState: 'saving',
              draft: {
                title: 'Snapshot Draft',
                content: '<p>snapshot</p>',
                type: 'code',
                parentId: 'folder-snapshot',
                tags: ['snapshot'],
                isFavorite: true,
                publishStatus: 'draft',
              },
            },
          ],
        },
      };
    },
  });

  assert.deepEqual(Object.keys(reader), ['readWorkspaceSnapshot']);
  assert.deepEqual(await reader.readWorkspaceSnapshot(), {
    notes: [
      {
        id: 'note-snapshot',
        updatedAt: '2026-04-13T13:00:00.000Z',
      },
    ],
    folders: [
      {
        id: 'folder-snapshot',
        updatedAt: '2026-04-13T12:55:00.000Z',
      },
    ],
    drafts: [
      {
        noteId: 'note-snapshot',
        capturedAt: '2026-04-13T13:05:00.000Z',
        revision: 9,
        trigger: 'visibility-hidden',
        saveState: 'saving',
        draft: {
          title: 'Snapshot Draft',
          content: '<p>snapshot</p>',
          type: 'code',
          parentId: 'folder-snapshot',
          tags: ['snapshot'],
          isFavorite: true,
          publishStatus: 'draft',
        },
      },
    ],
  });
});

test('standardized workspace snapshot reader resolves legacy inputs and degrades unsupported or failed loaders to an empty snapshot', async () => {
  const standardizedEmptySnapshot = notesLocalModule.createEmptyNotesLocalWorkspaceSnapshot();

  assert.deepEqual(
    notesLocalModule.resolveNotesLocalWorkspaceSnapshot(
      JSON.stringify({
        notes: [
          {
            id: 'note-legacy',
            updatedAt: '2026-04-13T14:00:00.000Z',
          },
        ],
        folders: 'invalid',
        drafts: [],
      }),
    ),
    {
      notes: [
        {
          id: 'note-legacy',
          updatedAt: '2026-04-13T14:00:00.000Z',
        },
      ],
      folders: [],
      drafts: [],
    },
  );

  assert.deepEqual(
    notesLocalModule.resolveNotesLocalWorkspaceSnapshot({
      version: 99,
      workspace: {
        notes: [
          {
            id: 'note-unsupported',
            updatedAt: '2026-04-13T14:05:00.000Z',
          },
        ],
      },
    }),
    standardizedEmptySnapshot,
  );

  const failingReader = notesLocalModule.createNotesLocalWorkspaceSnapshotReader({
    async loadWorkspace() {
      throw new Error('storage unavailable');
    },
  });

  assert.deepEqual(
    await failingReader.readWorkspaceSnapshot(),
    standardizedEmptySnapshot,
  );
});
