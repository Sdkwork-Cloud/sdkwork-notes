import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = path.resolve(import.meta.dirname, '../../../../../');

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

describe('desktop layout contracts', () => {
  it('keeps auth pages aligned with the shell viewport instead of recreating full-screen pages', () => {
    const authPageSource = read('packages/sdkwork-notes-auth/src/pages/AuthPage.tsx');
    const oauthCallbackPageSource = read('packages/sdkwork-notes-auth/src/pages/AuthOAuthCallbackPage.tsx');

    expect(authPageSource).toMatch(/className="relative flex min-h-full items-center justify-center p-4 sm:p-8"/);
    expect(authPageSource).not.toMatch(/min-h-screen/);
    expect(oauthCallbackPageSource).toMatch(/className="relative flex min-h-full items-center justify-center p-4 sm:p-8"/);
    expect(oauthCallbackPageSource).not.toMatch(/min-h-screen/);
  });

  it('keeps workspace and account pages bound to the shell height model used by claw-studio', () => {
    const notesWorkspaceSource = read('packages/sdkwork-notes-notes/src/pages/NotesWorkspacePage.tsx');
    const accountPageSource = read('packages/sdkwork-notes-user/src/AccountPage.tsx');

    expect(notesWorkspaceSource).toMatch(
      /className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent text-\[var\(--text-primary\)\]"/,
    );
    expect(notesWorkspaceSource).not.toMatch(/min-h-screen/);
    expect(accountPageSource).toMatch(/className="h-full overflow-y-auto scrollbar-hide"/);
  });

  it('ships the claw-style scrollbar utilities needed by the desktop shell', () => {
    const shellStylesSource = read('packages/sdkwork-notes-shell/src/styles/index.css');

    expect(shellStylesSource).toMatch(/scrollbar-width:\s*thin/);
    expect(shellStylesSource).toMatch(/\.scrollbar-hide/);
  });
});
