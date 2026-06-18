import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { createRequire } from 'node:module';

async function loadWorkspacePageChromeModules() {
  const servicesRoot = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/services',
  );
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'workspace-page-chrome-'));
  const require = createRequire(import.meta.url);
  const packageRequire = createRequire(path.join(process.cwd(), 'package.json'));
  const tempNodeModules = path.join(tempDir, 'node_modules', 'lucide-react');

  await writeFile(path.join(tempDir, 'package.json'), '{"type":"commonjs"}', 'utf8');
  await mkdir(tempNodeModules, { recursive: true });
  await writeFile(
    path.join(tempNodeModules, 'index.js'),
    `module.exports = require(${JSON.stringify(packageRequire.resolve('lucide-react'))});`,
    'utf8',
  );

  for (const sourceFileName of [
    'noteWorkspacePageActions.ts',
    'noteWorkspacePageChrome.ts',
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

  return {
    chromeModule: require(path.join(tempDir, 'noteWorkspacePageChrome.js')),
    lucideModule: packageRequire('lucide-react'),
  };
}

const { chromeModule, lucideModule } = await loadWorkspacePageChromeModules();

function createTranslator() {
  return (key) => key;
}

test('workspace page chrome centralizes icon resolution for header, command palette, and presentation cards', () => {
  assert.equal(
    chromeModule.resolveNotesWorkspaceChromeIcon('search'),
    lucideModule.Search,
  );
  assert.equal(
    chromeModule.resolveNotesWorkspaceChromeIcon('panel-left-open'),
    lucideModule.PanelLeftOpen,
  );
  assert.equal(
    chromeModule.resolveNotesWorkspaceChromeIcon('book-open-text'),
    lucideModule.BookOpenText,
  );
});

test('workspace page chrome centralizes header action descriptors and stateful toggle labels', () => {
  const t = createTranslator();

  const expandedActions = chromeModule.buildNotesWorkspacePageHeaderActions({
    t,
    inspectorOpen: false,
    sidebarCollapsed: true,
  });

  assert.deepEqual(expandedActions, [
    {
      id: 'new-doc',
      kind: 'command',
      label: 'notes.actions.newDoc',
      iconKey: null,
      command: { type: 'create-note', noteType: 'doc' },
    },
    {
      id: 'new-article',
      kind: 'command',
      label: 'notes.actions.newArticle',
      iconKey: null,
      command: { type: 'create-note', noteType: 'article' },
    },
    {
      id: 'new-code',
      kind: 'command',
      label: 'notes.actions.newCode',
      iconKey: null,
      command: { type: 'create-note', noteType: 'code' },
    },
    {
      id: 'quick-switcher',
      kind: 'command',
      label: 'notes.actions.quickSwitcher',
      iconKey: 'search',
      command: { type: 'open-command-palette' },
    },
    {
      id: 'toggle-inspector',
      kind: 'command',
      label: 'notes.actions.showInspector',
      iconKey: 'columns',
      command: { type: 'toggle-inspector' },
    },
    {
      id: 'toggle-sidebar',
      kind: 'command',
      label: 'notes.actions.showSidebar',
      iconKey: 'panel-left-open',
      command: { type: 'toggle-sidebar' },
    },
    {
      id: 'account',
      kind: 'link',
      label: 'notes.actions.account',
      iconKey: 'account',
      to: '/account',
    },
  ]);

  const collapsedActions = chromeModule.buildNotesWorkspacePageHeaderActions({
    t,
    inspectorOpen: true,
    sidebarCollapsed: false,
  });

  assert.deepEqual(
    collapsedActions.slice(3),
    [
      {
        id: 'quick-switcher',
        kind: 'command',
        label: 'notes.actions.quickSwitcher',
        iconKey: 'search',
        command: { type: 'open-command-palette' },
      },
      {
        id: 'toggle-inspector',
        kind: 'command',
        label: 'notes.actions.hideInspector',
        iconKey: 'columns',
        command: { type: 'toggle-inspector' },
      },
      {
        id: 'toggle-sidebar',
        kind: 'command',
        label: 'notes.actions.hideSidebar',
        iconKey: 'panel-left-close',
        command: { type: 'toggle-sidebar' },
      },
      {
        id: 'account',
        kind: 'link',
        label: 'notes.actions.account',
        iconKey: 'account',
        to: '/account',
      },
    ],
  );
});
