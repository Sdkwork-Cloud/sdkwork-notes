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
    async loadQueue() {
      return snapshot;
    },
    async saveQueue(nextSnapshot) {
      snapshot = nextSnapshot;
    },
    async clearQueue() {
      snapshot = { tasks: [] };
    },
  };
}

function createManualClock(initialAt) {
  let now = initialAt;

  return {
    now() {
      return now;
    },
    set(nextAt) {
      now = nextAt;
    },
  };
}

function createManualScheduler() {
  let timers = [];
  let nextId = 1;

  return {
    set(delayMs, callback) {
      const handle = {
        id: nextId += 1,
        delayMs,
        callback,
      };
      timers.push(handle);
      return handle;
    },
    clear(handle) {
      timers = timers.filter((timer) => timer !== handle);
    },
    getPendingDelays() {
      return timers.map((timer) => timer.delayMs);
    },
    async fireNext() {
      const [nextTimer] = timers;
      assert.ok(nextTimer, 'Expected a pending timer.');
      timers = timers.slice(1);
      await nextTimer.callback();
      return nextTimer;
    },
  };
}

function createUpsertMutation(patch) {
  return { patch };
}

function createIntentMutation(intent) {
  return { intent };
}

function createRetryingTask(syncModule, input) {
  return syncModule.transitionNotesSyncTask(
    syncModule.transitionNotesSyncTask(
      syncModule.createNotesSyncTask({
        id: input.id,
        entityType: 'note',
        entityId: input.entityId,
        operation: 'upsert',
        at: input.createdAt,
        replayable: true,
        mutation: createUpsertMutation({
          title: `Retry ${input.entityId}`,
        }),
      }),
      {
        type: 'start',
        at: input.startedAt,
      },
    ),
    {
      type: 'retry-scheduled',
      at: input.failedAt,
      nextRetryAt: input.nextRetryAt,
      failure: {
        code: 'network',
        message: 'timeout',
      },
    },
  );
}

const syncModule = await loadTypeScriptModule('packages/sdkwork-notes-pc-sync/src/index.ts');

test('notes sync worker runtime drains queued tasks serially until no runnable task remains', async () => {
  const firstTask = syncModule.createNotesSyncTask({
    id: 'runtime-drain-1',
    entityType: 'note',
    entityId: 'note-runtime-drain-1',
    operation: 'upsert',
    at: '2026-04-14T05:00:00.000Z',
    replayable: true,
    mutation: createUpsertMutation({
      title: 'Runtime drain one',
    }),
  });
  const secondTask = syncModule.createNotesSyncTask({
    id: 'runtime-drain-2',
    entityType: 'note',
    entityId: 'note-runtime-drain-2',
    operation: 'delete',
    at: '2026-04-14T05:00:01.000Z',
    replayable: true,
    mutation: createIntentMutation('move-to-trash'),
  });
  const queueStore = createMemoryQueueStore({
    tasks: [secondTask, firstTask],
  });
  const handledTaskIds = [];

  const runtime = syncModule.createNotesSyncWorkerRuntime({
    queueStore,
    now: () => '2026-04-14T05:01:00.000Z',
    async execute(task) {
      handledTaskIds.push(task.id);
      return {
        type: 'completed',
        at: task.id === 'runtime-drain-1'
          ? '2026-04-14T05:01:01.000Z'
          : '2026-04-14T05:01:02.000Z',
      };
    },
  });

  await runtime.requestDrain();

  assert.deepEqual(handledTaskIds, ['runtime-drain-1', 'runtime-drain-2']);

  const queue = await queueStore.loadQueue();
  assert.deepEqual(
    queue.tasks.map((task) => [task.id, task.status]),
    [
      ['runtime-drain-2', 'completed'],
      ['runtime-drain-1', 'completed'],
    ],
  );
});

test('notes sync worker runtime coalesces overlapping drain requests into the active run', async () => {
  const queuedTask = syncModule.createNotesSyncTask({
    id: 'runtime-coalesce-1',
    entityType: 'note',
    entityId: 'note-runtime-coalesce-1',
    operation: 'upsert',
    at: '2026-04-14T06:00:00.000Z',
    replayable: true,
    mutation: createUpsertMutation({
      title: 'Runtime coalesce',
    }),
  });
  const queueStore = createMemoryQueueStore({
    tasks: [queuedTask],
  });

  let releaseExecution;
  let concurrentExecutions = 0;
  let maxConcurrentExecutions = 0;
  let handledCount = 0;
  const runtime = syncModule.createNotesSyncWorkerRuntime({
    queueStore,
    now: () => '2026-04-14T06:00:05.000Z',
    async execute() {
      handledCount += 1;
      concurrentExecutions += 1;
      maxConcurrentExecutions = Math.max(maxConcurrentExecutions, concurrentExecutions);
      await new Promise((resolve) => {
        releaseExecution = resolve;
      });
      concurrentExecutions -= 1;
      return {
        type: 'completed',
        at: '2026-04-14T06:00:06.000Z',
      };
    },
  });

  const firstDrain = runtime.requestDrain();
  const secondDrain = runtime.requestDrain();

  assert.equal(firstDrain, secondDrain);
  while (typeof releaseExecution !== 'function') {
    await Promise.resolve();
  }
  assert.equal(handledCount, 1);

  releaseExecution();
  await Promise.all([firstDrain, secondDrain]);

  assert.equal(handledCount, 1);
  assert.equal(maxConcurrentExecutions, 1);
});

test('notes sync worker runtime schedules the earliest retry and replays retrying tasks automatically', async () => {
  const firstRetryingTask = createRetryingTask(syncModule, {
    id: 'runtime-retry-1',
    entityId: 'note-runtime-retry-1',
    createdAt: '2026-04-14T07:00:00.000Z',
    startedAt: '2026-04-14T07:00:01.000Z',
    failedAt: '2026-04-14T07:00:02.000Z',
    nextRetryAt: '2026-04-14T07:00:03.000Z',
  });
  const secondRetryingTask = createRetryingTask(syncModule, {
    id: 'runtime-retry-2',
    entityId: 'note-runtime-retry-2',
    createdAt: '2026-04-14T07:00:00.000Z',
    startedAt: '2026-04-14T07:00:01.000Z',
    failedAt: '2026-04-14T07:00:02.000Z',
    nextRetryAt: '2026-04-14T07:00:05.000Z',
  });
  const queueStore = createMemoryQueueStore({
    tasks: [secondRetryingTask, firstRetryingTask],
  });
  const clock = createManualClock('2026-04-14T07:00:02.000Z');
  const scheduler = createManualScheduler();
  const handledTaskIds = [];

  const runtime = syncModule.createNotesSyncWorkerRuntime({
    queueStore,
    now: () => clock.now(),
    scheduler,
    async execute(task) {
      handledTaskIds.push(task.id);
      return {
        type: 'completed',
        at: clock.now(),
      };
    },
  });

  await runtime.requestDrain();
  assert.deepEqual(scheduler.getPendingDelays(), [1000]);

  clock.set('2026-04-14T07:00:03.000Z');
  await scheduler.fireNext();

  assert.deepEqual(handledTaskIds, ['runtime-retry-1']);
  assert.deepEqual(scheduler.getPendingDelays(), [2000]);

  clock.set('2026-04-14T07:00:05.000Z');
  await scheduler.fireNext();

  assert.deepEqual(handledTaskIds, ['runtime-retry-1', 'runtime-retry-2']);
  assert.deepEqual(scheduler.getPendingDelays(), []);

  const queue = await queueStore.loadQueue();
  assert.deepEqual(
    queue.tasks.map((task) => [task.id, task.status]),
    [
      ['runtime-retry-2', 'completed'],
      ['runtime-retry-1', 'completed'],
    ],
  );
});

test('notes sync worker runtime cancels pending retry timers when disposed', async () => {
  const retryingTask = createRetryingTask(syncModule, {
    id: 'runtime-dispose-1',
    entityId: 'note-runtime-dispose-1',
    createdAt: '2026-04-14T08:00:00.000Z',
    startedAt: '2026-04-14T08:00:01.000Z',
    failedAt: '2026-04-14T08:00:02.000Z',
    nextRetryAt: '2026-04-14T08:00:07.000Z',
  });
  const queueStore = createMemoryQueueStore({
    tasks: [retryingTask],
  });
  const scheduler = createManualScheduler();
  let handledCount = 0;

  const runtime = syncModule.createNotesSyncWorkerRuntime({
    queueStore,
    now: () => '2026-04-14T08:00:02.000Z',
    scheduler,
    async execute() {
      handledCount += 1;
      return {
        type: 'completed',
        at: '2026-04-14T08:00:07.000Z',
      };
    },
  });

  await runtime.requestDrain();
  assert.deepEqual(scheduler.getPendingDelays(), [5000]);

  runtime.dispose();

  assert.deepEqual(scheduler.getPendingDelays(), []);
  assert.equal(handledCount, 0);
});
