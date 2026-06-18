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

function createIntentMutation(intent) {
  return { intent };
}

const syncModule = await loadTypeScriptModule('packages/sdkwork-notes-pc-sync/src/index.ts');

test('notes sync remote apply request maps a replayable task into an explicit idempotent transport payload', () => {
  const task = syncModule.createNotesSyncTask({
    id: 'sync-remote-apply-1',
    entityType: 'note',
    entityId: 'note-remote-1',
    operation: 'upsert',
    at: '2026-04-14T10:00:00.000Z',
    replayable: true,
    mutation: createUpsertMutation({
      title: 'Remote apply note',
      content: '<p>Ship it</p>',
      tags: ['alpha', 'beta'],
      publishStatus: 'draft',
    }),
    localRevision: 12,
    remoteCursor: 'cursor-before',
  });

  const request = syncModule.createNotesSyncRemoteApplyRequest(task);

  assert.deepEqual(request, {
    idempotencyKey: 'sync-remote-apply-1',
    taskId: 'sync-remote-apply-1',
    entityType: 'note',
    entityId: 'note-remote-1',
    operation: 'upsert',
    localRevision: 12,
    baseRemoteCursor: 'cursor-before',
    mutation: createUpsertMutation({
      title: 'Remote apply note',
      content: '<p>Ship it</p>',
      tags: ['alpha', 'beta'],
      publishStatus: 'draft',
    }),
  });

  assert.notEqual(request.mutation, task.mutation);
  assert.notEqual(request.mutation.patch, task.mutation.patch);
  assert.notEqual(request.mutation.patch.tags, task.mutation.patch.tags);

  request.mutation.patch.tags.push('gamma');
  assert.deepEqual(task.mutation.patch.tags, ['alpha', 'beta']);
});

test('notes sync remote apply request refuses non-replayable direct-write shadow tasks', () => {
  const task = syncModule.createNotesSyncTask({
    id: 'sync-remote-apply-2',
    entityType: 'note',
    entityId: 'note-remote-2',
    operation: 'delete',
    at: '2026-04-14T10:05:00.000Z',
    replayable: false,
    mutation: createIntentMutation('move-to-trash'),
    remoteCursor: 'cursor-shadow',
  });

  assert.throws(
    () => syncModule.createNotesSyncRemoteApplyRequest(task),
    /is not replayable and cannot be converted to a remote apply request\./u,
  );
});

test('notes sync remote apply executor delegates replayable tasks through the explicit remote apply boundary', async () => {
  const task = syncModule.createNotesSyncTask({
    id: 'sync-remote-apply-3',
    entityType: 'note',
    entityId: 'note-remote-3',
    operation: 'restore',
    at: '2026-04-14T10:10:00.000Z',
    replayable: true,
    mutation: createIntentMutation('restore-from-trash'),
    localRevision: 9,
    remoteCursor: 'cursor-restore',
  });

  const receivedRequests = [];
  const execute = syncModule.createNotesSyncRemoteApplyExecutor({
    async apply(request) {
      receivedRequests.push(request);
      return {
        type: 'completed',
        at: '2026-04-14T10:10:02.000Z',
        remoteCursor: 'cursor-restored',
      };
    },
  });

  const result = await execute(task);

  assert.deepEqual(receivedRequests, [
    {
      idempotencyKey: 'sync-remote-apply-3',
      taskId: 'sync-remote-apply-3',
      entityType: 'note',
      entityId: 'note-remote-3',
      operation: 'restore',
      localRevision: 9,
      baseRemoteCursor: 'cursor-restore',
      mutation: createIntentMutation('restore-from-trash'),
    },
  ]);
  assert.deepEqual(result, {
    type: 'completed',
    at: '2026-04-14T10:10:02.000Z',
    remoteCursor: 'cursor-restored',
  });
});
