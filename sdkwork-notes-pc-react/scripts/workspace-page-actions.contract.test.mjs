import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspacePageActionsModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/services/noteWorkspacePageActions.ts',
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

const workspacePageActionsModule = await loadWorkspacePageActionsModule();

test('workspace hotkey resolver emits the expected commands for core shortcuts', () => {
  assert.deepEqual(
    workspacePageActionsModule.resolveNotesWorkspaceHotkeyCommand({
      key: 'k',
      metaKey: false,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      isCommandPaletteOpen: false,
      isSearchFocused: false,
    }),
    { type: 'open-command-palette' },
  );

  assert.deepEqual(
    workspacePageActionsModule.resolveNotesWorkspaceHotkeyCommand({
      key: 'n',
      metaKey: false,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      isCommandPaletteOpen: false,
      isSearchFocused: false,
    }),
    { type: 'create-note', noteType: 'doc' },
  );

  assert.deepEqual(
    workspacePageActionsModule.resolveNotesWorkspaceHotkeyCommand({
      key: 'Escape',
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      isCommandPaletteOpen: false,
      isSearchFocused: true,
    }),
    { type: 'clear-search', focusSearch: false },
  );
});

test('workspace hotkey resolver suppresses non-palette shortcuts while the command palette is open', () => {
  assert.equal(
    workspacePageActionsModule.resolveNotesWorkspaceHotkeyCommand({
      key: 'n',
      metaKey: false,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      isCommandPaletteOpen: true,
      isSearchFocused: false,
    }),
    null,
  );
});

test('workspace page action resolvers normalize command palette and dialog actions into executable page commands', () => {
  assert.deepEqual(
    workspacePageActionsModule.resolveNotesWorkspaceCommandPaletteCommand({
      type: 'clear-search',
    }),
    {
      type: 'clear-search',
      focusSearch: true,
    },
  );

  assert.deepEqual(
    workspacePageActionsModule.resolveNotesWorkspaceCommandPaletteCommand({
      type: 'open-note',
      noteId: 'note-1',
      isTrashed: true,
      folderId: null,
    }),
    {
      type: 'open-note',
      noteId: 'note-1',
      isTrashed: true,
      folderId: null,
    },
  );

  assert.deepEqual(
    workspacePageActionsModule.resolveNotesWorkspaceDialogConfirmCommand({
      kind: 'deleteFolder',
      folderId: 'folder-a',
    }),
    {
      type: 'delete-folder',
      folderId: 'folder-a',
    },
  );

  assert.deepEqual(
    workspacePageActionsModule.resolveNotesWorkspaceDialogConfirmCommand({
      kind: 'clearTrash',
    }),
    {
      type: 'clear-trash',
    },
  );
});
