import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { applyContractModuleStubs } from './contract-transpile-helpers.mjs';

const workspaceRoot = process.cwd();

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
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

const recoveryModule = await loadTsModule(
  'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceRecovery.ts',
);

test('local recovery service exposes only drafts that still belong to live notes in the current workspace', () => {
  const recoveredDrafts = recoveryModule.resolveNotesWorkspaceRecoveredDrafts({
    drafts: [
      {
        noteId: 'note-1',
        capturedAt: '2026-04-13T10:00:00.000Z',
        revision: 200,
        trigger: 'pagehide',
        saveState: 'dirty',
        draft: {
          title: 'Recovered Alpha',
          content: '<p>alpha local draft</p>',
          type: 'doc',
          parentId: null,
          tags: ['alpha'],
          isFavorite: false,
          publishStatus: 'draft',
        },
      },
      {
        noteId: 'note-2',
        capturedAt: '2026-04-13T10:05:00.000Z',
        revision: 210,
        trigger: 'visibility-hidden',
        saveState: 'retrying',
        draft: {
          title: 'Recovered Trash',
          content: '<p>trash local draft</p>',
          type: 'doc',
          parentId: null,
          tags: ['trash'],
          isFavorite: true,
          publishStatus: 'draft',
        },
      },
      {
        noteId: 'note-missing',
        capturedAt: '2026-04-13T10:10:00.000Z',
        revision: 220,
        trigger: 'draft-change',
        saveState: 'error',
        draft: {
          title: 'Recovered Missing',
          content: '<p>missing local draft</p>',
          type: 'doc',
          parentId: null,
          tags: ['missing'],
          isFavorite: false,
          publishStatus: 'draft',
        },
      },
    ],
    notes: [
      {
        id: 'note-1',
        uuid: 'uuid-note-1',
        title: 'Remote Alpha',
        type: 'doc',
        parentId: null,
        tags: [],
        isFavorite: false,
        snippet: 'Remote Alpha',
        createdAt: '2026-04-13T09:00:00.000Z',
        updatedAt: '2026-04-13T09:55:00.000Z',
      },
    ],
    trashedNotes: [
      {
        id: 'note-2',
        uuid: 'uuid-note-2',
        title: 'Remote Trash',
        type: 'doc',
        parentId: null,
        tags: [],
        isFavorite: false,
        snippet: 'Remote Trash',
        createdAt: '2026-04-13T09:00:00.000Z',
        updatedAt: '2026-04-13T09:56:00.000Z',
        deletedAt: '2026-04-13T09:57:00.000Z',
      },
    ],
  });

  assert.equal(recoveredDrafts.length, 1);
  assert.equal(recoveredDrafts[0].noteId, 'note-1');
  assert.equal(recoveredDrafts[0].remoteTitle, 'Remote Alpha');
  assert.equal(recoveredDrafts[0].draft.content, '<p>alpha local draft</p>');
  assert.equal(
    recoveryModule.resolveActiveNotesWorkspaceRecoveredDraft(recoveredDrafts, 'note-1')?.noteId,
    'note-1',
  );
  assert.equal(
    recoveryModule.resolveActiveNotesWorkspaceRecoveredDraft(recoveredDrafts, 'note-2'),
    null,
  );
  assert.deepEqual(
    recoveryModule.removeNotesWorkspaceRecoveredDraft(recoveredDrafts, 'note-1'),
    [],
  );
});

test('restoring a recovered draft replays the local fields back into the active note without replacing identity fields', () => {
  const restoredAt = '2026-04-13T10:30:00.000Z';
  const restoredNote = recoveryModule.restoreNotesWorkspaceRecoveredDraft(
    {
      id: 'note-1',
      uuid: 'uuid-note-1',
      title: 'Remote Alpha',
      content: '<p>remote</p>',
      type: 'doc',
      parentId: null,
      tags: [],
      isFavorite: false,
      snippet: 'Remote Alpha',
      metadata: {
        source: 'remote',
      },
      publishStatus: 'draft',
      createdAt: '2026-04-13T09:00:00.000Z',
      updatedAt: '2026-04-13T09:55:00.000Z',
    },
    {
      noteId: 'note-1',
      remoteTitle: 'Remote Alpha',
      remoteUpdatedAt: '2026-04-13T09:55:00.000Z',
      capturedAt: '2026-04-13T10:00:00.000Z',
      revision: 200,
      trigger: 'pagehide',
      saveState: 'dirty',
      draft: {
        title: 'Recovered Alpha',
        content: '<p>alpha local draft</p>',
        type: 'code',
        parentId: 'folder-2',
        tags: ['alpha', 'local'],
        isFavorite: true,
        publishStatus: 'archived',
      },
    },
    restoredAt,
  );

  assert.equal(restoredNote.id, 'note-1');
  assert.equal(restoredNote.uuid, 'uuid-note-1');
  assert.equal(restoredNote.metadata.source, 'remote');
  assert.equal(restoredNote.title, 'Recovered Alpha');
  assert.equal(restoredNote.content, '<p>alpha local draft</p>');
  assert.equal(restoredNote.type, 'code');
  assert.equal(restoredNote.parentId, 'folder-2');
  assert.deepEqual(restoredNote.tags, ['alpha', 'local']);
  assert.equal(restoredNote.isFavorite, true);
  assert.equal(restoredNote.publishStatus, 'archived');
  assert.equal(restoredNote.updatedAt, restoredAt);
});

test('workspace store and page wire local recovery candidates onto the main editor flow', () => {
  const storeSource = read('packages/sdkwork-notes-pc-notes/src/store/useNotesWorkspaceStore.ts');
  const pageSource = read('packages/sdkwork-notes-pc-notes/src/pages/NotesWorkspacePage.tsx');
  const componentSource = read('packages/sdkwork-notes-pc-notes/src/components/index.ts');

  assert.match(storeSource, /recoveredDrafts: NotesWorkspaceRecoveredDraft\[\];/);
  assert.match(storeSource, /activeRecoveredDraft: NotesWorkspaceRecoveredDraft \| null;/);
  assert.match(storeSource, /restoreRecoveredDraft: \(noteId: string\) => Promise<boolean>;/);
  assert.match(storeSource, /dismissRecoveredDraft: \(noteId: string\) => Promise<boolean>;/);
  assert.match(storeSource, /await localStore\.loadWorkspace\(\)/);
  assert.match(storeSource, /resolveNotesWorkspaceRecoveredDrafts\(/);
  assert.match(storeSource, /resolveActiveNotesWorkspaceRecoveredDraft\(/);
  assert.match(storeSource, /restoreNotesWorkspaceRecoveredDraft\(/);
  assert.match(pageSource, /NotesWorkspaceRecoveryBanner/);
  assert.match(pageSource, /const recoveredDrafts = useNotesWorkspaceStore\(\(state\) => state\.recoveredDrafts\);/);
  assert.match(pageSource, /const activeRecoveredDraft = useNotesWorkspaceStore\(\(state\) => state\.activeRecoveredDraft\);/);
  assert.match(pageSource, /const restoreRecoveredDraft = useNotesWorkspaceStore\(\(state\) => state\.restoreRecoveredDraft\);/);
  assert.match(pageSource, /const dismissRecoveredDraft = useNotesWorkspaceStore\(\(state\) => state\.dismissRecoveredDraft\);/);
  assert.match(componentSource, /export \* from '\.\/NotesWorkspaceRecoveryBanner';/);
});
