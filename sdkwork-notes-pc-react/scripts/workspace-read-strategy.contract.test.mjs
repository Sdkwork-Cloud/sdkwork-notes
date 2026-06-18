import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceReadStrategyModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/repository/noteWorkspaceReadStrategy.ts',
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

const workspaceReadStrategyModule = await loadWorkspaceReadStrategyModule();

test('workspace snapshot read strategy forwards the keyword to trashed reads and emits the remote workspace data source', async () => {
  const calls = [];
  const strategy = workspaceReadStrategyModule.createWorkspaceSnapshotReadStrategy({
    listActiveNoteSummaries: async () => [{ id: 'note-1', title: 'Roadmap' }],
    listDeletedNoteSummaries: async (keyword) => {
      calls.push(keyword ?? null);
      return [{ id: 'note-trash-1', title: 'Draft' }];
    },
    getFolders: async () => ({
      success: true,
      data: [{ id: 'folder-1', name: 'Projects' }],
    }),
  });

  const result = await strategy.loadWorkspaceSnapshot({ keyword: 'draft' });

  assert.equal(strategy.key, 'workspace-snapshot');
  assert.deepEqual(calls, ['draft']);
  assert.equal(result.success, true);
  assert.deepEqual(result.data?.notes, [{ id: 'note-1', title: 'Roadmap' }]);
  assert.deepEqual(result.data?.trashedNotes, [{ id: 'note-trash-1', title: 'Draft' }]);
  assert.deepEqual(result.data?.folders, [{ id: 'folder-1', name: 'Projects' }]);
  assert.equal(result.data?.dataSource.driver, 'app-sdk');
  assert.equal(result.data?.dataSource.readStrategy, 'workspace-snapshot');
});

test('workspace snapshot read strategy returns the folder query failure without synthesizing partial workspace data', async () => {
  const strategy = workspaceReadStrategyModule.createWorkspaceSnapshotReadStrategy({
    listActiveNoteSummaries: async () => [{ id: 'note-1' }],
    listDeletedNoteSummaries: async () => [{ id: 'note-trash-1' }],
    getFolders: async () => ({
      success: false,
      message: 'Failed to query folders',
    }),
  });

  const result = await strategy.loadWorkspaceSnapshot();

  assert.deepEqual(result, {
    success: false,
    message: 'Failed to query folders',
  });
});
