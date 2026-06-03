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
  return JSON.parse(
    readFromWorkspace('contracts', 'notes-remote-apply-app-sdk-result-adapter.contract.json'),
  );
}

function readServiceContractSpec() {
  const contractPath = path.resolve(
    workspaceRoot,
    'contracts',
    'notes-remote-apply-app-sdk-service.contract.json',
  );

  assert.equal(
    fs.existsSync(contractPath),
    true,
    `Expected shared wrapper service contract spec at ${contractPath}.`,
  );

  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

test('future notes remote apply shared wrapper service contract freezes the notes-core public adapter surface', () => {
  const spec = readServiceContractSpec();

  assert.deepEqual(spec, {
    owner: {
      family: 'notes-core-service',
      sharedWrapperPackage: '@sdkwork/notes-core',
      serviceFile: 'packages/sdkwork-notes-core/src/services/appNoteSyncService.ts',
      serviceExport: 'appNoteSyncService',
      serviceInterface: 'IAppNoteSyncService',
      serviceMethod: 'remoteApply',
      clientAccessor: 'getAppSdkClientWithSession',
      responseUnwrapper: 'unwrapAppSdkResponse',
    },
    input: {
      requestType: 'NotesSyncRemoteApplyRequest',
      noteIdSource: 'request.entityId',
      bodySource: 'request',
      constraints: [
        'request.entityType must remain note',
        'path noteId must match request.entityId',
      ],
    },
    output: {
      resultType: 'NotesSyncTaskExecutionResult',
      transportFailures: 'throw',
      semanticOutcomes: ['completed', 'conflict'],
    },
    sdkInvocation: {
      module: 'note',
      method: 'remoteApply',
      requestType: 'NoteRemoteApplyRequest',
      responseType: 'NoteRemoteApplyResultVO',
      callShape: 'client.note.remoteApply(request.entityId, request)',
    },
    mapping: {
      delegateToResultAdapterContract: 'notes-remote-apply-app-sdk-result-adapter.contract.json',
    },
    publicExports: {
      rootIndex: 'packages/sdkwork-notes-core/src/index.ts',
      servicesIndex: 'packages/sdkwork-notes-core/src/services/index.ts',
    },
    forbidden: [
      'wrapper-level direct-write fallback',
      'transport error swallowing',
      'request noteId/body entityId drift',
    ],
  });
});

test('future notes remote apply shared wrapper service contract stays aligned with the target contract, result adapter contract, and current notes-core service conventions', () => {
  const spec = readServiceContractSpec();
  const targetSpec = readTargetContractSpec();
  const resultAdapterSpec = readResultAdapterContractSpec();
  const syncSource = readFromWorkspace('packages', 'sdkwork-notes-sync', 'src', 'index.ts');
  const sdkSource = readFromWorkspace(
    'packages',
    'sdkwork-notes-core',
    'src',
    'sdk',
    'useAppSdkClient.ts',
  );
  const appSdkResultSource = readFromWorkspace(
    'packages',
    'sdkwork-notes-core',
    'src',
    'sdk',
    'appSdkResult.ts',
  );
  const appUserServiceSource = readFromWorkspace(
    'packages',
    'sdkwork-notes-core',
    'src',
    'services',
    'appUserService.ts',
  );

  assert.equal(spec.owner.clientAccessor, resultAdapterSpec.owner.clientAccessor);
  assert.equal(spec.sdkInvocation.module, targetSpec.sdk.module);
  assert.equal(spec.sdkInvocation.method, targetSpec.sdk.method);
  assert.equal(spec.sdkInvocation.requestType, targetSpec.sdk.requestType);
  assert.equal(spec.sdkInvocation.responseType, targetSpec.sdk.responseType);
  assert.equal(spec.output.transportFailures, targetSpec.response.transportFailures);
  assert.deepEqual(spec.output.semanticOutcomes, resultAdapterSpec.result.allowedLocalTypesFromSemanticResponse);
  assert.equal(
    spec.mapping.delegateToResultAdapterContract,
    'notes-remote-apply-app-sdk-result-adapter.contract.json',
  );

  assert.match(syncSource, /export interface NotesSyncRemoteApplyRequest/u);
  assert.match(syncSource, /export type NotesSyncTaskExecutionResult/u);
  assert.match(sdkSource, /export function getAppSdkClientWithSession/u);
  assert.match(appSdkResultSource, /export function unwrapAppSdkResponse/u);
  assert.match(appUserServiceSource, /getAppSdkClientWithSession/u);
  assert.match(appUserServiceSource, /unwrapAppSdkResponse/u);
  assert.match(appUserServiceSource, /const client = getAppSdkClientWithSession\(\);/u);
});
