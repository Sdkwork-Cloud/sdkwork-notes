import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = path.resolve(import.meta.dirname, '../../../../../');

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

describe('main layout architecture contracts', () => {
  it('mounts a top-level MainLayout from AppRoot like claw-studio', () => {
    const mainLayoutPath = path.resolve(
      workspaceRoot,
      'packages/sdkwork-notes-shell/src/application/layouts/MainLayout.tsx',
    );
    const appRootSource = read('packages/sdkwork-notes-shell/src/application/AppRoot.tsx');

    expect(fs.existsSync(mainLayoutPath)).toBe(true);
    expect(appRootSource).toMatch(/MainLayout/);
  });

  it('uses a route-aware main layout so auth and workspace pages get different shell viewports like claw-studio', () => {
    const mainLayoutSource = read('packages/sdkwork-notes-shell/src/application/layouts/MainLayout.tsx');

    expect(mainLayoutSource).toMatch(/if \(isAuthenticationRoute\)/);
    expect(mainLayoutSource).toMatch(/<ShellLayout mode="auth">/);
    expect(mainLayoutSource).toMatch(
      /className="relative z-10 min-h-0 flex-1 overflow-auto scrollbar-hide"/,
    );
    expect(mainLayoutSource).toMatch(/<ShellLayout>/);
    expect(mainLayoutSource).toMatch(
      /className="relative z-10 flex min-h-0 flex-1 overflow-hidden"/,
    );
    expect(mainLayoutSource).toMatch(
      /className="relative z-10 min-w-0 flex-1 overflow-auto scrollbar-hide bg-\[var\(--surface-soft\)\]"/,
    );
  });

  it('keeps ShellLayout outside route definitions so lazy page loading does not replace the shell', () => {
    const appRoutesSource = read('packages/sdkwork-notes-shell/src/application/router/AppRoutes.tsx');

    expect(appRoutesSource).not.toMatch(/import\s+\{\s*ShellLayout\s*\}/);
    expect(appRoutesSource).not.toMatch(/<Route element={<ShellLayout/);
    expect(appRoutesSource).toMatch(/function RouteFallback/);
    expect(appRoutesSource).toMatch(/<Suspense\s+fallback={<RouteFallback \/>}>/);
  });
});
