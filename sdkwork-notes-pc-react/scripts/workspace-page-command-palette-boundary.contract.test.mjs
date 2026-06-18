import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('workspace page delegates command palette item binding to a dedicated component boundary', () => {
  const pageSource = read('packages/sdkwork-notes-pc-notes/src/pages/NotesWorkspacePage.tsx');
  const componentsIndexSource = read('packages/sdkwork-notes-pc-notes/src/components/index.ts');
  const commandPaletteBoundarySource = read('packages/sdkwork-notes-pc-notes/src/components/NotesWorkspaceCommandPalette.tsx');

  assert.match(pageSource, /NotesWorkspaceCommandPalette/);
  assert.match(pageSource, /<NotesWorkspaceCommandPalette/);
  assert.doesNotMatch(pageSource, /NoteCommandPaletteItem/);
  assert.doesNotMatch(pageSource, /commandPaletteDescriptors\.map/);

  assert.match(componentsIndexSource, /NotesWorkspaceCommandPalette/);

  assert.match(commandPaletteBoundarySource, /NoteCommandPalette/);
  assert.match(commandPaletteBoundarySource, /descriptors\.map/);
  assert.match(commandPaletteBoundarySource, /resolveNotesWorkspaceChromeIcon/);
  assert.match(commandPaletteBoundarySource, /onSelectDescriptor\(descriptor\)/);
});
