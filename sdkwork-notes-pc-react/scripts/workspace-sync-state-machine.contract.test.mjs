import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { applyContractModuleStubs } from './contract-transpile-helpers.mjs';

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

async function loadTypeScriptModule(relativePath) {
  const transpiled = await transpileTypeScriptModule(relativePath);
  return import(createDataModuleUrl(applyContractModuleStubs(transpiled.outputText)));
}

function createUpsertMutation(patch) {
  return { patch };
}

function createMoveMutation(targetParentId) {
  return { targetParentId };
}

function createIntentMutation(intent) {
  return { intent };
}

const syncModule = await loadTypeScriptModule('packages/sdkwork-notes-pc-sync-commons/src/index.ts');

test('notes sync package exports a frozen task/status/conflict contract for Step 08', () => {
  assert.equal(syncModule.NOTES_SYNC_PACKAGE, '@sdkwork/notes-pc-sync-commons');
  assert.deepEqual(syncModule.NOTES_SYNC_TASK_STATUSES, [
    'queued',
    'running',
    'retrying',
    'failed',
    'conflict',
    'completed',
  ]);
  assert.deepEqual(syncModule.NOTES_SYNC_ENTITY_TYPES, [
    'note',
    'folder',
  ]);
  assert.deepEqual(syncModule.NOTES_SYNC_OPERATION_TYPES, [
    'upsert',
    'delete',
    'restore',
    'move',
    'permanent-delete',
  ]);
  assert.deepEqual(syncModule.NOTES_SYNC_FAILURE_CODES, [
    'network',
    'throttled',
    'unauthorized',
    'remote-rejected',
    'replay-disabled',
    'unknown',
  ]);
  assert.deepEqual(syncModule.NOTES_SYNC_CONFLICT_CODES, [
    'stale-base-version',
    'deleted-remotely',
    'folder-structure-changed',
    'unknown',
  ]);
  assert.deepEqual(syncModule.NOTES_SYNC_REPLAY_MODES, [
    'none',
    'automatic',
    'manual',
  ]);
});

test('notes sync task factory produces a queued task with explicit replay safety metadata', () => {
  const task = syncModule.createNotesSyncTask({
    id: 'sync-1',
    entityType: 'note',
    entityId: 'note-1',
    operation: 'upsert',
    at: '2026-04-13T09:00:00.000Z',
    replayable: true,
    mutation: createUpsertMutation({
      title: 'Draft note',
      content: '<p>Body</p>',
      publishStatus: 'draft',
    }),
    localRevision: 7,
    remoteCursor: 'cursor-1',
  });

  assert.deepEqual(task, {
    id: 'sync-1',
    entityType: 'note',
    entityId: 'note-1',
    operation: 'upsert',
    replayable: true,
    mutation: createUpsertMutation({
      title: 'Draft note',
      content: '<p>Body</p>',
      publishStatus: 'draft',
    }),
    status: 'queued',
    createdAt: '2026-04-13T09:00:00.000Z',
    updatedAt: '2026-04-13T09:00:00.000Z',
    enqueuedAt: '2026-04-13T09:00:00.000Z',
    startedAt: null,
    completedAt: null,
    nextRetryAt: null,
    retryCount: 0,
    attemptCount: 0,
    localRevision: 7,
    remoteCursor: 'cursor-1',
    lastFailure: null,
    lastConflict: null,
  });
});

test('notes sync task reducer models automatic retry replay and final remote acknowledgement', () => {
  let task = syncModule.createNotesSyncTask({
    id: 'sync-2',
    entityType: 'note',
    entityId: 'note-2',
    operation: 'upsert',
    at: '2026-04-13T09:01:00.000Z',
    replayable: true,
    mutation: createUpsertMutation({
      title: 'Retry me',
      content: '<p>Body</p>',
    }),
    localRevision: 3,
  });

  task = syncModule.transitionNotesSyncTask(task, {
    type: 'start',
    at: '2026-04-13T09:01:05.000Z',
  });
  assert.equal(task.status, 'running');
  assert.equal(task.attemptCount, 1);
  assert.equal(syncModule.resolveNotesSyncTaskReplayMode(task), 'none');

  task = syncModule.transitionNotesSyncTask(task, {
    type: 'retry-scheduled',
    at: '2026-04-13T09:01:06.000Z',
    nextRetryAt: '2026-04-13T09:01:36.000Z',
    failure: {
      code: 'network',
      message: 'timeout',
    },
  });
  assert.equal(task.status, 'retrying');
  assert.equal(task.retryCount, 1);
  assert.equal(task.nextRetryAt, '2026-04-13T09:01:36.000Z');
  assert.equal(task.lastFailure.code, 'network');
  assert.equal(task.lastFailure.retryable, true);
  assert.equal(syncModule.resolveNotesSyncTaskReplayMode(task), 'automatic');

  task = syncModule.transitionNotesSyncTask(task, {
    type: 'requeue',
    at: '2026-04-13T09:01:36.000Z',
  });
  assert.equal(task.status, 'queued');
  assert.equal(task.nextRetryAt, null);

  task = syncModule.transitionNotesSyncTask(task, {
    type: 'start',
    at: '2026-04-13T09:01:37.000Z',
  });
  assert.equal(task.attemptCount, 2);

  task = syncModule.transitionNotesSyncTask(task, {
    type: 'complete',
    at: '2026-04-13T09:01:38.000Z',
    remoteCursor: 'cursor-2',
  });
  assert.equal(task.status, 'completed');
  assert.equal(task.completedAt, '2026-04-13T09:01:38.000Z');
  assert.equal(task.remoteCursor, 'cursor-2');
  assert.equal(syncModule.resolveNotesSyncTaskReplayMode(task), 'none');
});

test('notes sync task reducer surfaces conflict classification as a manual recovery state', () => {
  let task = syncModule.createNotesSyncTask({
    id: 'sync-3',
    entityType: 'note',
    entityId: 'note-3',
    operation: 'delete',
    at: '2026-04-13T09:02:00.000Z',
    replayable: true,
    mutation: createIntentMutation('move-to-trash'),
  });

  task = syncModule.transitionNotesSyncTask(task, {
    type: 'start',
    at: '2026-04-13T09:02:03.000Z',
  });

  task = syncModule.transitionNotesSyncTask(task, {
    type: 'conflict-detected',
    at: '2026-04-13T09:02:04.000Z',
    conflict: {
      code: 'deleted-remotely',
      message: 'remote note already changed',
    },
  });

  assert.equal(task.status, 'conflict');
  assert.equal(task.lastConflict.code, 'deleted-remotely');
  assert.equal(task.lastConflict.requiresManualResolution, true);
  assert.equal(syncModule.resolveNotesSyncTaskReplayMode(task), 'manual');
});

test('notes sync helpers distinguish retryable transport failures from terminal remote rejections', () => {
  const retryable = syncModule.createNotesSyncFailure({
    code: 'network',
    message: 'timeout',
    at: '2026-04-13T09:03:00.000Z',
  });
  const terminal = syncModule.createNotesSyncFailure({
    code: 'remote-rejected',
    message: 'validation error',
    at: '2026-04-13T09:03:01.000Z',
  });

  assert.equal(retryable.retryable, true);
  assert.equal(terminal.retryable, false);
});

test('notes sync reducer rejects invalid transitions that would skip the explicit queue lifecycle', () => {
  const completedTask = syncModule.transitionNotesSyncTask(
    syncModule.transitionNotesSyncTask(
      syncModule.createNotesSyncTask({
        id: 'sync-4',
        entityType: 'folder',
        entityId: 'folder-1',
        operation: 'move',
        at: '2026-04-13T09:04:00.000Z',
        replayable: true,
        mutation: createMoveMutation('folder-root'),
      }),
      {
        type: 'start',
        at: '2026-04-13T09:04:01.000Z',
      },
    ),
    {
      type: 'complete',
      at: '2026-04-13T09:04:02.000Z',
    },
  );

  assert.throws(
    () =>
      syncModule.transitionNotesSyncTask(completedTask, {
        type: 'start',
        at: '2026-04-13T09:04:03.000Z',
      }),
    /Cannot apply sync task event "start" while task is "completed"\./u,
  );
});
