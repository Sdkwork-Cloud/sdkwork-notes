import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceCreateNoteRuntimeModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-notes/src/services/noteWorkspaceCreateNoteRuntime.ts',
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

const workspaceCreateNoteRuntimeModule = await loadWorkspaceCreateNoteRuntimeModule();

test('create note runtime resolves default titles per note type and forwards the selected folder', async () => {
  const createCalls = [];
  const runtime = workspaceCreateNoteRuntimeModule.createNotesWorkspaceCreateNoteRuntime({
    selectedFolderId: 'folder-product',
    resolveDefaultTitle: (noteType) => `default:${noteType}`,
    createNote: async (input) => {
      createCalls.push(input);
      return '';
    },
    runTransition: () => {
      throw new Error('transition should not run when note creation does not return an id');
    },
    setActiveView: () => {
      throw new Error('view changes should not run when note creation does not return an id');
    },
  });

  await runtime.createNote('doc');
  await runtime.createNote('article');
  await runtime.createNote('code');

  assert.deepEqual(createCalls, [
    {
      type: 'doc',
      title: 'default:doc',
      parentId: 'folder-product',
    },
    {
      type: 'article',
      title: 'default:article',
      parentId: 'folder-product',
    },
    {
      type: 'code',
      title: 'default:code',
      parentId: 'folder-product',
    },
  ]);
});

test('create note runtime returns the workspace to the all view only after a note id is created', async () => {
  const events = [];
  const runtime = workspaceCreateNoteRuntimeModule.createNotesWorkspaceCreateNoteRuntime({
    selectedFolderId: null,
    resolveDefaultTitle: (noteType) => `default:${noteType}`,
    createNote: async ({ type }) => {
      events.push(`create:${type}`);
      return type === 'doc' ? '' : 'note-created';
    },
    runTransition: (action) => {
      events.push('transition:start');
      action();
      events.push('transition:end');
    },
    setActiveView: (view) => {
      events.push(`view:${view}`);
    },
  });

  await runtime.createNote('doc');
  await runtime.createNote('article');

  assert.deepEqual(events, [
    'create:doc',
    'create:article',
    'transition:start',
    'view:all',
    'transition:end',
  ]);
});
