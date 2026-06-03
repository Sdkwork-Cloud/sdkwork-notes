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

async function loadTypeScriptModule(relativePath) {
  const transpiled = await transpileTypeScriptModule(relativePath);
  return import(createDataModuleUrl(transpiled.outputText));
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

const syncModule = await loadTypeScriptModule('packages/sdkwork-notes-sync/src/index.ts');

test('notes sync queue store persists a versioned queue snapshot for queued and retrying tasks', async () => {
  assert.equal(syncModule.NOTES_SYNC_QUEUE_STORAGE_KEY, 'sdkwork-notes-sync-queue');
  assert.equal(syncModule.NOTES_SYNC_QUEUE_SCHEMA_VERSION, 2);

  const storage = createMemoryStorage();
  const store = syncModule.createBrowserNotesSyncQueueStore({ storage });

  const queuedTask = syncModule.createNotesSyncTask({
    id: 'sync-queue-1',
    entityType: 'note',
    entityId: 'note-1',
    operation: 'upsert',
    at: '2026-04-13T10:00:00.000Z',
    mutation: createUpsertMutation({
      title: 'Queue note',
      publishStatus: 'draft',
    }),
    localRevision: 11,
  });

  const retryingTask = syncModule.scheduleNotesSyncTaskRetry(
    syncModule.transitionNotesSyncTask(
      syncModule.createNotesSyncTask({
        id: 'sync-queue-2',
        entityType: 'folder',
        entityId: 'folder-1',
        operation: 'move',
        at: '2026-04-13T10:00:01.000Z',
        mutation: createMoveMutation('folder-9'),
      }),
      {
        type: 'start',
        at: '2026-04-13T10:00:02.000Z',
      },
    ),
    {
      at: '2026-04-13T10:00:03.000Z',
      failure: {
        code: 'network',
        message: 'timeout',
      },
      retryPolicy: syncModule.createNotesSyncRetryPolicy({
        retryDelaysMs: [1000, 5000],
      }),
    },
  );

  await store.saveQueue({
    tasks: [queuedTask, retryingTask],
  });

  const restoredSnapshot = await store.loadQueue();
  assert.deepEqual(restoredSnapshot, {
    tasks: [queuedTask, retryingTask],
  });

  const envelope = JSON.parse(storage.getItem(syncModule.NOTES_SYNC_QUEUE_STORAGE_KEY));
  assert.equal(envelope.version, 2);
  assert.deepEqual(envelope.queue, {
    tasks: [queuedTask, retryingTask],
  });
});

test('notes sync queue snapshot accepts permanent-delete tasks as a distinct persisted operation', async () => {
  const storage = createMemoryStorage();
  const store = syncModule.createBrowserNotesSyncQueueStore({ storage });

  const permanentDeleteTask = syncModule.createNotesSyncTask({
    id: 'sync-queue-permanent-delete-1',
    entityType: 'note',
    entityId: 'note-trash-1',
    operation: 'permanent-delete',
    at: '2026-04-13T10:05:00.000Z',
    mutation: createIntentMutation('permanent-delete'),
  });

  await store.saveQueue({
    tasks: [permanentDeleteTask],
  });

  const restoredSnapshot = await store.loadQueue();
  assert.deepEqual(restoredSnapshot, {
    tasks: [permanentDeleteTask],
  });
});

test('notes sync queue snapshot reader degrades legacy schema envelopes, invalid payloads, and unknown schema versions to an empty queue', async () => {
  assert.deepEqual(syncModule.resolveNotesSyncQueueSnapshot('not-json'), { tasks: [] });
  assert.deepEqual(
    syncModule.resolveNotesSyncQueueSnapshot({
      version: 2,
      queue: {
        tasks: [
          {
            id: 'legacy-task',
            entityType: 'note',
            entityId: 'note-legacy-1',
            operation: 'upsert',
            mutation: {
              patch: {
                title: 'Legacy note',
              },
            },
            status: 'queued',
            createdAt: '2026-04-13T10:06:00.000Z',
            updatedAt: '2026-04-13T10:06:00.000Z',
            enqueuedAt: '2026-04-13T10:06:00.000Z',
            startedAt: null,
            completedAt: null,
            nextRetryAt: null,
            retryCount: 0,
            attemptCount: 0,
            localRevision: null,
            remoteCursor: null,
            lastFailure: null,
            lastConflict: null,
          },
        ],
      },
    }),
    {
      tasks: [
        {
          id: 'legacy-task',
          entityType: 'note',
          entityId: 'note-legacy-1',
          operation: 'upsert',
          replayable: false,
          mutation: {
            patch: {
              title: 'Legacy note',
            },
          },
          status: 'queued',
          createdAt: '2026-04-13T10:06:00.000Z',
          updatedAt: '2026-04-13T10:06:00.000Z',
          enqueuedAt: '2026-04-13T10:06:00.000Z',
          startedAt: null,
          completedAt: null,
          nextRetryAt: null,
          retryCount: 0,
          attemptCount: 0,
          localRevision: null,
          remoteCursor: null,
          lastFailure: null,
          lastConflict: null,
        },
      ],
    },
  );
  assert.deepEqual(
    syncModule.resolveNotesSyncQueueSnapshot({
      version: 99,
      queue: {
        tasks: [
          {
            id: 'bad-task',
          },
        ],
      },
    }),
    { tasks: [] },
  );
});

test('notes sync retry helpers schedule automatic replay for retryable failures and exhaust terminal failures', () => {
  const retryPolicy = syncModule.createNotesSyncRetryPolicy({
    retryDelaysMs: [1000],
  });

  let task = syncModule.transitionNotesSyncTask(
    syncModule.createNotesSyncTask({
      id: 'sync-retry-1',
      entityType: 'note',
      entityId: 'note-7',
      operation: 'upsert',
      at: '2026-04-13T10:10:00.000Z',
      replayable: true,
      mutation: createUpsertMutation({
        title: 'Retry note',
      }),
    }),
    {
      type: 'start',
      at: '2026-04-13T10:10:01.000Z',
    },
  );

  task = syncModule.scheduleNotesSyncTaskRetry(task, {
    at: '2026-04-13T10:10:02.000Z',
    failure: {
      code: 'network',
      message: 'timeout',
    },
    retryPolicy,
  });
  assert.equal(task.status, 'retrying');
  assert.equal(task.retryCount, 1);
  assert.equal(task.nextRetryAt, '2026-04-13T10:10:03.000Z');

  task = syncModule.releaseNotesSyncTaskForReplay(task, '2026-04-13T10:10:03.000Z');
  task = syncModule.transitionNotesSyncTask(task, {
    type: 'start',
    at: '2026-04-13T10:10:04.000Z',
  });
  task = syncModule.scheduleNotesSyncTaskRetry(task, {
    at: '2026-04-13T10:10:05.000Z',
    failure: {
      code: 'network',
      message: 'timeout again',
    },
    retryPolicy,
  });
  assert.equal(task.status, 'failed');
  assert.equal(task.lastFailure.code, 'network');
  assert.equal(syncModule.resolveNotesSyncTaskReplayMode(task), 'manual');

  const terminalTask = syncModule.scheduleNotesSyncTaskRetry(
    syncModule.transitionNotesSyncTask(
      syncModule.createNotesSyncTask({
        id: 'sync-retry-2',
        entityType: 'note',
        entityId: 'note-8',
        operation: 'delete',
        at: '2026-04-13T10:20:00.000Z',
        replayable: true,
        mutation: createIntentMutation('move-to-trash'),
      }),
      {
        type: 'start',
        at: '2026-04-13T10:20:01.000Z',
      },
    ),
    {
      at: '2026-04-13T10:20:02.000Z',
      failure: {
        code: 'remote-rejected',
        message: 'validation error',
      },
      retryPolicy: syncModule.createNotesSyncRetryPolicy({
        retryDelaysMs: [1000, 5000],
      }),
    },
  );

  assert.equal(terminalTask.status, 'failed');
  assert.equal(terminalTask.retryCount, 0);
  assert.equal(terminalTask.nextRetryAt, null);
});
