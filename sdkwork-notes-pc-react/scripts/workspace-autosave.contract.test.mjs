import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceAutosaveModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-notes/src/services/noteWorkspaceAutosave.ts',
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

const workspaceAutosaveModule = await loadWorkspaceAutosaveModule();

test('autosave plan schedules delayed persistence only for dirty, non-deleted active notes', () => {
  const activePlan = workspaceAutosaveModule.createNotesWorkspaceAutosavePlan({
    activeNoteId: 'note-1',
    activeNoteDeletedAt: undefined,
    saveState: 'dirty',
  });
  const errorPlan = workspaceAutosaveModule.createNotesWorkspaceAutosavePlan({
    activeNoteId: 'note-1',
    activeNoteDeletedAt: undefined,
    saveState: 'error',
  });
  const deletedPlan = workspaceAutosaveModule.createNotesWorkspaceAutosavePlan({
    activeNoteId: 'note-1',
    activeNoteDeletedAt: '2026-04-07T00:00:00Z',
    saveState: 'dirty',
  });
  const cleanPlan = workspaceAutosaveModule.createNotesWorkspaceAutosavePlan({
    activeNoteId: 'note-1',
    activeNoteDeletedAt: undefined,
    saveState: 'saved',
  });
  const emptyPlan = workspaceAutosaveModule.createNotesWorkspaceAutosavePlan({
    activeNoteId: null,
    activeNoteDeletedAt: undefined,
    saveState: 'dirty',
  });

  assert.equal(workspaceAutosaveModule.NOTES_WORKSPACE_AUTOSAVE_DELAY_MS, 700);
  assert.deepEqual(activePlan, {
    shouldSchedule: true,
    shouldFlush: true,
    shouldFlushOnPageHide: true,
    delayMs: 700,
  });
  assert.deepEqual(errorPlan, {
    shouldSchedule: false,
    shouldFlush: true,
    shouldFlushOnPageHide: true,
    delayMs: null,
  });
  assert.deepEqual(deletedPlan, {
    shouldSchedule: false,
    shouldFlush: false,
    shouldFlushOnPageHide: false,
    delayMs: null,
  });
  assert.deepEqual(cleanPlan, {
    shouldSchedule: false,
    shouldFlush: false,
    shouldFlushOnPageHide: false,
    delayMs: null,
  });
  assert.deepEqual(emptyPlan, {
    shouldSchedule: false,
    shouldFlush: false,
    shouldFlushOnPageHide: false,
    delayMs: null,
  });
});
