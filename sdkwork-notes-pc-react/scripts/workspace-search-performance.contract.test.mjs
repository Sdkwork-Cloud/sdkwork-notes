import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const workspaceRoot = process.cwd();

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function transpileTsModule(relativePath) {
  const entryPoint = path.resolve(workspaceRoot, relativePath);
  const source = await readFile(entryPoint, 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  }).outputText;
}

async function loadSearchPerformanceModules() {
  const notesSearchModuleSource = await transpileTsModule('packages/sdkwork-notes-pc-search/src/index.ts');
  const notesSearchModuleUrl = createDataModuleUrl(notesSearchModuleSource);
  const selectorsSource = (await transpileTsModule('packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceSelectors.ts'))
    .replaceAll("'@sdkwork/notes-pc-search'", `'${notesSearchModuleUrl}'`)
    .replaceAll('"@sdkwork/notes-pc-search"', `"${notesSearchModuleUrl}"`);
  const commandPaletteModelSource = (await transpileTsModule('packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceCommandPaletteModel.ts'))
    .replaceAll("'@sdkwork/notes-pc-search'", `'${notesSearchModuleUrl}'`)
    .replaceAll('"@sdkwork/notes-pc-search"', `"${notesSearchModuleUrl}"`);
  const commandPaletteSource = await transpileTsModule('packages/sdkwork-notes-pc-notes/src/services/noteCommandPalette.ts');

  return {
    notesSearchModule: await import(notesSearchModuleUrl),
    selectorsModule: await import(createDataModuleUrl(selectorsSource)),
    commandPaletteModelModule: await import(createDataModuleUrl(commandPaletteModelSource)),
    commandPaletteModule: await import(createDataModuleUrl(commandPaletteSource)),
  };
}

function createFolder(index) {
  const parentId = index > 0 && index % 10 !== 0 ? `folder-${Math.floor((index - 1) / 10)}` : null;
  return {
    id: `folder-${index}`,
    uuid: `folder-${index}`,
    name: `Projects ${index}`,
    parentId,
    createdAt: '2026-04-13T00:00:00.000Z',
    updatedAt: '2026-04-13T00:00:00.000Z',
  };
}

function createNote(index, folderCount, trashed = false) {
  return {
    id: `${trashed ? 'trash' : 'note'}-${index}`,
    uuid: `${trashed ? 'trash' : 'note'}-${index}`,
    title: `Project roadmap ${index}`,
    type: index % 7 === 0 ? 'code' : index % 5 === 0 ? 'article' : 'doc',
    parentId: `folder-${index % folderCount}`,
    tags: [`tag-${index % 12}`, 'shared'],
    isFavorite: index % 9 === 0,
    snippet: `Folder ${(index % folderCount)} delivery checklist and sprint review ${index}`,
    publishStatus: index % 11 === 0 ? 'archived' : 'draft',
    createdAt: '2026-04-13T00:00:00.000Z',
    updatedAt: new Date(Date.parse('2026-04-13T00:00:00.000Z') + (index * 1000)).toISOString(),
    ...(trashed ? { deletedAt: '2026-04-14T00:00:00.000Z' } : {}),
  };
}

function percentile(values, ratio) {
  const ordered = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.min(ordered.length - 1, Math.ceil(ordered.length * ratio) - 1));
  return ordered[index];
}

async function measureP95(iterations, callback) {
  await callback();

  const durations = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    await callback();
    durations.push(performance.now() - start);
  }

  return Number(percentile(durations, 0.95).toFixed(2));
}

const performanceModules = await loadSearchPerformanceModules();

test('search workspace freezes a repeatable 10k-note performance baseline for document build, query, sidebar search, and command palette search', async () => {
  const folders = Array.from({ length: 200 }, (_, index) => createFolder(index));
  const notes = Array.from({ length: 10_000 }, (_, index) => createNote(index, folders.length));
  const trashedNotes = Array.from({ length: 1_000 }, (_, index) => createNote(index, folders.length, true));
  const workspaceSnapshot = {
    notes,
    trashedNotes,
    folders,
  };
  const t = (key) => key;
  let latestMetrics = null;

  const buildMsP95 = await measureP95(7, async () => {
    const documents = performanceModules.notesSearchModule.buildNotesSearchDocuments({
      workspaceSnapshot,
    });
    latestMetrics = {
      ...(latestMetrics ?? {}),
      documents: documents.length,
    };
  });

  const documents = performanceModules.notesSearchModule.buildNotesSearchDocuments({
    workspaceSnapshot,
  });

  const queryMsP95 = await measureP95(7, async () => {
    const results = performanceModules.notesSearchModule.searchNotesSearchDocuments(
      documents,
      {
        text: 'projects 3',
        includeTrashed: true,
        limit: 50,
      },
      {
        source: 'workspace-search',
      },
    );
    latestMetrics = {
      ...(latestMetrics ?? {}),
      queryResults: results.length,
    };
  });

  const visibleMsP95 = await measureP95(7, async () => {
    const visibleNotes = performanceModules.selectorsModule.getVisibleNotes({
      notes,
      trashedNotes,
      folders,
      activeView: 'all',
      searchQuery: 'projects 3',
      selectedFolderId: null,
    });
    latestMetrics = {
      ...(latestMetrics ?? {}),
      visibleResults: visibleNotes.length,
    };
  });

  const commandPaletteMsP95 = await measureP95(7, async () => {
    const descriptors = performanceModules.commandPaletteModelModule.buildNoteWorkspaceCommandPaletteItems({
      t,
      notes,
      trashedNotes,
      folders,
      searchQuery: 'projects 3',
      sidebarCollapsed: false,
      inspectorOpen: true,
    });
    const matches = performanceModules.commandPaletteModule.getCommandPaletteMatches(
      descriptors,
      'projects 3',
      14,
    );
    latestMetrics = {
      ...(latestMetrics ?? {}),
      commandPaletteDescriptors: descriptors.length,
      commandPaletteMatches: matches.length,
    };
  });

  const metrics = {
    ...latestMetrics,
    buildMsP95,
    queryMsP95,
    visibleMsP95,
    commandPaletteMsP95,
  };

  assert.equal(metrics.documents, 11_000);
  assert.ok(metrics.queryResults > 0, JSON.stringify(metrics, null, 2));
  assert.ok(metrics.visibleResults > 0, JSON.stringify(metrics, null, 2));
  assert.ok(metrics.commandPaletteDescriptors > 0, JSON.stringify(metrics, null, 2));
  assert.ok(metrics.commandPaletteMatches > 0, JSON.stringify(metrics, null, 2));
  assert.ok(metrics.buildMsP95 < 250, JSON.stringify(metrics, null, 2));
  assert.ok(metrics.queryMsP95 < 150, JSON.stringify(metrics, null, 2));
  assert.ok(metrics.visibleMsP95 < 150, JSON.stringify(metrics, null, 2));
  assert.ok(metrics.commandPaletteMsP95 < 100, JSON.stringify(metrics, null, 2));
});
