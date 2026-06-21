import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { applyContractModuleStubs } from './contract-transpile-helpers.mjs';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspacePageCommandExecutorModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/services/noteWorkspacePageCommandExecutor.ts',
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

const workspacePageCommandExecutorModule = await loadWorkspacePageCommandExecutorModule();

test('page command executor routes search, toggle, navigation, and view commands through the provided callbacks', async () => {
  const events = [];

  await workspacePageCommandExecutorModule.executeNotesWorkspacePageCommand(
    { type: 'clear-search', focusSearch: true },
    {
      inspectorOpen: false,
      openCommandPalette: () => events.push('open-command-palette'),
      createNote: async (noteType) => events.push(`create:${noteType}`),
      persistActiveNote: () => events.push('persist'),
      focusSearch: () => events.push('focus-search'),
      blurSearch: () => events.push('blur-search'),
      clearSearch: () => events.push('clear-search'),
      toggleSidebar: () => events.push('toggle-sidebar'),
      setInspectorOpen: (nextValue) => events.push(`set-inspector:${nextValue}`),
      navigateAccount: () => events.push('navigate-account'),
      changeView: (view) => events.push(`change-view:${view}`),
      openFolder: (folderId) => events.push(`open-folder:${folderId ?? 'root'}`),
      openNote: async (noteId, isTrashed, folderId) => {
        events.push(`open-note:${noteId}:${isTrashed ? 'trash' : 'live'}:${folderId ?? 'root'}`);
      },
      clearTrash: async () => events.push('clear-trash'),
      deleteNote: async (noteId) => events.push(`delete-note:${noteId}`),
      deleteFolder: async (folderId) => events.push(`delete-folder:${folderId}`),
    },
  );

  await workspacePageCommandExecutorModule.executeNotesWorkspacePageCommand(
    { type: 'toggle-inspector' },
    {
      inspectorOpen: false,
      openCommandPalette: () => events.push('open-command-palette'),
      createNote: async (noteType) => events.push(`create:${noteType}`),
      persistActiveNote: () => events.push('persist'),
      focusSearch: () => events.push('focus-search'),
      blurSearch: () => events.push('blur-search'),
      clearSearch: () => events.push('clear-search'),
      toggleSidebar: () => events.push('toggle-sidebar'),
      setInspectorOpen: (nextValue) => events.push(`set-inspector:${nextValue}`),
      navigateAccount: () => events.push('navigate-account'),
      changeView: (view) => events.push(`change-view:${view}`),
      openFolder: (folderId) => events.push(`open-folder:${folderId ?? 'root'}`),
      openNote: async (noteId, isTrashed, folderId) => {
        events.push(`open-note:${noteId}:${isTrashed ? 'trash' : 'live'}:${folderId ?? 'root'}`);
      },
      clearTrash: async () => events.push('clear-trash'),
      deleteNote: async (noteId) => events.push(`delete-note:${noteId}`),
      deleteFolder: async (folderId) => events.push(`delete-folder:${folderId}`),
    },
  );

  await workspacePageCommandExecutorModule.executeNotesWorkspacePageCommand(
    { type: 'change-view', view: 'trash' },
    {
      inspectorOpen: true,
      openCommandPalette: () => events.push('open-command-palette'),
      createNote: async (noteType) => events.push(`create:${noteType}`),
      persistActiveNote: () => events.push('persist'),
      focusSearch: () => events.push('focus-search'),
      blurSearch: () => events.push('blur-search'),
      clearSearch: () => events.push('clear-search'),
      toggleSidebar: () => events.push('toggle-sidebar'),
      setInspectorOpen: (nextValue) => events.push(`set-inspector:${nextValue}`),
      navigateAccount: () => events.push('navigate-account'),
      changeView: (view) => events.push(`change-view:${view}`),
      openFolder: (folderId) => events.push(`open-folder:${folderId ?? 'root'}`),
      openNote: async (noteId, isTrashed, folderId) => {
        events.push(`open-note:${noteId}:${isTrashed ? 'trash' : 'live'}:${folderId ?? 'root'}`);
      },
      clearTrash: async () => events.push('clear-trash'),
      deleteNote: async (noteId) => events.push(`delete-note:${noteId}`),
      deleteFolder: async (folderId) => events.push(`delete-folder:${folderId}`),
    },
  );

  assert.deepEqual(events, [
    'clear-search',
    'focus-search',
    'set-inspector:true',
    'change-view:trash',
  ]);
});

test('page command executor routes async note and destructive commands through the provided callbacks', async () => {
  const events = [];
  const dependencies = {
    inspectorOpen: true,
    openCommandPalette: () => events.push('open-command-palette'),
    createNote: async (noteType) => events.push(`create:${noteType}`),
    persistActiveNote: () => events.push('persist'),
    focusSearch: () => events.push('focus-search'),
    blurSearch: () => events.push('blur-search'),
    clearSearch: () => events.push('clear-search'),
    toggleSidebar: () => events.push('toggle-sidebar'),
    setInspectorOpen: (nextValue) => events.push(`set-inspector:${nextValue}`),
    navigateAccount: () => events.push('navigate-account'),
    changeView: (view) => events.push(`change-view:${view}`),
    openFolder: (folderId) => events.push(`open-folder:${folderId ?? 'root'}`),
    openNote: async (noteId, isTrashed, folderId) => {
      events.push(`open-note:${noteId}:${isTrashed ? 'trash' : 'live'}:${folderId ?? 'root'}`);
    },
    clearTrash: async () => events.push('clear-trash'),
    deleteNote: async (noteId) => events.push(`delete-note:${noteId}`),
    deleteFolder: async (folderId) => events.push(`delete-folder:${folderId}`),
  };

  await workspacePageCommandExecutorModule.executeNotesWorkspacePageCommand(
    { type: 'create-note', noteType: 'code' },
    dependencies,
  );
  await workspacePageCommandExecutorModule.executeNotesWorkspacePageCommand(
    { type: 'open-note', noteId: 'note-1', isTrashed: true, folderId: null },
    dependencies,
  );
  await workspacePageCommandExecutorModule.executeNotesWorkspacePageCommand(
    { type: 'delete-folder', folderId: 'folder-a' },
    dependencies,
  );
  await workspacePageCommandExecutorModule.executeNotesWorkspacePageCommand(
    { type: 'clear-trash' },
    dependencies,
  );

  assert.deepEqual(events, [
    'create:code',
    'open-note:note-1:trash:root',
    'delete-folder:folder-a',
    'clear-trash',
  ]);
});
