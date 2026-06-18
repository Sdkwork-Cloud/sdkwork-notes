import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('workspace page container keeps insight rendering out of NotesWorkspacePage and inside a dedicated component boundary', () => {
  const pageSource = read('packages/sdkwork-notes-pc-notes/src/pages/NotesWorkspacePage.tsx');
  const componentsIndexSource = read('packages/sdkwork-notes-pc-notes/src/components/index.ts');
  const insightsComponentSource = read('packages/sdkwork-notes-pc-notes/src/components/NotesWorkspaceInsightsPanel.tsx');

  assert.match(pageSource, /NotesWorkspaceInsightsPanel/);
  assert.match(pageSource, /<NotesWorkspaceInsightsPanel/);
  assert.match(pageSource, /pagePresentation\.syncCard\.actionKind === 'retry-sync'/);
  assert.match(pageSource, /void requestSyncDrain\(\)/);
  assert.match(pageSource, /pagePresentation\.syncCard\.actionKind === 'review-note'/);
  assert.match(pageSource, /void selectNote\(pagePresentation\.syncCard\.actionTargetNoteId\)/);
  assert.doesNotMatch(pageSource, /function WorkspaceMetricCard/);
  assert.doesNotMatch(pageSource, /pagePresentation\.metricCards\.map/);
  assert.doesNotMatch(pageSource, /pagePresentation\.focusCard\.details\.map/);

  assert.match(componentsIndexSource, /NotesWorkspaceInsightsPanel/);

  assert.match(insightsComponentSource, /data-slot="workspace-insight-grid"/);
  assert.match(insightsComponentSource, /data-slot="workspace-focus-card"/);
  assert.match(insightsComponentSource, /data-slot="workspace-sync-card"/);
  assert.match(insightsComponentSource, /pagePresentation\.metricCards\.map/);
  assert.match(insightsComponentSource, /pagePresentation\.focusCard\.details\.map/);
  assert.match(insightsComponentSource, /pagePresentation\.syncCard\.details\.map/);
  assert.match(insightsComponentSource, /resolveNotesWorkspaceChromeIcon/);
});
