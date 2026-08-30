import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function readFromWorkspace(...segments) {
  return fs.readFileSync(path.resolve(workspaceRoot, ...segments), 'utf8');
}

function readTargetContractSpec() {
  const contractPath = path.resolve(
    workspaceRoot,
    'contracts',
    'notes-remote-apply-app-sdk-target.contract.json',
  );

  assert.equal(
    fs.existsSync(contractPath),
    true,
    `Expected upstream target contract spec at ${contractPath}.`,
  );

  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

test('future notes remote apply target contract freezes the semantic SDK and controller shape', () => {
  const spec = readTargetContractSpec();

  assert.deepEqual(spec.sdk, {
    module: 'note',
    method: 'remoteApply',
    requestType: 'NoteRemoteApplyRequest',
    responseType: 'NoteRemoteApplyResultVO',
  });

  assert.deepEqual(spec.controller, {
    className: 'NotesAppApiController',
    operationId: 'noteRemoteApply',
    paths: [
      'POST /app/v3/api/notes/{noteId}:remoteApply',
      'POST /app/v3/api/notes/{noteId}/remote-apply',
    ],
  });

  assert.deepEqual(spec.request, {
    pathParameter: 'noteId',
    requiredFields: [
      'idempotencyKey',
      'taskId',
      'entityType',
      'entityId',
      'operation',
      'mutation',
    ],
    optionalFields: ['localRevision', 'baseRemoteCursor'],
    constraints: [
      'path noteId must match body entityId',
      'entityType must remain note',
      'idempotencyKey must remain stable across retries',
    ],
  });

  assert.deepEqual(spec.response, {
    outcomeField: 'outcome',
    transportFailures: 'throw',
    outcomes: {
      applied: {
        requiredFields: ['taskId', 'remoteCursor', 'appliedAt'],
      },
      conflict: {
        requiredFields: [
          'taskId',
          'remoteCursor',
          'conflict.code',
          'conflict.message',
          'conflict.occurredAt',
        ],
      },
    },
  });
});

test('future notes remote apply target contract stays aligned with the local notes sync request boundary', () => {
  const spec = readTargetContractSpec();
  const syncSource = readFromWorkspace('packages', 'sdkwork-notes-pc-sync-commons', 'src', 'index.ts');

  [
    'idempotencyKey',
    'taskId',
    'entityType',
    'entityId',
    'operation',
    'localRevision',
    'baseRemoteCursor',
    'mutation',
  ].forEach((fieldName) => {
    assert.match(
      syncSource,
      new RegExp(`\\b${fieldName}:`, 'u'),
      `Expected NotesSyncRemoteApplyRequest to expose ${fieldName}.`,
    );
  });

  assert.match(syncSource, /idempotencyKey: task\.id,/u);
  assert.match(syncSource, /taskId: task\.id,/u);
  assert.match(syncSource, /entityType: task\.entityType,/u);
  assert.match(syncSource, /entityId: task\.entityId,/u);
  assert.match(syncSource, /operation: task\.operation,/u);
  assert.match(syncSource, /localRevision: task\.localRevision,/u);
  assert.match(syncSource, /baseRemoteCursor: task\.remoteCursor,/u);
  assert.match(syncSource, /mutation: cloneNotesSyncTaskMutation\(task\.mutation\),/u);

  assert.deepEqual(
    [...spec.request.requiredFields, ...spec.request.optionalFields],
    [
      'idempotencyKey',
      'taskId',
      'entityType',
      'entityId',
      'operation',
      'mutation',
      'localRevision',
      'baseRemoteCursor',
    ],
  );
});
