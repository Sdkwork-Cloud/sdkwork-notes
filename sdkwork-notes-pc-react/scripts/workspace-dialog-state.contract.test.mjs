import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceDialogStateModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-notes/src/services/noteWorkspaceDialogState.ts',
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

const workspaceDialogStateModule = await loadWorkspaceDialogStateModule();

function createTranslator() {
  return (key, options) => {
    switch (key) {
      case 'notes.dialogs.clearTrash.title':
        return 'Clear trash';
      case 'notes.dialogs.clearTrash.description':
        return 'Permanently remove every note in trash.';
      case 'notes.dialogs.clearTrash.confirm':
        return 'Clear now';
      case 'notes.dialogs.deleteNote.title':
        return 'Delete note';
      case 'notes.dialogs.deleteNote.description':
        return `Delete ${options?.title ?? 'Unknown note'} permanently.`;
      case 'notes.dialogs.deleteNote.confirm':
        return 'Delete note now';
      case 'notes.dialogs.deleteFolder.title':
        return 'Delete folder';
      case 'notes.dialogs.deleteFolder.description':
        return `Delete folder ${options?.name ?? 'Unknown folder'} and its contents.`;
      case 'notes.dialogs.deleteFolder.confirm':
        return 'Delete folder now';
      case 'notes.defaults.docTitle':
        return 'Untitled document';
      case 'notes.defaults.folderTitle':
        return 'Untitled folder';
      default:
        return key;
    }
  };
}

test('dialog state builder resolves clear-trash copy and closed state from the pending dialog', () => {
  const t = createTranslator();

  assert.deepEqual(
    workspaceDialogStateModule.buildNotesWorkspaceDialogState({
      pendingDialog: null,
      notes: [],
      trashedNotes: [],
      folders: [],
      t,
    }),
    {
      open: false,
      title: '',
      description: '',
      confirmLabel: '',
    },
  );

  assert.deepEqual(
    workspaceDialogStateModule.buildNotesWorkspaceDialogState({
      pendingDialog: { kind: 'clearTrash' },
      notes: [],
      trashedNotes: [],
      folders: [],
      t,
    }),
    {
      open: true,
      title: 'Clear trash',
      description: 'Permanently remove every note in trash.',
      confirmLabel: 'Clear now',
    },
  );
});

test('dialog state builder resolves note and folder entities with default fallbacks', () => {
  const t = createTranslator();

  assert.deepEqual(
    workspaceDialogStateModule.buildNotesWorkspaceDialogState({
      pendingDialog: { kind: 'deleteNote', noteId: 'note-trash' },
      notes: [{ id: 'note-live', title: 'Live note' }],
      trashedNotes: [{ id: 'note-trash', title: 'Trashed note' }],
      folders: [],
      t,
    }),
    {
      open: true,
      title: 'Delete note',
      description: 'Delete Trashed note permanently.',
      confirmLabel: 'Delete note now',
    },
  );

  assert.deepEqual(
    workspaceDialogStateModule.buildNotesWorkspaceDialogState({
      pendingDialog: { kind: 'deleteFolder', folderId: 'missing-folder' },
      notes: [],
      trashedNotes: [],
      folders: [],
      t,
    }),
    {
      open: true,
      title: 'Delete folder',
      description: 'Delete folder Untitled folder and its contents.',
      confirmLabel: 'Delete folder now',
    },
  );
});
