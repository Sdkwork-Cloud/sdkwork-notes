import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('workspace page delegates header action rendering to a dedicated component boundary', () => {
  const pageSource = read('packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx');
  const componentsIndexSource = read('packages/sdkwork-notes-notes/src/components/index.ts');
  const headerActionsBoundaryPath = path.join(
    workspaceRoot,
    'packages/sdkwork-notes-notes/src/components/NotesWorkspaceHeaderActions.tsx',
  );
  const headerActionsBoundaryExists = fs.existsSync(headerActionsBoundaryPath);
  const headerActionsBoundarySource = headerActionsBoundaryExists
    ? fs.readFileSync(headerActionsBoundaryPath, 'utf8')
    : '';

  assert.match(pageSource, /NotesWorkspaceHeaderActions/);
  assert.match(pageSource, /<NotesWorkspaceHeaderActions/);
  assert.match(pageSource, /actions=\{headerActions\}/);
  assert.match(pageSource, /onCommandAction=\{handleWorkspacePageCommand\}/);
  assert.doesNotMatch(pageSource, /headerActions\.map/);
  assert.doesNotMatch(pageSource, /action\.kind === 'link'/);
  assert.doesNotMatch(pageSource, /resolveNotesWorkspaceChromeIcon/);
  assert.doesNotMatch(pageSource, /<Link/);

  assert.match(componentsIndexSource, /NotesWorkspaceHeaderActions/);

  assert.equal(
    headerActionsBoundaryExists,
    true,
    'expected NotesWorkspaceHeaderActions.tsx to exist as the header actions boundary',
  );
  assert.match(headerActionsBoundarySource, /actions\.map/);
  assert.match(headerActionsBoundarySource, /action\.kind === 'link'/);
  assert.match(headerActionsBoundarySource, /resolveNotesWorkspaceChromeIcon/);
  assert.match(headerActionsBoundarySource, /<Link/);
  assert.match(headerActionsBoundarySource, /<Button/);
  assert.match(headerActionsBoundarySource, /onCommandAction\(action\.command\)/);
});
