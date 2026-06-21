import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { applyContractModuleStubs } from './contract-transpile-helpers.mjs';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceDialogRuntimeModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceDialogRuntime.ts',
  );
  const source = await readFile(entryPoint, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  });

  return import(createDataModuleUrl(applyContractModuleStubs(transpiled.outputText)));
}

const workspaceDialogRuntimeModule = await loadWorkspaceDialogRuntimeModule();

test('dialog runtime opens and closes destructive dialogs and forwards confirm execution after closing state', async () => {
  const events = [];
  const runtime = workspaceDialogRuntimeModule.createNotesWorkspaceDialogRuntime({
    setPendingDialog: (dialog) => events.push(`dialog:${dialog ? `${dialog.kind}:${'noteId' in dialog ? dialog.noteId : 'folderId' in dialog ? dialog.folderId : 'none'}` : 'closed'}`),
    executeDialogCommand: async (dialog) => events.push(`execute:${dialog.kind}`),
    restoreNoteFromTrash: async () => true,
    runTransition: (action) => action(),
    setActiveView: (view) => events.push(`view:${view}`),
    selectNote: async (noteId) => events.push(`select:${noteId}`),
  });

  runtime.openClearTrashDialog();
  runtime.openDeleteNoteDialog('note-1');
  runtime.openDeleteFolderDialog('folder-1');
  runtime.closeDialog();
  await runtime.confirmDialog({ kind: 'deleteNote', noteId: 'note-2' });
  await runtime.confirmDialog(null);

  assert.deepEqual(events, [
    'dialog:clearTrash:none',
    'dialog:deleteNote:note-1',
    'dialog:deleteFolder:folder-1',
    'dialog:closed',
    'dialog:closed',
    'execute:deleteNote',
    'dialog:closed',
  ]);
});

test('dialog runtime restores trashed notes by switching back to all view and selecting the restored note', async () => {
  const events = [];
  const runtime = workspaceDialogRuntimeModule.createNotesWorkspaceDialogRuntime({
    setPendingDialog: () => {},
    executeDialogCommand: async () => {},
    restoreNoteFromTrash: async (noteId) => {
      events.push(`restore:${noteId}`);
      return noteId === 'note-ok';
    },
    runTransition: (action) => {
      events.push('transition:start');
      action();
      events.push('transition:end');
    },
    setActiveView: (view) => events.push(`view:${view}`),
    selectNote: async (noteId) => events.push(`select:${noteId}`),
  });

  await runtime.restoreNote('note-miss');
  await runtime.restoreNote('note-ok');

  assert.deepEqual(events, [
    'restore:note-miss',
    'restore:note-ok',
    'transition:start',
    'view:all',
    'transition:end',
    'select:note-ok',
  ]);
});
