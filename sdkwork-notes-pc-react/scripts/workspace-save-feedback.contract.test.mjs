import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const workspaceRoot = process.cwd();

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

async function loadWorkspaceSaveFeedbackModule() {
  const entryPoint = path.resolve(
    workspaceRoot,
    'packages/sdkwork-notes-notes/src/services/noteWorkspaceSaveFeedback.ts',
  );
  const source = await readFile(entryPoint, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  });

  return import(createDataModuleUrl(transpiled.outputText));
}

const workspaceSaveFeedbackModule = await loadWorkspaceSaveFeedbackModule();

test('save feedback runtime models retrying and recovered states as a first-class save state machine', () => {
  assert.equal(
    workspaceSaveFeedbackModule.resolveNotesWorkspaceSaveRequestState('dirty'),
    'saving',
  );
  assert.equal(
    workspaceSaveFeedbackModule.resolveNotesWorkspaceSaveRequestState('error'),
    'retrying',
  );
  assert.equal(
    workspaceSaveFeedbackModule.resolveNotesWorkspaceSaveSuccessState('saving'),
    'saved',
  );
  assert.equal(
    workspaceSaveFeedbackModule.resolveNotesWorkspaceSaveSuccessState('retrying'),
    'recovered',
  );
  assert.equal(
    workspaceSaveFeedbackModule.resolveNotesWorkspaceSaveSuccessState('error'),
    'recovered',
  );

  const errorFeedback = workspaceSaveFeedbackModule.buildNotesWorkspaceSaveFeedbackModel({
    saveState: 'error',
    errorMessage: 'Save failed',
  });
  assert.deepEqual(errorFeedback, {
    statusKey: 'notes.editor.status.error',
    canManualSave: true,
    isBusy: false,
    bannerMessage: 'Save failed',
    retryAvailable: true,
  });

  const retryingFeedback = workspaceSaveFeedbackModule.buildNotesWorkspaceSaveFeedbackModel({
    saveState: 'retrying',
    errorMessage: null,
  });
  assert.deepEqual(retryingFeedback, {
    statusKey: 'notes.editor.status.retrying',
    canManualSave: false,
    isBusy: true,
    bannerMessage: null,
    retryAvailable: false,
  });

  const recoveredFeedback = workspaceSaveFeedbackModule.buildNotesWorkspaceSaveFeedbackModel({
    saveState: 'recovered',
    errorMessage: null,
  });
  assert.deepEqual(recoveredFeedback, {
    statusKey: 'notes.editor.status.recovered',
    canManualSave: false,
    isBusy: false,
    bannerMessage: null,
    retryAvailable: false,
  });
});

test('workspace save feedback boundary centralizes recovery semantics across store, editor, and error banner', () => {
  const servicesIndexSource = read('packages/sdkwork-notes-notes/src/services/index.ts');
  const storeSource = read('packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts');
  const editorSource = read('packages/sdkwork-notes-notes/src/components/NoteEditorPane.tsx');
  const pageSource = read('packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx');
  const errorBannerSource = read('packages/sdkwork-notes-notes/src/components/NotesWorkspaceErrorBanner.tsx');

  assert.match(servicesIndexSource, /noteWorkspaceSaveFeedback/);

  assert.match(storeSource, /resolveNotesWorkspaceSaveRequestState/);
  assert.match(storeSource, /resolveNotesWorkspaceSaveSuccessState/);

  assert.match(editorSource, /buildNotesWorkspaceSaveFeedbackModel/);
  assert.match(pageSource, /buildNotesWorkspaceSaveFeedbackModel/);
  assert.match(pageSource, /retryLabel=\{t\('notes\.actions\.retrySave'\)\}/);
  assert.match(pageSource, /onRetry=\{saveFeedback\.retryAvailable \? flushDraft : undefined\}/);

  assert.match(errorBannerSource, /retryLabel\?: string/);
  assert.match(errorBannerSource, /onRetry\?: \(\) => void/);
  assert.match(errorBannerSource, /retryLabel && onRetry/);

  assert.doesNotMatch(editorSource, /saveState === 'dirty' \|\| saveState === 'error'/);
  assert.doesNotMatch(editorSource, /saveState === 'saving'/);
});
