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

async function loadWorkspaceAutosaveRuntimeModule() {
  const entryPoint = path.resolve(
    workspaceRoot,
    'packages/sdkwork-notes-notes/src/services/noteWorkspaceAutosaveRuntime.ts',
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

const workspaceAutosaveRuntimeModule = await loadWorkspaceAutosaveRuntimeModule();

test('autosave visibility runtime flushes only when the page is hidden and the plan allows flush', () => {
  const events = [];
  let hidden = false;
  let visibilityHandler = null;

  const noopCleanup = workspaceAutosaveRuntimeModule.bindNotesWorkspaceVisibilityAutosave(
    {
      shouldSchedule: false,
      shouldFlushOnPageHide: false,
      delayMs: null,
    },
    {
      bindVisibilityChange: (handler) => {
        visibilityHandler = handler;
        events.push('bind');
        return () => events.push('cleanup:bind');
      },
      isDocumentHidden: () => hidden,
      flushDraft: () => events.push('flush'),
    },
  );

  noopCleanup();
  visibilityHandler?.();

  const cleanup = workspaceAutosaveRuntimeModule.bindNotesWorkspaceVisibilityAutosave(
    {
      shouldSchedule: true,
      shouldFlushOnPageHide: true,
      delayMs: 700,
    },
    {
      bindVisibilityChange: (handler) => {
        visibilityHandler = handler;
        events.push('bind');
        return () => events.push('cleanup:bind');
      },
      isDocumentHidden: () => hidden,
      flushDraft: () => events.push('flush'),
    },
  );

  hidden = false;
  visibilityHandler?.();
  hidden = true;
  visibilityHandler?.();
  cleanup();

  assert.deepEqual(events, [
    'bind',
    'flush',
    'cleanup:bind',
  ]);
});

test('workspace page binds autosave visibility flush through the shared runtime boundary', () => {
  const pageSource = read('packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx');

  assert.match(pageSource, /bindNotesWorkspaceVisibilityAutosave/);
  assert.match(pageSource, /document\.addEventListener\('visibilitychange', handler\)/);
  assert.match(pageSource, /document\.removeEventListener\('visibilitychange', handler\)/);
  assert.match(pageSource, /document\.visibilityState === 'hidden'/);
});
