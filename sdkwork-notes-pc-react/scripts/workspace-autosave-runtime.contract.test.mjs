import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceAutosaveRuntimeModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceAutosaveRuntime.ts',
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

test('autosave runtime schedules delayed flush only when the autosave plan enables scheduling', () => {
  const events = [];

  const noopCleanup = workspaceAutosaveRuntimeModule.scheduleNotesWorkspaceAutosave(
    {
      shouldSchedule: false,
      shouldFlushOnPageHide: false,
      delayMs: null,
    },
    {
      scheduleTimeout: () => {
        events.push('schedule');
        return () => events.push('cleanup:schedule');
      },
      flushDraft: () => events.push('flush'),
    },
  );

  noopCleanup();

  const cleanup = workspaceAutosaveRuntimeModule.scheduleNotesWorkspaceAutosave(
    {
      shouldSchedule: true,
      shouldFlushOnPageHide: true,
      delayMs: 700,
    },
    {
      scheduleTimeout: (delayMs, callback) => {
        events.push(`schedule:${delayMs}`);
        callback();
        return () => events.push('cleanup:schedule');
      },
      flushDraft: () => events.push('flush'),
    },
  );

  cleanup();

  assert.deepEqual(events, [
    'schedule:700',
    'flush',
    'cleanup:schedule',
  ]);
});

test('autosave runtime binds pagehide flush only when the autosave plan requires it', () => {
  const events = [];
  let pageHideHandler = null;

  const noopCleanup = workspaceAutosaveRuntimeModule.bindNotesWorkspacePageHideAutosave(
    {
      shouldSchedule: false,
      shouldFlushOnPageHide: false,
      delayMs: null,
    },
    {
      bindPageHide: (handler) => {
        pageHideHandler = handler;
        events.push('bind');
        return () => events.push('cleanup:bind');
      },
      flushDraft: () => events.push('flush'),
    },
  );

  noopCleanup();

  const cleanup = workspaceAutosaveRuntimeModule.bindNotesWorkspacePageHideAutosave(
    {
      shouldSchedule: true,
      shouldFlushOnPageHide: true,
      delayMs: 700,
    },
    {
      bindPageHide: (handler) => {
        pageHideHandler = handler;
        events.push('bind');
        return () => events.push('cleanup:bind');
      },
      flushDraft: () => events.push('flush'),
    },
  );

  pageHideHandler?.();
  cleanup();

  assert.deepEqual(events, [
    'bind',
    'flush',
    'cleanup:bind',
  ]);
});
