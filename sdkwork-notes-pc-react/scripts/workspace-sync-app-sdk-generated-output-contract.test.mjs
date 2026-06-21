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

function readGeneratedOutputContractSpec() {
  return JSON.parse(
    readFromWorkspace('contracts', 'notes-remote-apply-app-sdk-generated-output.contract.json'),
  );
}

test('future notes remote apply generated output contract resolves to application-root SDK ownership', () => {
  const spec = readGeneratedOutputContractSpec();

  assert.deepEqual(spec.owner, {
    family: 'notes-product-app-client-port-generated-output',
    applicationRoot: 'sdkwork-notes/sdkwork-notes-pc-react',
    localPortFile: 'packages/sdkwork-notes-pc-core/src/sdk/appSdkPort.ts',
    futureSdkFamily: 'sdkwork-notes-app-sdk',
    futureGeneratedTransport: 'sdks/sdkwork-notes-app-sdk/sdkwork-notes-app-sdk-typescript/generated/server-openapi',
  });
  assert.deepEqual(spec.generatedOutputRule.whenGenerated, [
    'generated output must live under the application root SDK family',
    'generated transport must not import dependency SDK packages',
    'services must continue to depend on the typed client port or approved composed facade',
  ]);
});

test('future generated output contract stays aligned with target method and local typed port', () => {
  const spec = readGeneratedOutputContractSpec();
  const targetSpec = readTargetContractSpec();
  const portSource = readFromWorkspace('packages', 'sdkwork-notes-pc-core', 'src', 'sdk', 'appSdkPort.ts');

  assert.equal(spec.typedPort.clientInterface, 'NotesRemoteAppClient');
  assert.equal(spec.typedPort.noteModule, 'NotesAppNoteClient');
  assert.equal(spec.typedPort.remoteApplyMethod, targetSpec.sdk.method);
  assert.equal(spec.typedPort.requestType, targetSpec.sdk.requestType);
  assert.equal(spec.typedPort.responseType, targetSpec.sdk.responseType);
  assert.match(portSource, /export interface NotesRemoteAppClient/u);
  assert.match(portSource, /export interface NotesAppNoteClient/u);

  [
    'legacy generic SDK generated package roots',
    'Spring legacy SDK source paths',
    'hand-edited generated transport',
  ].forEach((description) => {
    assert.equal(spec.generatedOutputRule.forbidden.includes(description), true);
  });
});
