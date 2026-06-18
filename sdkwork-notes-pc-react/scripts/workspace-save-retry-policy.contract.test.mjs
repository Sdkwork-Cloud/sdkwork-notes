import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const workspaceRoot = process.cwd();
const workspaceSaveRetryPolicyModulePath =
  'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceSaveRetryPolicy.ts';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

async function loadWorkspaceSaveRetryPolicyModule() {
  const entryPoint = path.resolve(workspaceRoot, workspaceSaveRetryPolicyModulePath);
  assert.equal(fs.existsSync(entryPoint), true, 'Expected noteWorkspaceSaveRetryPolicy.ts to exist.');

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

test('workspace save retry policy exists, is exported from the services boundary, and declares the observability package dependency', async () => {
  assert.equal(
    fs.existsSync(path.join(workspaceRoot, workspaceSaveRetryPolicyModulePath)),
    true,
    'Expected noteWorkspaceSaveRetryPolicy.ts to exist.',
  );

  const servicesIndexSource = read('packages/sdkwork-notes-pc-notes/src/services/index.ts');
  assert.match(servicesIndexSource, /noteWorkspaceSaveRetryPolicy/);

  const notesPackage = JSON.parse(read('packages/sdkwork-notes-pc-notes/package.json'));
  assert.equal(notesPackage.dependencies?.['@sdkwork/notes-pc-observability'], 'workspace:*');

  const workspaceSaveRetryPolicyModule = await loadWorkspaceSaveRetryPolicyModule();
  assert.equal(typeof workspaceSaveRetryPolicyModule.createNotesWorkspaceSaveRetryPolicy, 'function');
  assert.deepEqual(workspaceSaveRetryPolicyModule.DEFAULT_NOTES_WORKSPACE_SAVE_RETRY_DELAYS_MS, [500, 1500]);
});

test('save retry policy exposes a deterministic backoff schedule and a fixed retry cap', async () => {
  const workspaceSaveRetryPolicyModule = await loadWorkspaceSaveRetryPolicyModule();
  const retryPolicy = workspaceSaveRetryPolicyModule.createNotesWorkspaceSaveRetryPolicy();

  assert.deepEqual(retryPolicy.retryDelaysMs, [500, 1500]);
  assert.equal(retryPolicy.getMaximumRetryCount(), 2);
  assert.equal(retryPolicy.resolveNextRetryDelay(1), 500);
  assert.equal(retryPolicy.resolveNextRetryDelay(2), 1500);
  assert.equal(retryPolicy.resolveNextRetryDelay(3), null);
  assert.equal(retryPolicy.resolveNextRetryDelay(0), null);
});

test('save retry policy records retry scheduling, recovery, and retry exhaustion telemetry events', async () => {
  const workspaceSaveRetryPolicyModule = await loadWorkspaceSaveRetryPolicyModule();
  const events = [];
  const retryPolicy = workspaceSaveRetryPolicyModule.createNotesWorkspaceSaveRetryPolicy({
    telemetrySink: {
      record(event) {
        events.push(event);
      },
    },
  });

  await retryPolicy.recordRetryScheduled({
    noteId: 'note-1',
    retryAttempt: 1,
    retryDelayMs: 500,
    maxRetryCount: 2,
    errorMessage: 'network unavailable',
  });
  await retryPolicy.recordRetryRecovered({
    noteId: 'note-1',
    retryAttempt: 1,
    maxRetryCount: 2,
  });
  await retryPolicy.recordRetryExhausted({
    noteId: 'note-1',
    retryAttempt: 2,
    maxRetryCount: 2,
    errorMessage: 'gateway timeout',
  });

  assert.deepEqual(events, [
    {
      name: 'notes.workspace.save.retry.scheduled',
      level: 'warn',
      attributes: {
        noteId: 'note-1',
        retryAttempt: 1,
        retryDelayMs: 500,
        maxRetryCount: 2,
        errorMessage: 'network unavailable',
      },
    },
    {
      name: 'notes.workspace.save.retry.recovered',
      level: 'info',
      attributes: {
        noteId: 'note-1',
        retryAttempt: 1,
        maxRetryCount: 2,
      },
    },
    {
      name: 'notes.workspace.save.retry.exhausted',
      level: 'error',
      attributes: {
        noteId: 'note-1',
        retryAttempt: 2,
        maxRetryCount: 2,
        errorMessage: 'gateway timeout',
      },
    },
  ]);
});

test('workspace store consumes the retry policy for automatic backoff, recovery telemetry, and capped terminal failures', () => {
  const storeSource = read('packages/sdkwork-notes-pc-notes/src/store/useNotesWorkspaceStore.ts');

  assert.match(storeSource, /createNotesWorkspaceSaveRetryPolicy/);
  assert.match(
    storeSource,
    /const activeNoteSaveRetryPolicy = dependencies\.saveRetryPolicy \?\? createNotesWorkspaceSaveRetryPolicy\(\);/,
  );
  assert.match(storeSource, /let retryAttempt = 0;/);
  assert.match(storeSource, /retryAttempt \+= 1;/);
  assert.match(storeSource, /const retryDelayMs = activeNoteSaveRetryPolicy\.resolveNextRetryDelay\(retryAttempt\);/);
  assert.match(storeSource, /await activeNoteSaveRetryPolicy\.recordRetryScheduled\(\{/);
  assert.match(storeSource, /await delayMilliseconds\(retryDelayMs\);/);
  assert.match(storeSource, /await activeNoteSaveRetryPolicy\.recordRetryRecovered\(\{/);
  assert.match(storeSource, /await activeNoteSaveRetryPolicy\.recordRetryExhausted\(\{/);
  assert.match(
    storeSource,
    /if \(retryDelayMs === null\) \{\s*await activeNoteSaveRetryPolicy\.recordRetryExhausted\(\{[\s\S]*?saveState: 'error',[\s\S]*?return false;\s*\}/s,
  );
  assert.match(storeSource, /saveState: 'retrying'/);
});
