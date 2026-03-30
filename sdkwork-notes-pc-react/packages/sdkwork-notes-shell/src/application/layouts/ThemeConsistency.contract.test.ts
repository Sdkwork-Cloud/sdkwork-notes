import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = path.resolve(import.meta.dirname, '../../../../../');

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

describe('desktop theme consistency contracts', () => {
  it('defines semantic desktop surface tokens and editor typography overrides', () => {
    const shellStylesSource = read('packages/sdkwork-notes-shell/src/styles/index.css');

    expect(shellStylesSource).toMatch(/--accent-soft-bg:/);
    expect(shellStylesSource).toMatch(/--surface-raised:/);
    expect(shellStylesSource).toMatch(/--dialog-backdrop:/);
    expect(shellStylesSource).toMatch(/\.notes-editor-prose/);
  });

  it('scans the workspace root so desktop css includes lazy auth and notes module utilities', () => {
    const shellStylesPath = path.resolve(
      workspaceRoot,
      'packages/sdkwork-notes-shell/src/styles/index.css',
    );
    const shellStylesSource = fs.readFileSync(shellStylesPath, 'utf8');
    const workspaceSource = shellStylesSource
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('@source "') && line === '@source "../../../../";');

    expect(workspaceSource).toBeDefined();

    const relativeSourcePath = workspaceSource
      ?.replace('@source "', '')
      .replace('";', '');

    expect(relativeSourcePath).toBeDefined();

    const resolvedWorkspacePath = path.resolve(path.dirname(shellStylesPath), relativeSourcePath!);

    expect(resolvedWorkspacePath).toBe(workspaceRoot);
    expect(fs.existsSync(resolvedWorkspacePath)).toBe(true);
  });

  it('keeps theme-sensitive pages on semantic tokens instead of raw light or zinc colors', () => {
    const authPageSource = read('packages/sdkwork-notes-auth/src/pages/AuthPage.tsx');
    const notesSidebarSource = read('packages/sdkwork-notes-notes/src/components/NotesSidebar.tsx');
    const noteEditorPaneSource = read('packages/sdkwork-notes-notes/src/components/NoteEditorPane.tsx');
    const accountPageSource = read('packages/sdkwork-notes-user/src/AccountPage.tsx');

    expect(authPageSource).toMatch(/focus:bg-\[var\(--surface-raised-strong\)\]/);
    expect(authPageSource).toMatch(/bg-\[var\(--surface-overlay-strong\)\]/);
    expect(notesSidebarSource).toMatch(/bg-\[var\(--accent-soft-bg\)\]/);
    expect(notesSidebarSource).toMatch(/bg-\[var\(--surface-raised\)\]/);
    expect(noteEditorPaneSource).toMatch(/notes-editor-prose/);
    expect(accountPageSource).toMatch(/bg-\[var\(--accent-soft-bg\)\]/);

    const inspectedSources = [
      authPageSource,
      notesSidebarSource,
      noteEditorPaneSource,
      accountPageSource,
    ];

    for (const source of inspectedSources) {
      expect(source).not.toMatch(/bg-white|text-zinc|bg-zinc|focus:bg-white|dark:bg-black|bg-black\/5|white\/70|white\/92|white\/12|prose-slate|bg-primary-50|text-primary-700/);
    }
  });
});
