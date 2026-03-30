import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('desktop startup window contract', () => {
  it('keeps the tauri window hidden until the custom shell is ready to reveal it', () => {
    const bootstrapDir = path.dirname(fileURLToPath(import.meta.url));
    const tauriConfigSource = fs.readFileSync(
      path.resolve(bootstrapDir, '../../../src-tauri/tauri.conf.json'),
      'utf8',
    );
    const bootstrapSource = fs.readFileSync(
      path.resolve(bootstrapDir, './DesktopBootstrapApp.tsx'),
      'utf8',
    );
    const createDesktopAppSource = fs.readFileSync(
      path.resolve(bootstrapDir, './createDesktopApp.tsx'),
      'utf8',
    );

    expect(tauriConfigSource).toMatch(/"visible":\s*false/);
    expect(tauriConfigSource).toMatch(/"decorations":\s*false/);
    expect(tauriConfigSource).toMatch(/"devUrl":\s*"http:\/\/127\.0\.0\.1:1430"/);
    expect(bootstrapSource).toMatch(/getDesktopWindow/);
    expect(bootstrapSource).toMatch(/DesktopStartupScreen/);
    expect(bootstrapSource).toMatch(/shouldRenderShell/);
    expect(bootstrapSource).toMatch(/isStartupVisible/);
    expect(bootstrapSource).toMatch(/setIsStartupVisible/);
    expect(bootstrapSource).toMatch(/desktopWindow\.show\(\)/);
    expect(bootstrapSource).toMatch(/desktopWindow\.setFocus\(\)/);
    expect(bootstrapSource).toMatch(/requestAnimationFrame/);
    expect(createDesktopAppSource).not.toMatch(/React\.StrictMode/);
  });
});
