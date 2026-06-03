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

async function loadTypeScriptModule(relativePath) {
  const transpiled = await transpileTypeScriptModule(relativePath);
  return import(createDataModuleUrl(transpiled.outputText));
}

const workspaceTypesModule = await loadTypeScriptModule(
  'packages/sdkwork-notes-notes/src/types/notesWorkspace.ts',
);
const workspaceTypesModuleUrl = createDataModuleUrl(
  (await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/types/notesWorkspace.ts')).outputText,
);
const workspaceOrchestratorSource = (
  await transpileTypeScriptModule('packages/sdkwork-notes-notes/src/services/noteWorkspaceOrchestrator.ts')
).outputText.replace(
  "../types/notesWorkspace",
  workspaceTypesModuleUrl,
);
const workspaceOrchestratorModule = await import(createDataModuleUrl(workspaceOrchestratorSource));

function ok(data) {
  return {
    success: true,
    data,
  };
}

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

function createNote(id, title, overrides = {}) {
  return {
    ...createSummary(id, title),
    content: `${title} content`,
    ...overrides,
  };
}

test('workspace data source contract captures the current remote-only workspace capability baseline', () => {
  const dataSource = workspaceTypesModule.createRemoteAppSdkNoteWorkspaceDataSource();
  const snapshot = workspaceTypesModule.createEmptyNoteWorkspaceSnapshot();

  assert.deepEqual(dataSource, {
    driver: 'app-sdk',
    authority: 'remote',
    readStrategy: 'workspace-snapshot',
    writeStrategy: 'direct-write',
    capabilities: {
      localReplica: false,
      readThroughCache: false,
      offlineRead: false,
      offlineWrite: false,
      backgroundSync: false,
      incrementalSync: false,
      conflictResolution: false,
    },
  });
  assert.deepEqual(snapshot, {
    notes: [],
    trashedNotes: [],
    folders: [],
    dataSource,
  });
});

test('workspace orchestrator preserves the workspace data source descriptor for downstream store and UI layers', async () => {
  const dataSource = workspaceTypesModule.createRemoteAppSdkNoteWorkspaceDataSource();
  const workspaceService = {
    queryWorkspaceSnapshot: async () =>
      ok({
        notes: [createSummary('note-1', 'Alpha')],
        trashedNotes: [],
        folders: [],
        dataSource,
      }),
    findById: async () => ok(createNote('note-1', 'Alpha')),
  };

  const orchestrator = workspaceOrchestratorModule.createNoteWorkspaceOrchestrator(workspaceService);
  const result = await orchestrator.initializeWorkspace();

  assert.equal(result.success, true);
  assert.deepEqual(result.data.dataSource, dataSource);
});
