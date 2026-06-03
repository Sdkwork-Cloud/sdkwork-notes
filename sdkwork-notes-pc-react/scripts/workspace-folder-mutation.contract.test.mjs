import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceFolderMutationModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-notes/src/services/noteWorkspaceFolderMutationCoordinator.ts',
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

const workspaceFolderMutationModule = await loadWorkspaceFolderMutationModule();

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

test('folder deletion plan prunes selected and expanded descendants within the removed subtree', () => {
  const result = workspaceFolderMutationModule.planDeletedFolderState({
    folders: [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Roadmap', { parentId: 'folder-a' }),
      createFolder('folder-c', 'Research', { parentId: 'folder-b' }),
      createFolder('folder-d', 'Archive'),
    ],
    deletedFolderId: 'folder-a',
    selectedFolderId: 'folder-c',
    expandedFolderIds: ['folder-a', 'folder-b', 'folder-d'],
  });

  assert.equal(result.status, 'apply');
  assert.deepEqual(result.removedFolderIds, ['folder-a', 'folder-b', 'folder-c']);
  assert.equal(result.selectedFolderId, null);
  assert.deepEqual(result.expandedFolderIds, ['folder-d']);
});

test('folder deletion plan preserves unrelated selection and expansion state', () => {
  const result = workspaceFolderMutationModule.planDeletedFolderState({
    folders: [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Roadmap', { parentId: 'folder-a' }),
      createFolder('folder-d', 'Archive'),
    ],
    deletedFolderId: 'folder-a',
    selectedFolderId: 'folder-d',
    expandedFolderIds: ['folder-a', 'folder-d'],
  });

  assert.equal(result.status, 'apply');
  assert.equal(result.selectedFolderId, 'folder-d');
  assert.deepEqual(result.expandedFolderIds, ['folder-d']);
});

test('folder move plan rejects descendant targets', () => {
  const result = workspaceFolderMutationModule.planMovedFolderState({
    folders: [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Roadmap', { parentId: 'folder-a' }),
      createFolder('folder-c', 'Research', { parentId: 'folder-b' }),
    ],
    movedFolderId: 'folder-a',
    requestedParentId: 'folder-c',
    expandedFolderIds: ['folder-a'],
  });

  assert.equal(result.status, 'invalid');
  assert.equal(result.errorMessage, 'Cannot move a folder into itself or one of its descendants');
});

test('folder move plan expands the new parent for valid moves', () => {
  const result = workspaceFolderMutationModule.planMovedFolderState({
    folders: [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Roadmap', { parentId: 'folder-a' }),
      createFolder('folder-d', 'Archive'),
    ],
    movedFolderId: 'folder-b',
    requestedParentId: 'folder-d',
    expandedFolderIds: ['folder-a'],
  });

  assert.equal(result.status, 'apply');
  assert.equal(result.nextParentId, 'folder-d');
  assert.deepEqual(result.expandedFolderIds, ['folder-a', 'folder-d']);
  assert.equal(result.errorMessage, null);
});
