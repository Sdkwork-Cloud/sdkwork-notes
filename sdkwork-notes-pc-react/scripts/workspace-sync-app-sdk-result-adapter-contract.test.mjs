import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function readFromWorkspace(...segments) {
  return fs.readFileSync(path.resolve(workspaceRoot, ...segments), 'utf8');
}

function readTargetContractSpec() {
  return JSON.parse(
    readFromWorkspace('contracts', 'notes-remote-apply-app-sdk-target.contract.json'),
  );
}

function readResultAdapterContractSpec() {
  const contractPath = path.resolve(
    workspaceRoot,
    'contracts',
    'notes-remote-apply-app-sdk-result-adapter.contract.json',
  );

  assert.equal(
    fs.existsSync(contractPath),
    true,
    `Expected upstream result adapter contract spec at ${contractPath}.`,
  );

  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

test('future notes remote apply result adapter contract freezes the shared wrapper ownership and semantic mapping', () => {
  const spec = readResultAdapterContractSpec();

  assert.deepEqual(spec, {
    owner: {
      family: 'typescript-wrapper',
      sharedWrapperPackage: '@sdkwork/notes-pc-core',
      clientAccessor: 'getAppSdkClientWithSession',
      sdkMethod: 'note.remoteApply',
    },
    input: {
      noteIdSource: 'request.entityId',
      requestType: 'NoteRemoteApplyRequest',
    },
    result: {
      allowedLocalTypesFromSemanticResponse: ['completed', 'conflict'],
      applied: {
        localType: 'completed',
        atField: 'appliedAt',
        remoteCursorField: 'remoteCursor',
      },
      conflict: {
        localType: 'conflict',
        atField: 'conflict.occurredAt',
        messageField: 'conflict.message',
        code: {
          passthrough: [
            'stale-base-version',
            'deleted-remotely',
            'folder-structure-changed',
          ],
          fallback: 'unknown',
        },
      },
    },
    transportFailures: {
      mode: 'throw',
      workerFallback: {
        localType: 'failed',
        code: 'unknown',
        retryable: true,
      },
    },
    forbidden: [
      'semantic failed outcome payload',
      'wrapper-level direct-write fallback',
      'request.body.entityId drift from path noteId',
    ],
  });
});

test('future notes remote apply result adapter contract stays aligned with the target contract and local sync worker semantics', () => {
  const spec = readResultAdapterContractSpec();
  const targetSpec = readTargetContractSpec();
  const syncSource = readFromWorkspace('packages', 'sdkwork-notes-sync', 'src', 'index.ts');

  assert.equal(spec.owner.sdkMethod, `${targetSpec.sdk.module}.${targetSpec.sdk.method}`);
  assert.equal(spec.input.requestType, targetSpec.sdk.requestType);
  assert.equal(spec.transportFailures.mode, targetSpec.response.transportFailures);

  assert.match(syncSource, /type: 'completed'/u);
  assert.match(syncSource, /type: 'conflict'/u);
  assert.match(syncSource, /type: 'failed'/u);
  assert.match(syncSource, /code: 'unknown'/u);
  assert.match(syncSource, /retryable: true/u);
  assert.match(syncSource, /'stale-base-version'/u);
  assert.match(syncSource, /'deleted-remotely'/u);
  assert.match(syncSource, /'folder-structure-changed'/u);

  assert.deepEqual(spec.result.allowedLocalTypesFromSemanticResponse, ['completed', 'conflict']);
  assert.equal(spec.result.allowedLocalTypesFromSemanticResponse.includes('failed'), false);

  assert.equal(
    targetSpec.response.outcomes.applied.requiredFields.includes(spec.result.applied.atField),
    true,
  );
  assert.equal(
    targetSpec.response.outcomes.applied.requiredFields.includes(spec.result.applied.remoteCursorField),
    true,
  );
  assert.equal(
    targetSpec.response.outcomes.conflict.requiredFields.includes(spec.result.conflict.atField),
    true,
  );
  assert.equal(
    targetSpec.response.outcomes.conflict.requiredFields.includes(spec.result.conflict.messageField),
    true,
  );

  assert.deepEqual(spec.result.conflict.code.passthrough, [
    'stale-base-version',
    'deleted-remotely',
    'folder-structure-changed',
  ]);
  assert.equal(spec.result.conflict.code.fallback, 'unknown');
  assert.equal(spec.transportFailures.workerFallback.localType, 'failed');
  assert.equal(spec.transportFailures.workerFallback.code, 'unknown');
  assert.equal(spec.transportFailures.workerFallback.retryable, true);
});
