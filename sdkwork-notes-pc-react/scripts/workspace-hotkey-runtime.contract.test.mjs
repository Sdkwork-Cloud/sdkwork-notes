import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspaceHotkeyRuntimeModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceHotkeyRuntime.ts',
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

const workspaceHotkeyRuntimeModule = await loadWorkspaceHotkeyRuntimeModule();

test('hotkey runtime binds keydown handling and executes resolved workspace commands with preventDefault', async () => {
  const events = [];
  let keydownHandler = null;

  const cleanup = workspaceHotkeyRuntimeModule.bindNotesWorkspaceHotkeys({
    isCommandPaletteOpen: true,
    isSearchFocused: () => {
      events.push('search:checked');
      return false;
    },
    resolveCommand: (options) => {
      events.push(`resolve:${options.key}:${options.isCommandPaletteOpen}`);
      return options.key === 'k'
        ? { type: 'open-command-palette' }
        : null;
    },
    executeCommand: async (command) => {
      events.push(`execute:${command.type}`);
    },
    bindKeydown: (handler) => {
      keydownHandler = handler;
      events.push('bind');
      return () => {
        events.push('cleanup');
      };
    },
  });

  const commandEvent = {
    key: 'k',
    metaKey: false,
    ctrlKey: true,
    shiftKey: false,
    altKey: false,
    preventDefault: () => {
      events.push('preventDefault');
    },
  };
  const ignoredEvent = {
    key: 'x',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault: () => {
      events.push('preventDefault:ignored');
    },
  };

  keydownHandler?.(commandEvent);
  keydownHandler?.(ignoredEvent);
  cleanup();

  assert.deepEqual(events, [
    'bind',
    'search:checked',
    'resolve:k:true',
    'preventDefault',
    'execute:open-command-palette',
    'search:checked',
    'resolve:x:true',
    'cleanup',
  ]);
});

test('hotkey runtime preserves the resolver search-focus contract across keydown events', async () => {
  const events = [];
  let keydownHandler = null;
  let isSearchFocused = true;

  workspaceHotkeyRuntimeModule.bindNotesWorkspaceHotkeys({
    isCommandPaletteOpen: false,
    isSearchFocused: () => isSearchFocused,
    resolveCommand: (options) => {
      events.push(`resolve:${options.key}:${options.isSearchFocused}`);
      return options.isSearchFocused
        ? { type: 'clear-search', focusSearch: false }
        : null;
    },
    executeCommand: async (command) => {
      events.push(`execute:${command.type}`);
    },
    bindKeydown: (handler) => {
      keydownHandler = handler;
      return () => {};
    },
  });

  keydownHandler?.({
    key: 'Escape',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault: () => {
      events.push('preventDefault');
    },
  });

  isSearchFocused = false;

  keydownHandler?.({
    key: 'Escape',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault: () => {
      events.push('preventDefault:second');
    },
  });

  assert.deepEqual(events, [
    'resolve:Escape:true',
    'preventDefault',
    'execute:clear-search',
    'resolve:Escape:false',
  ]);
});
