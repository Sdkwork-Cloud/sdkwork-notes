import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = path.resolve(import.meta.dirname, '../../../../../');

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

describe('desktop app header contracts', () => {
  it('uses a claw-style fixed-height custom header with brand on the left and window controls on the right', () => {
    const appHeaderSource = read('packages/sdkwork-notes-shell/src/application/layouts/AppHeader.tsx');
    const shellLayoutSource = read('packages/sdkwork-notes-shell/src/application/layouts/ShellLayout.tsx');

    expect(appHeaderSource).toMatch(/className="relative flex h-12 items-center px-3 sm:px-4"/);
    expect(appHeaderSource).toMatch(/data-slot="app-header-leading"/);
    expect(appHeaderSource).toMatch(/data-slot="app-header-trailing"/);
    expect(appHeaderSource).toMatch(/DesktopWindowControls variant="header"/);
    expect(appHeaderSource).toMatch(/className="ml-auto flex h-full shrink-0 items-center justify-end gap-2"/);
    expect(appHeaderSource).toMatch(/className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary-600/);
    expect(shellLayoutSource).toMatch(/<AppHeader mode=\{mode\} \/>/);
  });
});
