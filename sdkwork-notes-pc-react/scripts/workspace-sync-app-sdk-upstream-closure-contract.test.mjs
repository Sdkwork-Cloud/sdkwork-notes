import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const businessRoot = path.resolve(workspaceRoot, '..', '..', '..');
const appApiRoot = path.resolve(businessRoot, 'spring-ai-plus-app-api');

function readFromWorkspace(...segments) {
  return fs.readFileSync(path.resolve(workspaceRoot, ...segments), 'utf8');
}

function readFromAppApi(...segments) {
  return fs.readFileSync(path.resolve(appApiRoot, ...segments), 'utf8');
}

function readTargetContractSpec() {
  return JSON.parse(
    readFromWorkspace('contracts', 'notes-remote-apply-app-sdk-target.contract.json'),
  );
}

function readServiceContractSpec() {
  return JSON.parse(
    readFromWorkspace('contracts', 'notes-remote-apply-app-sdk-service.contract.json'),
  );
}

function readUpstreamClosureContractSpec() {
  const contractPath = path.resolve(
    workspaceRoot,
    'contracts',
    'notes-remote-apply-app-sdk-upstream-closure.contract.json',
  );

  assert.equal(
    fs.existsSync(contractPath),
    true,
    `Expected upstream closure contract spec at ${contractPath}.`,
  );

  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

test('future notes remote apply upstream closure contract freezes the app-api and generator handoff entrypoints', () => {
  const spec = readUpstreamClosureContractSpec();

  assert.deepEqual(spec, {
    owner: {
      family: 'app-sdk-contract-closure',
      appApiRepository: 'spring-ai-plus-app-api',
      controllerFile:
        'src/main/java/com/sdkwork/ai/gateway/api/app/v3/notes/NotesAppApiController.java',
      sdkReadme: 'sdkwork-sdk-app/README.md',
      sdkOpenApiSnapshot: 'sdkwork-sdk-app/app-openapi-8080.json',
      sdkUpgradeDirectory: 'sdkwork-sdk-app/upgrade',
      sdkPackageDirectory: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript',
    },
    target: {
      controllerMethod: 'remoteApply',
      sdkModule: 'note',
      sdkMethod: 'remoteApply',
      routeAliases: [
        'POST /app/v3/api/notes/{noteId}:remoteApply',
        'POST /app/v3/api/notes/{noteId}/remote-apply',
      ],
    },
    generatedOutputs: {
      sdkEntrypoint: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/sdk.ts',
      sdkApiFile: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/note.ts',
      requestTypeFile: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-remote-apply-request.ts',
      responseTypeFile: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-remote-apply-result-vo.ts',
    },
    regenWorkflow: {
      baseSnapshotCommand:
        'curl http://localhost:8080/v3/api-docs/app -o spring-ai-plus-app-api/sdkwork-sdk-app/app-openapi-8080.json',
      prepareSourceScript: 'sdkwork-sdk-app/bin/prepare-openapi-source.mjs',
      upgradeOverlayDirectory: 'sdkwork-sdk-app/upgrade',
    },
    blockingFacts: [
      'NotesAppApiController currently has no remoteApply method',
      'TypeScript SDK currently has no note.remoteApply surface',
      'generated remote apply request/result types do not exist yet',
    ],
    forbidden: [
      'app-local handwritten remote apply HTTP client',
      'shared-wrapper fake success fallback',
      'direct-write API remapping as replay transport',
    ],
  });
});

test('future notes remote apply upstream closure contract stays aligned with the current target contract, service contract, and app-api generator facts', () => {
  const spec = readUpstreamClosureContractSpec();
  const targetSpec = readTargetContractSpec();
  const serviceSpec = readServiceContractSpec();
  const readmeSource = readFromAppApi('sdkwork-sdk-app', 'README.md');
  const controllerSource = readFromAppApi(
    'src',
    'main',
    'java',
    'com',
    'sdkwork',
    'ai',
    'gateway',
    'api',
    'app',
    'v3',
    'notes',
    'NotesAppApiController.java',
  );
  const sdkEntrypointSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'sdk.ts',
  );
  const sdkApiSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'api',
    'note.ts',
  );

  assert.equal(spec.target.controllerMethod, targetSpec.sdk.method);
  assert.equal(spec.target.sdkModule, targetSpec.sdk.module);
  assert.equal(spec.target.sdkMethod, targetSpec.sdk.method);
  assert.deepEqual(spec.target.routeAliases, targetSpec.controller.paths);
  assert.equal(spec.target.sdkMethod, serviceSpec.sdkInvocation.method);
  assert.equal(spec.target.sdkModule, serviceSpec.sdkInvocation.module);

  const appApiPaths = [
    spec.owner.controllerFile,
    spec.owner.sdkReadme,
    spec.owner.sdkOpenApiSnapshot,
    spec.owner.sdkPackageDirectory,
    spec.generatedOutputs.sdkEntrypoint,
    spec.generatedOutputs.sdkApiFile,
  ];

  appApiPaths.forEach((relativePath) => {
    assert.equal(
      fs.existsSync(path.resolve(appApiRoot, relativePath)),
      true,
      `Expected app-api path ${relativePath} to exist for the future closure path.`,
    );
  });

  [spec.generatedOutputs.requestTypeFile, spec.generatedOutputs.responseTypeFile].forEach((relativePath) => {
    assert.equal(
      fs.existsSync(path.resolve(appApiRoot, relativePath)),
      false,
      `Expected generated remote apply type placeholder ${relativePath} to remain absent before upstream closure lands.`,
    );
  });

  assert.match(
    readmeSource,
    /curl http:\/\/localhost:8080\/v3\/api-docs\/app -o spring-ai-plus-app-api\/sdkwork-sdk-app\/app-openapi-8080\.json/u,
  );
  assert.match(readmeSource, /prepare-openapi-source\.mjs/u);
  assert.match(sdkEntrypointSource, /public readonly note: NoteApi;/u);
  assert.match(sdkApiSource, /export class NoteApi/u);

  ['remoteApply', ':remoteApply', '/remote-apply'].forEach((marker) => {
    assert.equal(
      `${controllerSource}\n${sdkEntrypointSource}\n${sdkApiSource}`.includes(marker),
      false,
      `Expected current upstream sources to remain missing ${marker} before the real closure lands.`,
    );
  });
});
