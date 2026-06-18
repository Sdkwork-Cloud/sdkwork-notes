import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = path.resolve(import.meta.dirname, '../../../../');

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

describe('professional notes workspace contracts', () => {
  it('renders a workspace overview grid with metric cards and a current-focus panel', () => {
    const insightsSource = read('packages/sdkwork-notes-notes/src/components/NotesWorkspaceInsightsPanel.tsx');
    const pageSource = read('packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx');

    expect(insightsSource).toMatch(/data-slot="workspace-insight-grid"/);
    expect(insightsSource).toMatch(/data-slot="workspace-metric-card"/);
    expect(insightsSource).toMatch(/data-slot="workspace-focus-card"/);
    expect(pageSource).toMatch(/NotesWorkspaceInsightsPanel/);
  });

  it('renders document insights in the editor pane and structure controls in the inspector', () => {
    const editorSource = read('packages/sdkwork-notes-notes/src/components/NoteEditorPane.tsx');
    const inspectorSource = read('packages/sdkwork-notes-notes/src/components/NoteInspectorPanel.tsx');
    const pageSource = read('packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx');
    const commandPaletteSource = read('packages/sdkwork-notes-notes/src/components/NoteCommandPalette.tsx');
    const hotkeySource = read('packages/sdkwork-notes-notes/src/services/noteWorkspacePageActions.ts');

    expect(editorSource).toMatch(/data-slot="editor-insight-strip"/);
    expect(editorSource).toMatch(/data-slot="editor-tag-chip"/);
    expect(inspectorSource).toMatch(/data-slot="inspector-publish-status"/);
    expect(inspectorSource).toMatch(/data-slot="inspector-structure-card"/);
    expect(inspectorSource).toMatch(/data-slot="inspector-outline-list"/);
    expect(commandPaletteSource).toMatch(/data-slot="command-palette"/);
    expect(commandPaletteSource).toMatch(/data-slot="command-palette-item"/);
    expect(pageSource).toMatch(/bindNotesWorkspaceHotkeys/);
    expect(hotkeySource).toMatch(/normalizedKey === 'k'/);
  });
});
