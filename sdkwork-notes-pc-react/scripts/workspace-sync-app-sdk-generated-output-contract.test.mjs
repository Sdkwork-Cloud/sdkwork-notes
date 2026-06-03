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

function readUpstreamClosureContractSpec() {
  return JSON.parse(
    readFromWorkspace('contracts', 'notes-remote-apply-app-sdk-upstream-closure.contract.json'),
  );
}

function readGeneratedOutputContractSpec() {
  const contractPath = path.resolve(
    workspaceRoot,
    'contracts',
    'notes-remote-apply-app-sdk-generated-output.contract.json',
  );

  assert.equal(
    fs.existsSync(contractPath),
    true,
    `Expected generated output contract spec at ${contractPath}.`,
  );

  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

test('future notes remote apply generated output contract freezes the TypeScript SDK request, response, and result envelope surface', () => {
  const spec = readGeneratedOutputContractSpec();

  assert.deepEqual(spec, {
    owner: {
      family: 'app-sdk-generated-output',
      appApiRepository: 'spring-ai-plus-app-api',
      sdkPackageDirectory: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript',
      sdkApiFile: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/note.ts',
      typesIndexFile: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/index.ts',
    },
    request: {
      file: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-remote-apply-request.ts',
      export: 'NoteRemoteApplyRequest',
      requiredFields: [
        'idempotencyKey',
        'taskId',
        'entityType',
        'entityId',
        'operation',
        'mutation',
      ],
      optionalFields: [
        'localRevision',
        'baseRemoteCursor',
      ],
    },
    response: {
      modelFile: 'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/note-remote-apply-result-vo.ts',
      modelExport: 'NoteRemoteApplyResultVO',
      wrapperFile:
        'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/plus-api-result-note-remote-apply-result-vo.ts',
      wrapperExport: 'PlusApiResultNoteRemoteApplyResultVO',
      wrapperRequiredFields: [
        'data',
        'code',
        'msg',
        'requestId',
        'errorName',
      ],
      wrapperOptionalFields: [
        'ip',
        'hostname',
      ],
      outcomeField: 'outcome',
      appliedFields: [
        'taskId',
        'remoteCursor',
        'appliedAt',
      ],
      conflictFields: [
        'taskId',
        'remoteCursor',
        'conflict.code',
        'conflict.message',
        'conflict.occurredAt',
      ],
    },
    barrel: {
      expectedExports: [
        'NoteRemoteApplyRequest',
        'NoteRemoteApplyResultVO',
        'PlusApiResultNoteRemoteApplyResultVO',
      ],
    },
    apiBinding: {
      method: 'remoteApply',
      parameterType: 'NoteRemoteApplyRequest',
      returnType: 'PlusApiResultNoteRemoteApplyResultVO',
    },
    forbidden: [
      'remote apply reuses note-batch-update-request.ts',
      'remote apply reuses note-batch-update-result-vo.ts',
      'remote apply omits PlusApiResult envelope export',
    ],
  });
});

test('future notes remote apply generated output contract stays aligned with target and upstream closure contracts and remains absent from current generator output', () => {
  const spec = readGeneratedOutputContractSpec();
  const targetSpec = readTargetContractSpec();
  const upstreamClosureSpec = readUpstreamClosureContractSpec();
  const noteApiSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'api',
    'note.ts',
  );
  const typesIndexSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'index.ts',
  );
  const batchUpdateRequestSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'note-batch-update-request.ts',
  );
  const batchUpdateResultSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'note-batch-update-result-vo.ts',
  );
  const batchUpdateEnvelopeSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'plus-api-result-note-batch-update-result-vo.ts',
  );

  assert.equal(spec.request.export, targetSpec.sdk.requestType);
  assert.equal(spec.response.modelExport, targetSpec.sdk.responseType);
  assert.equal(spec.request.file, upstreamClosureSpec.generatedOutputs.requestTypeFile);
  assert.equal(spec.response.modelFile, upstreamClosureSpec.generatedOutputs.responseTypeFile);
  assert.equal(spec.owner.sdkApiFile, upstreamClosureSpec.generatedOutputs.sdkApiFile);
  assert.equal(spec.owner.typesIndexFile, 'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/index.ts');

  [spec.owner.sdkApiFile, spec.owner.typesIndexFile].forEach((relativePath) => {
    assert.equal(
      fs.existsSync(path.resolve(appApiRoot, relativePath)),
      true,
      `Expected app-api path ${relativePath} to exist for generated output closure.`,
    );
  });

  [spec.request.file, spec.response.modelFile, spec.response.wrapperFile].forEach((relativePath) => {
    assert.equal(
      fs.existsSync(path.resolve(appApiRoot, relativePath)),
      false,
      `Expected future generated output placeholder ${relativePath} to remain absent before upstream remote apply lands.`,
    );
  });

  assert.match(noteApiSource, /async batchUpdate\(noteId: string \| number, body: NoteBatchUpdateRequest\): Promise<PlusApiResultNoteBatchUpdateResultVO>/u);
  assert.match(batchUpdateRequestSource, /export interface NoteBatchUpdateRequest/u);
  assert.match(batchUpdateResultSource, /export interface NoteBatchUpdateResultVO/u);
  assert.match(batchUpdateEnvelopeSource, /export interface PlusApiResultNoteBatchUpdateResultVO/u);

  [
    spec.request.export,
    spec.response.modelExport,
    spec.response.wrapperExport,
  ].forEach((exportName) => {
    assert.equal(
      typesIndexSource.includes(exportName),
      false,
      `Expected current generated types barrel to remain missing ${exportName} before remote apply output generation lands.`,
    );
    assert.equal(
      noteApiSource.includes(exportName),
      false,
      `Expected current generated note API to remain missing ${exportName} before remote apply output generation lands.`,
    );
  });
});
