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
const autosaveRuntimeModule = await loadTsModule(
  'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceAutosaveRuntime.ts',
);
const exitRecoveryModule = await loadTsModule(
  'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceExitRecovery.ts',
);

test('browser local store upserts crash-recovery drafts by note id and clears them after confirmation', async () => {
  const localStore = notesLocalModule.createBrowserNotesLocalStore({
    storage: createMemoryStorage(),
    storageKey: 'sdkwork-notes-test-local-workspace',
  });

  const firstDraft = {
    noteId: 'note-1',
    capturedAt: '2026-04-13T09:00:00.000Z',
    revision: 1,
    trigger: 'draft-change',
    saveState: 'dirty',
    draft: {
      title: 'Alpha',
      content: '<p>draft-one</p>',
      type: 'doc',
      parentId: null,
      tags: ['urgent'],
      isFavorite: false,
      publishStatus: 'draft',
    },
  };

  await localStore.saveDraft(firstDraft);
  assert.deepEqual((await localStore.loadWorkspace()).drafts, [firstDraft]);

  const secondDraft = {
    ...firstDraft,
    capturedAt: '2026-04-13T09:00:01.000Z',
    revision: 2,
    trigger: 'pagehide',
    saveState: 'retrying',
    draft: {
      ...firstDraft.draft,
      content: '<p>draft-two</p>',
      isFavorite: true,
    },
  };

  await localStore.saveDraft(secondDraft);
  assert.deepEqual((await localStore.loadWorkspace()).drafts, [secondDraft]);

  await localStore.clearDraft('note-1');
  assert.deepEqual((await localStore.loadWorkspace()).drafts, []);
});

test('exit recovery service captures only live notes that still need recovery and preserves the trigger reason', async () => {
  const capturedSnapshots = [];
  const localStore = {
    async loadWorkspace() {
      return {
        notes: [],
        folders: [],
        drafts: [],
      };
    },
    async saveDraft(snapshot) {
      capturedSnapshots.push(snapshot);
    },
    async clearDraft() {},
  };

  const activeNote = {
    id: 'note-1',
    uuid: 'note-1',
    title: 'Alpha',
    content: '<p>draft-two</p>',
    type: 'doc',
    parentId: null,
    tags: ['urgent'],
    isFavorite: true,
    snippet: 'Alpha',
    publishStatus: 'draft',
    createdAt: '2026-04-13T08:59:00.000Z',
    updatedAt: '2026-04-13T09:00:01.000Z',
  };

  const captured = await exitRecoveryModule.captureNotesWorkspaceExitRecoverySnapshot(localStore, {
    activeNote,
    saveState: 'retrying',
    trigger: 'visibility-hidden',
  });
  assert.equal(captured, true);
  assert.equal(capturedSnapshots.length, 1);
  assert.equal(capturedSnapshots[0].trigger, 'visibility-hidden');
  assert.equal(capturedSnapshots[0].saveState, 'retrying');
  assert.equal(capturedSnapshots[0].draft.title, 'Alpha');
  assert.equal(capturedSnapshots[0].draft.content, '<p>draft-two</p>');

  const skippedDeleted = await exitRecoveryModule.captureNotesWorkspaceExitRecoverySnapshot(localStore, {
    activeNote: {
      ...activeNote,
      deletedAt: '2026-04-13T09:00:02.000Z',
    },
    saveState: 'dirty',
    trigger: 'pagehide',
  });
  assert.equal(skippedDeleted, false);

  const skippedSaved = await exitRecoveryModule.captureNotesWorkspaceExitRecoverySnapshot(localStore, {
    activeNote,
    saveState: 'saved',
    trigger: 'pagehide',
  });
  assert.equal(skippedSaved, false);
  assert.equal(capturedSnapshots.length, 1);
});

test('autosave runtime captures recovery snapshots before exit flush and the workspace wiring keeps the recovery path on the main save chain', () => {
  const events = [];
  let pageHideHandler = null;
  let visibilityHandler = null;

  const pageHideCleanup = autosaveRuntimeModule.bindNotesWorkspacePageHideAutosave(
    {
      shouldSchedule: true,
      shouldFlushOnPageHide: true,
      delayMs: 700,
    },
    {
      bindPageHide: (handler) => {
        pageHideHandler = handler;
        return () => {
          events.push('cleanup:pagehide');
        };
      },
      captureRecoverySnapshot: () => {
        events.push('capture:pagehide');
      },
      flushDraft: () => {
        events.push('flush:pagehide');
      },
    },
  );

  const visibilityCleanup = autosaveRuntimeModule.bindNotesWorkspaceVisibilityAutosave(
    {
      shouldSchedule: true,
      shouldFlushOnPageHide: true,
      delayMs: 700,
    },
    {
      bindVisibilityChange: (handler) => {
        visibilityHandler = handler;
        return () => {
          events.push('cleanup:visibility');
        };
      },
      isDocumentHidden: () => true,
      captureRecoverySnapshot: () => {
        events.push('capture:visibility');
      },
      flushDraft: () => {
        events.push('flush:visibility');
      },
    },
  );

  pageHideHandler?.();
  visibilityHandler?.();
  pageHideCleanup();
  visibilityCleanup();

  assert.deepEqual(events, [
    'capture:pagehide',
    'flush:pagehide',
    'capture:visibility',
    'flush:visibility',
    'cleanup:pagehide',
    'cleanup:visibility',
  ]);

  const pageSource = read('packages/sdkwork-notes-pc-notes/src/pages/NotesWorkspacePage.tsx');
  const storeSource = read('packages/sdkwork-notes-pc-notes/src/store/useNotesWorkspaceStore.ts');

  assert.match(pageSource, /captureActiveNoteExitRecovery = useNotesWorkspaceStore\(\(state\) => state\.captureActiveNoteExitRecovery\);/);
  assert.match(pageSource, /void captureActiveNoteExitRecovery\('pagehide'\);/);
  assert.match(pageSource, /void captureActiveNoteExitRecovery\('visibility-hidden'\);/);
  assert.match(storeSource, /captureActiveNoteExitRecovery: \(trigger: NotesWorkspaceExitRecoveryTrigger\) => Promise<boolean>;/);
  assert.match(storeSource, /void captureNotesWorkspaceExitRecoverySnapshot\(localStore, \{/);
  assert.match(storeSource, /trigger: 'draft-change',/);
  assert.match(storeSource, /void clearNotesWorkspaceExitRecoverySnapshot\(localStore, requestedActiveNote\.id\);/);
  assert.match(storeSource, /void clearNotesWorkspaceExitRecoverySnapshot\(localStore, savedSummary\.id\);/);
});
