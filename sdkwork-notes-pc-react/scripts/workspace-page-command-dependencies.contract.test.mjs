import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspacePageCommandDependenciesModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/services/noteWorkspacePageCommandDependencies.ts',
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

const workspacePageCommandDependenciesModule = await loadWorkspacePageCommandDependenciesModule();

test('page command dependency factory centralizes view, folder, search, and note selection transitions', async () => {
  const events = [];
  const dependencies = workspacePageCommandDependenciesModule.createNotesWorkspacePageCommandDependencies({
    inspectorOpen: false,
    runTransition: (action) => {
      events.push('transition:start');
      action();
      events.push('transition:end');
    },
    setCommandPaletteOpen: (open) => events.push(`command-palette:${open}`),
    createNote: async (noteType) => events.push(`create:${noteType}`),
    persistActiveNote: () => events.push('persist'),
    focusSearch: () => events.push('focus-search'),
    blurSearch: () => events.push('blur-search'),
    setSearchQuery: (query) => events.push(`search:${query}`),
    toggleSidebar: () => events.push('toggle-sidebar'),
    setInspectorOpen: (nextValue) => events.push(`inspector:${nextValue}`),
    navigateAccount: () => events.push('navigate-account'),
    setActiveView: (view) => events.push(`view:${view}`),
    setSelectedFolderId: (folderId) => events.push(`folder:${folderId ?? 'root'}`),
    selectNote: async (noteId) => events.push(`select:${noteId}`),
    clearTrash: async () => events.push('clear-trash'),
    deleteNotePermanently: async (noteId) => events.push(`delete-note:${noteId}`),
    deleteFolder: async (folderId) => events.push(`delete-folder:${folderId}`),
  });

  dependencies.changeView('trash');
  dependencies.openFolder('folder-a');
  await dependencies.openNote('note-live', false, 'folder-a');
  await dependencies.openNote('note-trash', true, 'folder-a');

  assert.deepEqual(events, [
    'transition:start',
    'view:trash',
    'folder:root',
    'transition:end',
    'transition:start',
    'view:all',
    'folder:folder-a',
    'search:',
    'transition:end',
    'transition:start',
    'view:all',
    'folder:folder-a',
    'search:',
    'transition:end',
    'select:note-live',
    'transition:start',
    'view:trash',
    'folder:root',
    'search:',
    'transition:end',
    'select:note-trash',
  ]);
});

test('page command dependency factory centralizes direct runtime callbacks for command execution', async () => {
  const events = [];
  const dependencies = workspacePageCommandDependenciesModule.createNotesWorkspacePageCommandDependencies({
    inspectorOpen: true,
    runTransition: (action) => action(),
    setCommandPaletteOpen: (open) => events.push(`command-palette:${open}`),
    createNote: async (noteType) => events.push(`create:${noteType}`),
    persistActiveNote: () => events.push('persist'),
    focusSearch: () => events.push('focus-search'),
    blurSearch: () => events.push('blur-search'),
    setSearchQuery: (query) => events.push(`search:${query}`),
    toggleSidebar: () => events.push('toggle-sidebar'),
    setInspectorOpen: (nextValue) => events.push(`inspector:${nextValue}`),
    navigateAccount: () => events.push('navigate-account'),
    setActiveView: (view) => events.push(`view:${view}`),
    setSelectedFolderId: (folderId) => events.push(`folder:${folderId ?? 'root'}`),
    selectNote: async (noteId) => events.push(`select:${noteId}`),
    clearTrash: async () => events.push('clear-trash'),
    deleteNotePermanently: async (noteId) => events.push(`delete-note:${noteId}`),
    deleteFolder: async (folderId) => events.push(`delete-folder:${folderId}`),
  });

  dependencies.openCommandPalette();
  await dependencies.createNote('code');
  await dependencies.persistActiveNote();
  dependencies.focusSearch();
  dependencies.blurSearch();
  dependencies.clearSearch();
  dependencies.toggleSidebar();
  dependencies.setInspectorOpen(false);
  dependencies.navigateAccount();
  await dependencies.clearTrash();
  await dependencies.deleteNote('note-1');
  await dependencies.deleteFolder('folder-1');

  assert.deepEqual(events, [
    'command-palette:true',
    'create:code',
    'persist',
    'focus-search',
    'blur-search',
    'search:',
    'toggle-sidebar',
    'inspector:false',
    'navigate-account',
    'clear-trash',
    'delete-note:note-1',
    'delete-folder:folder-1',
  ]);
  assert.equal(dependencies.inspectorOpen, true);
});
