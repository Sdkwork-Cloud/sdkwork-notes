import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceSidebarResizeRuntimeModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-notes/src/services/noteWorkspaceSidebarResizeRuntime.ts',
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

const workspaceSidebarResizeRuntimeModule = await loadWorkspaceSidebarResizeRuntimeModule();

test('sidebar resize runtime binds pointermove and pointerup, clamps width updates, and cleans up on pointer release', () => {
  const events = [];
  let pointerMoveHandler = null;
  let pointerUpHandler = null;

  workspaceSidebarResizeRuntimeModule.startNotesWorkspaceSidebarResize({
    startX: 200,
    startWidth: 300,
    setSidebarWidth: (width) => {
      events.push(`width:${width}`);
    },
    bindPointerMove: (handler) => {
      pointerMoveHandler = handler;
      events.push('bind:move');
      return () => {
        events.push('cleanup:move');
      };
    },
    bindPointerUp: (handler) => {
      pointerUpHandler = handler;
      events.push('bind:up');
      return () => {
        events.push('cleanup:up');
      };
    },
  });

  pointerMoveHandler?.({ clientX: 50 });
  pointerMoveHandler?.({ clientX: 310 });
  pointerMoveHandler?.({ clientX: 800 });
  pointerUpHandler?.();

  assert.deepEqual(events, [
    'bind:move',
    'bind:up',
    'width:220',
    'width:410',
    'width:420',
    'cleanup:move',
    'cleanup:up',
  ]);
});

test('sidebar resize runtime cleanup is safe to call manually and only runs once', () => {
  const events = [];
  const cleanup = workspaceSidebarResizeRuntimeModule.startNotesWorkspaceSidebarResize({
    startX: 100,
    startWidth: 280,
    setSidebarWidth: () => {},
    bindPointerMove: () => () => {
      events.push('cleanup:move');
    },
    bindPointerUp: () => () => {
      events.push('cleanup:up');
    },
  });

  cleanup();
  cleanup();

  assert.deepEqual(events, [
    'cleanup:move',
    'cleanup:up',
  ]);
});
