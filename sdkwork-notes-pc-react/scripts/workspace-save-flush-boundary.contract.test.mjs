import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('workspace page centralizes manual save, shortcut save, and hide-triggered flush behind a shared flushDraft entry', () => {
  const pageSource = read('packages/sdkwork-notes-pc-notes/src/pages/NotesWorkspacePage.tsx');
  const autosaveSource = read('packages/sdkwork-notes-pc-notes/src/services/noteWorkspaceAutosave.ts');

  assert.match(autosaveSource, /shouldFlush:/);
  assert.match(autosaveSource, /saveState === 'error'/);

  assert.match(pageSource, /if \(!autosavePlan\.shouldFlush\) \{/);
  assert.match(pageSource, /void persistActiveNote\(\);/);
  assert.match(pageSource, /persistActiveNote: flushDraft,/);
  assert.match(pageSource, /onSave=\{flushDraft\}/);

  assert.doesNotMatch(pageSource, /persistActiveNote: \(\) => \{\s*flushDraft\(\);\s*\}/);
  assert.doesNotMatch(pageSource, /onSave=\{\(\) => \{\s*void persistActiveNote\(\);\s*\}\}/);
  assert.doesNotMatch(pageSource, /if \(!autosavePlan\.shouldFlushOnPageHide\) \{/);
});
