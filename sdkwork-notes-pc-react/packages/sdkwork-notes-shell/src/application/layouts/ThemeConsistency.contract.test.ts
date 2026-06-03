import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = path.resolve(import.meta.dirname, '../../../../../');

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

function matchCssBlock(source: string, pattern: RegExp) {
  const match = source.match(pattern);

  expect(match, `Expected css block ${pattern} to exist`).toBeTruthy();

  return match?.[0] ?? '';
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

  it('explicitly scans shared sdkwork ui and auth sources so external IAM classes ship in the desktop build', () => {
    const shellStylesSource = read('packages/sdkwork-notes-shell/src/styles/index.css');

    expect(shellStylesSource).toMatch(
      /@source "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/sdkwork-ui\/sdkwork-ui-pc-react\/src";/,
    );
    expect(shellStylesSource).toMatch(
      /@source "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/sdkwork-appbase\/packages\/pc-react\/iam\/sdkwork-auth-pc-react\/src";/,
    );
  });

  it('keeps theme-sensitive pages on semantic tokens instead of raw light or zinc colors', () => {
    const authPageSource = read('packages/sdkwork-notes-auth/src/pages/AuthPage.tsx');
    const authCallbackPageSource = read('packages/sdkwork-notes-auth/src/pages/AuthOAuthCallbackPage.tsx');
    const identityThemeProviderSource = read(
      'packages/sdkwork-notes-auth/src/theme/SdkworkIamThemeProvider.tsx',
    );
    const notesSidebarSource = read('packages/sdkwork-notes-notes/src/components/NotesSidebar.tsx');
    const noteEditorPaneSource = read('packages/sdkwork-notes-notes/src/components/NoteEditorPane.tsx');
    const accountPageSource = read('packages/sdkwork-notes-user/src/AccountPage.tsx');

    expect(authPageSource).toMatch(/SdkworkAuthPage/);
    expect(authPageSource).toMatch(/SdkworkIamThemeProvider/);
    expect(authCallbackPageSource).toMatch(/SdkworkAuthOAuthCallbackPage/);
    expect(authCallbackPageSource).toMatch(/SdkworkIamThemeProvider/);
    expect(identityThemeProviderSource).toMatch(
      /document\.documentElement\.classList\.contains\('dark'\)/,
    );
    expect(identityThemeProviderSource).toMatch(/new MutationObserver\(syncColorMode\)/);
    expect(identityThemeProviderSource).toMatch(/defaultTheme=\{colorMode\}/);
    expect(identityThemeProviderSource).not.toMatch(/overrides=/);
    expect(notesSidebarSource).toMatch(/bg-\[var\(--accent-soft-bg\)\]/);
    expect(notesSidebarSource).toMatch(/bg-\[var\(--surface-raised\)\]/);
    expect(noteEditorPaneSource).toMatch(/notes-editor-prose/);
    expect(accountPageSource).toMatch(/bg-\[var\(--accent-soft-bg\)\]/);

    const inspectedSources = [
      notesSidebarSource,
      noteEditorPaneSource,
      accountPageSource,
    ];

    for (const source of inspectedSources) {
      expect(source).not.toMatch(/bg-white|text-zinc|bg-zinc|focus:bg-white|dark:bg-black|bg-black\/5|white\/70|white\/92|white\/12|prose-slate|bg-primary-50|text-primary-700/);
    }
  });

  it('tunes shared sdkwork auth controls inside the notes IAM host wrapper', () => {
    const shellStylesSource = read('packages/sdkwork-notes-shell/src/styles/index.css');
    const authButtonBlock = matchCssBlock(
      shellStylesSource,
      /\[data-notes-iam-screen="auth"\] \[data-sdk-ui="button"\] \{[^}]+\}/s,
    );
    const authInputBlock = matchCssBlock(
      shellStylesSource,
      /\[data-notes-iam-screen="auth"\] \[data-sdk-ui="input"\] \{[^}]+\}/s,
    );
    const authDarkInputBlock = matchCssBlock(
      shellStylesSource,
      /\.dark \[data-notes-iam-screen="auth"\] \[data-sdk-ui="input"\] \{[^}]+\}/s,
    );
    const authOutlineBlock = matchCssBlock(
      shellStylesSource,
      /\[data-notes-iam-screen="auth"\] \.sdk-btn--outline \{[^}]+\}/s,
    );
    const authDarkOutlineBlock = matchCssBlock(
      shellStylesSource,
      /\.dark \[data-notes-iam-screen="auth"\] \.sdk-btn--outline \{[^}]+\}/s,
    );
    const authStatusNoticeBlock = matchCssBlock(
      shellStylesSource,
      /\[data-notes-iam-screen="auth"\] \[data-sdk-ui="status-notice"\] \{[^}]+\}/s,
    );

    expect(shellStylesSource).toMatch(/\[data-notes-iam-screen="auth"\]/);
    expect(shellStylesSource).toMatch(/\[data-notes-iam-screen="auth"\] \.notes-iam-theme/);
    expect(shellStylesSource).toMatch(/\[data-notes-iam-screen="auth"\] \[data-sdk-ui="button"\]/);
    expect(shellStylesSource).toMatch(/\[data-notes-iam-screen="auth"\] \[data-sdk-ui="input"\]/);
    expect(shellStylesSource).toMatch(/\[data-notes-iam-screen="auth"\] \[data-sdk-ui="status-notice"\]/);
    expect(authButtonBlock).toMatch(/box-shadow: none;/);
    expect(authButtonBlock).not.toMatch(/border-radius:/);
    expect(authButtonBlock).not.toMatch(/font-weight:/);
    expect(authInputBlock).toMatch(/border-color: var\(--sdk-color-border-default\);/);
    expect(authInputBlock).toMatch(
      /background: color-mix\(in srgb, var\(--sdk-color-surface-panel\) 92%, transparent\);/,
    );
    expect(authInputBlock).toMatch(/box-shadow: none;/);
    expect(authDarkInputBlock).toMatch(/border-color: var\(--sdk-color-border-default\);/);
    expect(authDarkInputBlock).toMatch(
      /background: color-mix\(in srgb, var\(--sdk-color-surface-panel\) 92%, transparent\);/,
    );
    expect(authDarkInputBlock).toMatch(/box-shadow: none;/);
    expect(authOutlineBlock).toMatch(/border-color: var\(--sdk-color-border-default\);/);
    expect(authOutlineBlock).toMatch(
      /background: color-mix\(in srgb, var\(--sdk-color-surface-panel-muted\) 96%, transparent\);/,
    );
    expect(authDarkOutlineBlock).toMatch(/border-color: var\(--sdk-color-border-default\);/);
    expect(authDarkOutlineBlock).toMatch(
      /background: color-mix\(in srgb, var\(--sdk-color-surface-panel-muted\) 92%, transparent\);/,
    );
    expect(authStatusNoticeBlock).toMatch(/border-radius: var\(--sdk-radius-panel\);/);
  });
});
