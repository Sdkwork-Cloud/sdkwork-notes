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

function readClosureContractSpec() {
  return JSON.parse(
    readFromWorkspace('contracts', 'notes-remote-apply-app-sdk-upstream-closure.contract.json'),
  );
}

test('future notes remote apply upstream closure targets the local typed product app client port', () => {
  const spec = readClosureContractSpec();

  assert.deepEqual(spec.owner, {
    family: 'notes-product-app-client-port-closure',
    applicationRoot: 'sdkwork-notes/sdkwork-notes-pc-react',
    localPortFile: 'packages/sdkwork-notes-pc-core/src/sdk/appSdkPort.ts',
    runtimeFactory: 'packages/sdkwork-notes-pc-core/src/sdk/useAppSdkClient.ts#configureAppSdkClientFactory',
    futureSdkFamily: 'sdkwork-notes-app-sdk',
  });
  assert.deepEqual(spec.target, {
    module: 'note',
    method: 'remoteApply',
    requestType: 'NoteRemoteApplyRequest',
    responseType: 'NoteRemoteApplyResultVO',
    callShape: 'client.note.remoteApply(request.entityId, request)',
  });
  assert.equal(
    spec.closure.currentStatus,
    'composed client delegates remoteApply to sdkwork-notes-app-sdk generated pages API',
  );
  assert.deepEqual(spec.closure.forbiddenIntegration, [
    'retired generic app or backend SDK packages',
    'Spring legacy SDK source paths',
    'raw HTTP fallback',
    'manual auth headers in services',
  ]);
});

test('future notes remote apply closure stays aligned with target contract and local port files', () => {
  const spec = readClosureContractSpec();
  const targetSpec = readTargetContractSpec();
  const portSource = readFromWorkspace('packages', 'sdkwork-notes-core', 'src', 'sdk', 'appSdkPort.ts');
  const sdkSource = readFromWorkspace('packages', 'sdkwork-notes-core', 'src', 'sdk', 'useAppSdkClient.ts');

  assert.equal(spec.target.module, targetSpec.sdk.module);
  assert.equal(spec.target.method, targetSpec.sdk.method);
  assert.equal(spec.target.requestType, targetSpec.sdk.requestType);
  assert.equal(spec.target.responseType, targetSpec.sdk.responseType);
  assert.match(portSource, /export interface NotesRemoteAppClient/u);
  assert.match(portSource, /export interface NotesAppNoteClient/u);
  assert.match(sdkSource, /export function configureAppSdkClientFactory/u);
  assert.match(sdkSource, /SDKWork Notes product app client is not configured/u);

  [
    'retired generic app or backend SDK packages',
    'Spring legacy SDK source paths',
  ].forEach((description) => {
    assert.equal(spec.closure.forbiddenIntegration.includes(description), true);
  });
});
