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

test('shared app sdk note surface still lacks a semantic remote apply entry', () => {
  const wrapperSource = readFromWorkspace(
    'packages',
    'sdkwork-notes-core',
    'src',
    'sdk',
    'useAppSdkClient.ts',
  );
  const sdkSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'sdk.ts',
  );
  const noteApiSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'api',
    'note.ts',
  );
  const combinedSource = `${wrapperSource}\n${sdkSource}\n${noteApiSource}`;

  assert.match(sdkSource, /public readonly note: NoteApi;/u);
  assert.match(noteApiSource, /async batchUpdate\(noteId: string \| number, body: NoteBatchUpdateRequest\)/u);

  const forbiddenRemoteApplyMarkers = [
    'notesSync',
    'noteSync',
    'syncApply',
    'applySync',
    'remoteApply',
    'replayMutation',
    'applyMutation',
    'applyRemoteMutation',
  ];

  forbiddenRemoteApplyMarkers.forEach((marker) => {
    assert.equal(
      combinedSource.includes(marker),
      false,
      `Expected shared note SDK surface to avoid exposing ${marker} before the real replay-safe contract lands.`,
    );
  });
});

test('note sdk request models still miss replay-safe sync transport fields', () => {
  const createRequestSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'note-create-request.ts',
  );
  const updateRequestSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'note-update-request.ts',
  );
  const contentUpdateRequestSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'note-content-update-request.ts',
  );
  const moveRequestSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'note-move-request.ts',
  );
  const batchUpdateRequestSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'note-batch-update-request.ts',
  );
  const batchOperationRequestSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'note-batch-operation-request.ts',
  );
  const batchUpdateResultSource = readFromAppApi(
    'sdkwork-sdk-app',
    'sdkwork-app-sdk-typescript',
    'src',
    'types',
    'note-batch-update-result-vo.ts',
  );

  assert.match(contentUpdateRequestSource, /expectedVersionId\?: string;/u);
  assert.match(batchUpdateRequestSource, /expectedVersionId\?: string;/u);
  assert.match(batchUpdateRequestSource, /strict\?: boolean;/u);
  assert.match(batchUpdateRequestSource, /requests: NoteBatchOperationRequest\[\];/u);

  const requestSources = [
    createRequestSource,
    updateRequestSource,
    contentUpdateRequestSource,
    moveRequestSource,
    batchUpdateRequestSource,
    batchOperationRequestSource,
  ];

  ['idempotencyKey', 'localRevision', 'baseRemoteCursor', 'mutation'].forEach((fieldName) => {
    requestSources.forEach((source) => {
      assert.equal(
        source.includes(fieldName),
        false,
        `Expected note request contracts to remain missing ${fieldName} until the real remote apply transport is defined.`,
      );
    });
  });

  assert.equal(
    batchUpdateResultSource.includes('remoteCursor'),
    false,
    'Expected note batch update result to omit remoteCursor before replay acknowledgements exist.',
  );
});

test('notes app controller still treats batch update as text versioning instead of sync replay transport', () => {
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
  const readmeSource = readFromAppApi(
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
    'README.md',
  );

  assert.match(
    controllerSource,
    /TextBatchApplyResult applyResult = textBatchOperationService\.applyBatch\(sourceText, request\.getRequests\(\), strict\);/u,
  );
  assert.match(readmeSource, /`POST :batchUpdate` supports optional `expectedVersionId`\./u);

  ['idempotencyKey', 'localRevision', 'baseRemoteCursor', 'remoteCursor'].forEach((fieldName) => {
    assert.equal(
      controllerSource.includes(fieldName),
      false,
      `Expected notes controller to remain missing ${fieldName} before the replay-safe remote apply contract is implemented.`,
    );
  });
});
