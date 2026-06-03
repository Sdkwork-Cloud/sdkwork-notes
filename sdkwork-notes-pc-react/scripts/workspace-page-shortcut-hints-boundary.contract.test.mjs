import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('workspace page delegates shortcut hint rendering to a dedicated component boundary', () => {
  const pageSource = read('packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx');
  const componentsIndexSource = read('packages/sdkwork-notes-notes/src/components/index.ts');
  const shortcutHintsBoundaryPath = path.join(
    workspaceRoot,
    'packages/sdkwork-notes-notes/src/components/NotesWorkspaceShortcutHints.tsx',
  );
  const shortcutHintsBoundaryExists = fs.existsSync(shortcutHintsBoundaryPath);
  const shortcutHintsBoundarySource = shortcutHintsBoundaryExists
    ? fs.readFileSync(shortcutHintsBoundaryPath, 'utf8')
    : '';

  assert.match(pageSource, /NotesWorkspaceShortcutHints/);
  assert.match(pageSource, /<NotesWorkspaceShortcutHints/);
  assert.match(pageSource, /label=\{t\('notes\.shortcuts\.label'\)\}/);
  assert.match(pageSource, /shortcutHints=\{pagePresentation\.shortcutHints\}/);
  assert.doesNotMatch(pageSource, /pagePresentation\.shortcutHints\.map/);

  assert.match(componentsIndexSource, /NotesWorkspaceShortcutHints/);

  assert.equal(
    shortcutHintsBoundaryExists,
    true,
    'expected NotesWorkspaceShortcutHints.tsx to exist as the shortcut hints boundary',
  );
  assert.match(shortcutHintsBoundarySource, /shortcutHints\.map/);
  assert.match(shortcutHintsBoundarySource, /label/);
  assert.match(shortcutHintsBoundarySource, /shortcut\.keys/);
  assert.match(shortcutHintsBoundarySource, /shortcut\.label/);
});
