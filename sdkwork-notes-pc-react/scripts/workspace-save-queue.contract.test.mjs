import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const workspaceRoot = process.cwd();
const workspaceSaveQueueModulePath = 'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceSaveQueue.ts';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

function createSummary(id, title, overrides = {}) {
  return {
    id,
    uuid: `uuid-${id}`,
    title,
    type: 'doc',
    parentId: null,
    tags: [],
    isFavorite: false,
    snippet: `${title} summary`,
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T12:00:00Z',
    ...overrides,
  };
}

function createNote(id, title, overrides = {}) {
  return {
    ...createSummary(id, title),
    content: `${title} content`,
    ...overrides,
  };
}

async function loadWorkspaceSaveQueueModule() {
  const entryPoint = path.resolve(workspaceRoot, workspaceSaveQueueModulePath);
  assert.equal(fs.existsSync(entryPoint), true, 'Expected noteWorkspaceSaveQueue.ts to exist.');

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

test('workspace save queue runtime exists and is exported from the services boundary', async () => {
  assert.equal(
    fs.existsSync(path.join(workspaceRoot, workspaceSaveQueueModulePath)),
    true,
    'Expected noteWorkspaceSaveQueue.ts to exist.',
  );

  const servicesIndexSource = read('packages/sdkwork-notes-pc-notes/src/services/index.ts');
  assert.match(servicesIndexSource, /noteWorkspaceSaveQueue/);

  const workspaceSaveQueueModule = await loadWorkspaceSaveQueueModule();
  assert.equal(typeof workspaceSaveQueueModule.createNotesWorkspaceSaveQueue, 'function');
  assert.equal(typeof workspaceSaveQueueModule.resolveNotesWorkspaceSaveCompletion, 'function');
});

test('save queue serializes in-flight saves and coalesces replay requests into one follow-up run', async () => {
  const workspaceSaveQueueModule = await loadWorkspaceSaveQueueModule();
  const saveQueue = workspaceSaveQueueModule.createNotesWorkspaceSaveQueue();

  let resolveFirstSave;
  const firstSave = new Promise((resolve) => {
    resolveFirstSave = resolve;
  });
  let saveRuns = 0;

  const request = saveQueue.run(async () => {
    saveRuns += 1;
    if (saveRuns === 1) {
      await firstSave;
    }
    return true;
  });

  assert.equal(saveQueue.hasActiveRequest(), true);

  const replayOne = saveQueue.requestReplay();
  const replayTwo = saveQueue.requestReplay();

  resolveFirstSave();

  const [requestResult, replayOneResult, replayTwoResult] = await Promise.all([
    request,
    replayOne,
    replayTwo,
  ]);

  assert.equal(requestResult, true);
  assert.equal(replayOneResult, true);
  assert.equal(replayTwoResult, true);
  assert.equal(saveRuns, 2);
  assert.equal(saveQueue.hasActiveRequest(), false);
});

test('save queue stops replaying when the active save fails', async () => {
  const workspaceSaveQueueModule = await loadWorkspaceSaveQueueModule();
  const saveQueue = workspaceSaveQueueModule.createNotesWorkspaceSaveQueue();

  let saveRuns = 0;
  const result = await saveQueue.run(async () => {
    saveRuns += 1;
    if (saveRuns === 1) {
      void saveQueue.requestReplay();
      return false;
    }
    return true;
  });

  assert.equal(result, false);
  assert.equal(saveRuns, 1);
  assert.equal(saveQueue.hasActiveRequest(), false);
});

test('save completion keeps newer draft edits dirty while still advancing the persisted snapshot', async () => {
  const workspaceSaveQueueModule = await loadWorkspaceSaveQueueModule();
  const requestedActiveNote = createNote('note-1', 'Architecture review', {
    content: 'Saved draft body',
    updatedAt: '2026-03-30T12:00:00Z',
  });
  const currentActiveNote = createNote('note-1', 'Architecture review', {
    content: 'Saved draft body plus unsaved suffix',
    updatedAt: '2026-03-30T12:00:05Z',
  });
  const savedSummary = createSummary('note-1', 'Architecture review', {
    snippet: 'Saved draft body',
    updatedAt: '2026-03-30T12:00:10Z',
  });

  const completion = workspaceSaveQueueModule.resolveNotesWorkspaceSaveCompletion({
    currentActiveNote,
    requestedActiveNote,
    savedSummary,
    successSaveState: 'saved',
    mergeSummaryIntoNote: (note, summary) => ({
      ...note,
      ...summary,
      content: note.content,
      snippet: summary.snippet,
    }),
  });

  assert.deepEqual(completion, {
    persistedActiveNote: {
      ...requestedActiveNote,
      ...savedSummary,
      content: requestedActiveNote.content,
      snippet: savedSummary.snippet,
    },
    activeNote: currentActiveNote,
    saveState: 'dirty',
  });
});

test('save completion returns the success state when no newer draft edits arrived during the request', async () => {
  const workspaceSaveQueueModule = await loadWorkspaceSaveQueueModule();
  const requestedActiveNote = createNote('note-1', 'Architecture review', {
    content: 'Saved draft body',
    updatedAt: '2026-03-30T12:00:00Z',
  });
  const savedSummary = createSummary('note-1', 'Architecture review', {
    snippet: 'Saved draft body',
    updatedAt: '2026-03-30T12:00:10Z',
  });

  const completion = workspaceSaveQueueModule.resolveNotesWorkspaceSaveCompletion({
    currentActiveNote: requestedActiveNote,
    requestedActiveNote,
    savedSummary,
    successSaveState: 'recovered',
    mergeSummaryIntoNote: (note, summary) => ({
      ...note,
      ...summary,
      content: note.content,
      snippet: summary.snippet,
    }),
  });

  assert.deepEqual(completion, {
    persistedActiveNote: {
      ...requestedActiveNote,
      ...savedSummary,
      content: requestedActiveNote.content,
      snippet: savedSummary.snippet,
    },
    activeNote: {
      ...requestedActiveNote,
      ...savedSummary,
      content: requestedActiveNote.content,
      snippet: savedSummary.snippet,
    },
    saveState: 'recovered',
  });
});

test('workspace store consumes the save queue for in-flight waits, replay requests, and save completion', () => {
  const storeSource = read('packages/sdkwork-notes-pc-notes/src/store/useNotesWorkspaceStore.ts');

  assert.match(storeSource, /createNotesWorkspaceSaveQueue/);
  assert.match(storeSource, /resolveNotesWorkspaceSaveCompletion/);
  assert.match(storeSource, /const activeNoteSaveQueue = createNotesWorkspaceSaveQueue\(\);/);
  assert.match(
    storeSource,
    /if \(saveState === 'saving' \|\| saveState === 'retrying'\) \{\s*return activeNoteSaveQueue\.waitForActiveRequest\(\);\s*\}/s,
  );
  assert.match(
    storeSource,
    /if \(activeNoteSaveQueue\.hasActiveRequest\(\)\) \{\s*if \(saveState === 'dirty' \|\| saveState === 'error'\) \{\s*return activeNoteSaveQueue\.requestReplay\(\);\s*\}\s*return activeNoteSaveQueue\.waitForActiveRequest\(\);\s*\}/s,
  );
  assert.match(storeSource, /return activeNoteSaveQueue\.run\(async \(\) => \{/);
  assert.match(storeSource, /const completion = resolveNotesWorkspaceSaveCompletion\(\{/);
});
