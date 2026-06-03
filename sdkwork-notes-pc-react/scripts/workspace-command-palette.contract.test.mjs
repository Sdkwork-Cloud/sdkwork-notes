import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function transpileTypeScriptModule(relativePath) {
  const entryPoint = path.resolve(process.cwd(), relativePath);
  const source = await readFile(entryPoint, 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  });
}

async function loadWorkspaceCommandPaletteModule() {
  const commandPaletteModule = await transpileTypeScriptModule(
    'packages/sdkwork-notes-notes/src/services/noteWorkspaceCommandPaletteModel.ts',
  );
  const notesSearchModuleUrl = createDataModuleUrl(
    (
      await transpileTypeScriptModule('packages/sdkwork-notes-search/src/index.ts')
    ).outputText,
  );
  const moduleSource = commandPaletteModule.outputText
    .replaceAll("'@sdkwork/notes-search'", `'${notesSearchModuleUrl}'`)
    .replaceAll('"@sdkwork/notes-search"', `"${notesSearchModuleUrl}"`);

  return import(createDataModuleUrl(moduleSource));
}

const workspaceCommandPaletteModule = await loadWorkspaceCommandPaletteModule();

function createSummary(id, title, overrides = {}) {
  return {
    id,
    uuid: `uuid-${id}`,
    title,
    type: 'doc',
    parentId: null,
    tags: [],
    isFavorite: false,
    snippet: `${title} summary`,
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T12:00:00Z',
    ...overrides,
  };
}

function createFolder(id, name, overrides = {}) {
  return {
    id,
    uuid: `folder-${id}`,
    name,
    parentId: null,
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T12:00:00Z',
    ...overrides,
  };
}

function t(key) {
  return key;
}

test('workspace command palette model builds action, folder, and note descriptors without page-side assembly', () => {
  const result = workspaceCommandPaletteModule.buildNoteWorkspaceCommandPaletteItems({
    t,
    notes: [
      createSummary('note-1', 'Weekly sprint review', {
        type: 'article',
        parentId: 'folder-a',
        tags: ['sprint'],
        updatedAt: '2026-03-30T11:30:00Z',
      }),
    ],
    trashedNotes: [
      createSummary('trash-1', 'Deleted API draft', {
        type: 'code',
        deletedAt: '2026-03-30T10:00:00Z',
      }),
    ],
    folders: [
      createFolder('folder-a', 'Projects'),
    ],
    searchQuery: '',
    sidebarCollapsed: true,
    inspectorOpen: false,
  });

  const toggleSidebar = result.find((item) => item.id === 'action:toggle-sidebar');
  const clearSearch = result.find((item) => item.id === 'action:clear-search');
  const folderItem = result.find((item) => item.id === 'folder:folder-a');
  const noteItem = result.find((item) => item.id === 'note:note-1');
  const trashedItem = result.find((item) => item.id === 'note:trash-1');

  assert.equal(toggleSidebar?.iconKey, 'panel-left-open');
  assert.deepEqual(toggleSidebar?.action, {
    type: 'toggle-sidebar',
  });
  assert.equal(clearSearch?.priority, 840);
  assert.deepEqual(folderItem?.action, {
    type: 'open-folder',
    folderId: 'folder-a',
  });
  assert.equal(noteItem?.iconKey, 'newspaper');
  assert.deepEqual(noteItem?.action, {
    type: 'open-note',
    noteId: 'note-1',
    isTrashed: false,
    folderId: 'folder-a',
  });
  assert.equal(trashedItem?.badge, 'notes.views.trash');
  assert.deepEqual(trashedItem?.action, {
    type: 'open-note',
    noteId: 'trash-1',
    isTrashed: true,
    folderId: null,
  });
});

test('workspace command palette search narrows note and folder candidates through shared notes-search results', () => {
  const result = workspaceCommandPaletteModule.buildNoteWorkspaceCommandPaletteItems({
    t,
    notes: [
      createSummary('note-1', 'Weekly sprint review', {
        parentId: 'folder-a',
        tags: ['planning'],
        snippet: 'Delivery checklist',
      }),
      createSummary('note-2', 'Travel checklist', {
        parentId: 'folder-b',
        tags: ['trip'],
        snippet: 'Packing list',
      }),
    ],
    trashedNotes: [],
    folders: [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Personal'),
    ],
    searchQuery: 'projects',
    sidebarCollapsed: false,
    inspectorOpen: true,
  });

  const itemIds = result.map((item) => item.id);
  const noteItem = result.find((item) => item.id === 'note:note-1');

  assert.ok(itemIds.includes('folder:folder-a'));
  assert.ok(itemIds.includes('note:note-1'));
  assert.ok(!itemIds.includes('folder:folder-b'));
  assert.ok(!itemIds.includes('note:note-2'));
  assert.ok(noteItem?.priority > 700);
  assert.ok(noteItem?.keywords.includes('Projects'));
});
