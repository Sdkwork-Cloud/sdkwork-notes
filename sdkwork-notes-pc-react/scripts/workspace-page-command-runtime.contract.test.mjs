import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { createRequire } from 'node:module';

async function loadWorkspacePageCommandRuntimeModule() {
  const servicesRoot = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/services',
  );
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'workspace-page-command-runtime-'));
  const require = createRequire(import.meta.url);

  await writeFile(path.join(tempDir, 'package.json'), '{"type":"commonjs"}', 'utf8');

  for (const sourceFileName of [
    'noteWorkspacePageActions.ts',
    'noteWorkspacePageCommandDependencies.ts',
    'noteWorkspacePageCommandExecutor.ts',
    'noteWorkspacePageCommandRuntime.ts',
  ]) {
    const sourcePath = path.join(servicesRoot, sourceFileName);
    const source = await readFile(sourcePath, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: sourcePath,
    });

    await writeFile(
      path.join(tempDir, sourceFileName.replace(/\.ts$/, '.js')),
      transpiled.outputText,
      'utf8',
    );
  }

  return require(path.join(tempDir, 'noteWorkspacePageCommandRuntime.js'));
}

const workspacePageCommandRuntimeModule = await loadWorkspacePageCommandRuntimeModule();

test('page command runtime centralizes dependency assembly and command execution', async () => {
  const events = [];
  const runtime = workspacePageCommandRuntimeModule.createNotesWorkspacePageCommandRuntime({
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

  await runtime.execute({ type: 'change-view', view: 'trash' });
  await runtime.execute({ type: 'open-note', noteId: 'note-live', isTrashed: false, folderId: 'folder-a' });
  await runtime.execute({ type: 'toggle-inspector' });

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
    'select:note-live',
    'inspector:true',
  ]);
});

test('page command runtime resolves command palette actions and dialog confirmations before execution', async () => {
  const events = [];
  const runtime = workspacePageCommandRuntimeModule.createNotesWorkspacePageCommandRuntime({
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

  await runtime.executeCommandPaletteAction({ type: 'clear-search' });
  await runtime.executeDialogConfirm({ kind: 'deleteFolder', folderId: 'folder-a' });
  await runtime.executeDialogConfirm({ kind: 'clearTrash' });

  assert.deepEqual(events, [
    'search:',
    'focus-search',
    'delete-folder:folder-a',
    'clear-trash',
  ]);
});
