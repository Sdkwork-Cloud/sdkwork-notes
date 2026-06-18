import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('workspace page delegates error banner rendering to a dedicated component boundary', () => {
  const pageSource = read('packages/sdkwork-notes-pc-notes/src/pages/NotesWorkspacePage.tsx');
  const componentsIndexSource = read('packages/sdkwork-notes-pc-notes/src/components/index.ts');
  const errorBannerBoundaryPath = path.join(
    workspaceRoot,
    'packages/sdkwork-notes-pc-notes/src/components/NotesWorkspaceErrorBanner.tsx',
  );
  const errorBannerBoundaryExists = fs.existsSync(errorBannerBoundaryPath);
  const errorBannerBoundarySource = errorBannerBoundaryExists
    ? fs.readFileSync(errorBannerBoundaryPath, 'utf8')
    : '';

  assert.match(pageSource, /NotesWorkspaceErrorBanner/);
  assert.match(pageSource, /<NotesWorkspaceErrorBanner/);
  assert.match(pageSource, /message=\{saveFeedback\.bannerMessage\}/);
  assert.match(pageSource, /dismissLabel=\{t\('notes\.actions\.dismissError'\)\}/);
  assert.match(pageSource, /retryLabel=\{t\('notes\.actions\.retrySave'\)\}/);
  assert.match(pageSource, /onDismiss=\{clearError\}/);
  assert.match(pageSource, /onRetry=\{saveFeedback\.retryAvailable \? flushDraft : undefined\}/);
  assert.doesNotMatch(pageSource, /errorMessage \?/);
  assert.doesNotMatch(pageSource, /onClick=\{clearError\}/);
  assert.doesNotMatch(pageSource, /border-rose-500\/20 bg-rose-500\/10/);

  assert.match(componentsIndexSource, /NotesWorkspaceErrorBanner/);

  assert.equal(
    errorBannerBoundaryExists,
    true,
    'expected NotesWorkspaceErrorBanner.tsx to exist as the error banner boundary',
  );
  assert.match(errorBannerBoundarySource, /message/);
  assert.match(errorBannerBoundarySource, /dismissLabel/);
  assert.match(errorBannerBoundarySource, /retryLabel/);
  assert.match(errorBannerBoundarySource, /onDismiss/);
  assert.match(errorBannerBoundarySource, /onRetry/);
  assert.match(errorBannerBoundarySource, /Button/);
  assert.match(errorBannerBoundarySource, /border-rose-500\/20 bg-rose-500\/10/);
});
