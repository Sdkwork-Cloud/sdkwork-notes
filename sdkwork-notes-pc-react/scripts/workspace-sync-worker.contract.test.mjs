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

function createMemoryQueueStore(initialSnapshot = { tasks: [] }) {
  let snapshot = initialSnapshot;

  return {
    savedSnapshots: [],
    async loadQueue() {
      return snapshot;
    },
    async saveQueue(nextSnapshot) {
      snapshot = nextSnapshot;
      this.savedSnapshots.push(nextSnapshot);
    },
    async clearQueue() {
      snapshot = { tasks: [] };
    },
  };
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

function createRunningRetryingTask(syncModule, overrides = {}) {
  return syncModule.scheduleNotesSyncTaskRetry(
    syncModule.transitionNotesSyncTask(
      syncModule.createNotesSyncTask({
        id: 'sync-worker-retrying-1',
        entityType: 'note',
        entityId: 'note-retrying-1',
        operation: 'upsert',
        at: '2026-04-14T01:00:00.000Z',
        replayable: true,
        mutation: createUpsertMutation({
          title: 'Retry candidate',
        }),
        ...overrides,
      }),
      {
        type: 'start',
        at: '2026-04-14T01:00:01.000Z',
      },
    ),
    {
      at: '2026-04-14T01:00:02.000Z',
      failure: {
        code: 'network',
        message: 'timeout',
      },
      retryPolicy: syncModule.createNotesSyncRetryPolicy({
        retryDelaysMs: [1000, 5000],
      }),
    },
  );
}

const syncModule = await loadTypeScriptModule('packages/sdkwork-notes-pc-sync/src/index.ts');

test('notes sync worker executes the oldest queued task and persists a completed ack with remote cursor', async () => {
  const firstTask = syncModule.createNotesSyncTask({
    id: 'sync-worker-queued-1',
    entityType: 'note',
    entityId: 'note-queued-1',
    operation: 'upsert',
    at: '2026-04-14T00:00:00.000Z',
    replayable: true,
    mutation: createUpsertMutation({
      title: 'First queued note',
    }),
    remoteCursor: 'cursor-before',
  });
  const secondTask = syncModule.createNotesSyncTask({
    id: 'sync-worker-queued-2',
    entityType: 'note',
    entityId: 'note-queued-2',
    operation: 'delete',
    at: '2026-04-14T00:00:01.000Z',
    replayable: true,
    mutation: createIntentMutation('move-to-trash'),
  });
  const queueStore = createMemoryQueueStore({
    tasks: [secondTask, firstTask],
  });

  let handledTask = null;
  const outcome = await syncModule.executeNextNotesSyncTask({
    queueStore,
    at: '2026-04-14T00:01:00.000Z',
    async execute(task) {
      handledTask = task;
      return {
        type: 'completed',
        at: '2026-04-14T00:01:05.000Z',
        remoteCursor: 'cursor-after',
      };
    },
  });

  assert.equal(handledTask.id, 'sync-worker-queued-1');
  assert.equal(handledTask.status, 'running');
  assert.equal(handledTask.attemptCount, 1);
  assert.deepEqual(handledTask.mutation, firstTask.mutation);
  assert.equal(queueStore.savedSnapshots.length, 2);
  assert.equal(outcome.task.id, 'sync-worker-queued-1');
  assert.equal(outcome.task.status, 'completed');
  assert.equal(outcome.task.remoteCursor, 'cursor-after');
  assert.equal(outcome.task.completedAt, '2026-04-14T00:01:05.000Z');

  const completedTask = outcome.queue.tasks.find((task) => task.id === 'sync-worker-queued-1');
  assert.equal(completedTask.status, 'completed');
  assert.equal(completedTask.startedAt, '2026-04-14T00:01:00.000Z');
  assert.equal(completedTask.completedAt, '2026-04-14T00:01:05.000Z');
  assert.equal(completedTask.remoteCursor, 'cursor-after');

  const untouchedTask = outcome.queue.tasks.find((task) => task.id === 'sync-worker-queued-2');
  assert.equal(untouchedTask.status, 'queued');
  assert.equal(untouchedTask.attemptCount, 0);
});

test('notes sync worker releases an eligible retrying task and replays it automatically', async () => {
  const retryingTask = createRunningRetryingTask(syncModule);
  const queueStore = createMemoryQueueStore({
    tasks: [retryingTask],
  });

  let handledTask = null;
  const outcome = await syncModule.executeNextNotesSyncTask({
    queueStore,
    at: '2026-04-14T01:00:03.000Z',
    async execute(task) {
      handledTask = task;
      return {
        type: 'completed',
        at: '2026-04-14T01:00:04.000Z',
        remoteCursor: 'cursor-replayed',
      };
    },
  });

  assert.equal(handledTask.id, retryingTask.id);
  assert.equal(handledTask.status, 'running');
  assert.equal(handledTask.attemptCount, 2);
  assert.equal(outcome.task.status, 'completed');
  assert.equal(outcome.task.retryCount, 1);
  assert.equal(outcome.task.enqueuedAt, '2026-04-14T01:00:03.000Z');
  assert.equal(outcome.task.remoteCursor, 'cursor-replayed');
});

test('notes sync worker persists handler conflicts as manual recovery tasks', async () => {
  const queuedTask = syncModule.createNotesSyncTask({
    id: 'sync-worker-conflict-1',
    entityType: 'note',
    entityId: 'note-conflict-1',
    operation: 'move',
    at: '2026-04-14T02:00:00.000Z',
    replayable: true,
    mutation: createMoveMutation('folder-2'),
  });
  const queueStore = createMemoryQueueStore({
    tasks: [queuedTask],
  });

  const outcome = await syncModule.executeNextNotesSyncTask({
    queueStore,
    at: '2026-04-14T02:00:10.000Z',
    async execute() {
      return {
        type: 'conflict',
        at: '2026-04-14T02:00:12.000Z',
        conflict: {
          code: 'folder-structure-changed',
          message: 'remote folder tree changed',
        },
      };
    },
  });

  assert.equal(outcome.task.status, 'conflict');
  assert.equal(outcome.task.lastConflict.code, 'folder-structure-changed');
  assert.equal(outcome.task.lastConflict.message, 'remote folder tree changed');
  assert.equal(outcome.task.completedAt, null);
});

test('notes sync worker schedules retryable failures back into retrying state', async () => {
  const queuedTask = syncModule.createNotesSyncTask({
    id: 'sync-worker-retry-1',
    entityType: 'note',
    entityId: 'note-retry-1',
    operation: 'upsert',
    at: '2026-04-14T03:00:00.000Z',
    replayable: true,
    mutation: createUpsertMutation({
      title: 'Retry me',
    }),
  });
  const queueStore = createMemoryQueueStore({
    tasks: [queuedTask],
  });

  const outcome = await syncModule.executeNextNotesSyncTask({
    queueStore,
    at: '2026-04-14T03:00:05.000Z',
    retryPolicy: syncModule.createNotesSyncRetryPolicy({
      retryDelaysMs: [2000],
    }),
    async execute() {
      return {
        type: 'failed',
        at: '2026-04-14T03:00:06.000Z',
        failure: {
          code: 'network',
          message: 'timeout',
        },
      };
    },
  });

  assert.equal(outcome.task.status, 'retrying');
  assert.equal(outcome.task.retryCount, 1);
  assert.equal(outcome.task.attemptCount, 1);
  assert.equal(outcome.task.nextRetryAt, '2026-04-14T03:00:08.000Z');
  assert.equal(outcome.task.lastFailure.code, 'network');
  assert.equal(outcome.task.lastFailure.retryable, true);
});

test('notes sync worker persists terminal failures without scheduling a retry', async () => {
  const queuedTask = syncModule.createNotesSyncTask({
    id: 'sync-worker-failed-1',
    entityType: 'note',
    entityId: 'note-failed-1',
    operation: 'delete',
    at: '2026-04-14T04:00:00.000Z',
    replayable: true,
    mutation: createIntentMutation('move-to-trash'),
  });
  const queueStore = createMemoryQueueStore({
    tasks: [queuedTask],
  });

  const outcome = await syncModule.executeNextNotesSyncTask({
    queueStore,
    at: '2026-04-14T04:00:05.000Z',
    async execute() {
      return {
        type: 'failed',
        at: '2026-04-14T04:00:06.000Z',
        failure: {
          code: 'remote-rejected',
          message: 'validation error',
        },
      };
    },
  });

  assert.equal(outcome.task.status, 'failed');
  assert.equal(outcome.task.retryCount, 0);
  assert.equal(outcome.task.attemptCount, 1);
  assert.equal(outcome.task.nextRetryAt, null);
  assert.equal(outcome.task.lastFailure.code, 'remote-rejected');
  assert.equal(outcome.task.lastFailure.retryable, false);
});

test('notes sync worker refuses to execute non-replayable queued tasks and persists a terminal replay-disabled failure', async () => {
  const queuedTask = syncModule.createNotesSyncTask({
    id: 'sync-worker-non-replayable-1',
    entityType: 'note',
    entityId: 'note-non-replayable-1',
    operation: 'upsert',
    at: '2026-04-14T04:30:00.000Z',
    replayable: false,
    mutation: createUpsertMutation({
      title: 'Already remote confirmed',
    }),
  });
  const queueStore = createMemoryQueueStore({
    tasks: [queuedTask],
  });

  let executeCalled = false;
  const outcome = await syncModule.executeNextNotesSyncTask({
    queueStore,
    at: '2026-04-14T04:30:05.000Z',
    async execute() {
      executeCalled = true;
      return {
        type: 'completed',
        at: '2026-04-14T04:30:06.000Z',
      };
    },
  });

  assert.equal(executeCalled, false);
  assert.equal(outcome.task.status, 'failed');
  assert.equal(outcome.task.attemptCount, 1);
  assert.equal(outcome.task.lastFailure.code, 'replay-disabled');
  assert.equal(outcome.task.lastFailure.retryable, false);
});
