import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('workspace page delegates dialog footer rendering to a dedicated component boundary', () => {
  const pageSource = read('packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx');
  const componentsIndexSource = read('packages/sdkwork-notes-notes/src/components/index.ts');
  const dialogFooterBoundaryPath = path.join(
    workspaceRoot,
    'packages/sdkwork-notes-notes/src/components/NotesWorkspaceDialogFooter.tsx',
  );
  const dialogFooterBoundaryExists = fs.existsSync(dialogFooterBoundaryPath);
  const dialogFooterBoundarySource = dialogFooterBoundaryExists
    ? fs.readFileSync(dialogFooterBoundaryPath, 'utf8')
    : '';

  assert.match(pageSource, /NotesWorkspaceDialogFooter/);
  assert.match(pageSource, /<NotesWorkspaceDialogFooter/);
  assert.match(pageSource, /cancelLabel=\{t\('common\.cancel'\)\}/);
  assert.match(pageSource, /confirmLabel=\{dialogState\.confirmLabel\}/);
  assert.doesNotMatch(pageSource, /<Button appearance="ghost"/);
  assert.doesNotMatch(pageSource, /<Button appearance="danger"/);
  assert.doesNotMatch(pageSource, /footer=\{\(\s*<>/);

  assert.match(componentsIndexSource, /NotesWorkspaceDialogFooter/);

  assert.equal(
    dialogFooterBoundaryExists,
    true,
    'expected NotesWorkspaceDialogFooter.tsx to exist as the dialog footer boundary',
  );
  assert.match(dialogFooterBoundarySource, /cancelLabel/);
  assert.match(dialogFooterBoundarySource, /confirmLabel/);
  assert.match(dialogFooterBoundarySource, /onCancel/);
  assert.match(dialogFooterBoundarySource, /onConfirm/);
  assert.match(dialogFooterBoundarySource, /Button/);
  assert.match(dialogFooterBoundarySource, /appearance="ghost"/);
  assert.match(dialogFooterBoundarySource, /appearance="danger"/);
});
