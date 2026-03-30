import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('desktop startup html contract', () => {
  it('ships an inline startup theme bootstrap to prevent tauri first-paint style glitches', () => {
    const bootstrapDir = path.dirname(fileURLToPath(import.meta.url));
    const indexHtml = fs.readFileSync(
      path.resolve(bootstrapDir, '../../../index.html'),
      'utf8',
    );

    expect(indexHtml).toMatch(/theme-color/);
    expect(indexHtml).toMatch(/sdkwork-notes-app-storage/);
    expect(indexHtml).toMatch(/data-app-platform', 'desktop'/);
    expect(indexHtml).toMatch(/root\.classList\.(add|remove|toggle)\('dark'/);
    expect(indexHtml).toMatch(/#root/);
    expect(indexHtml).toMatch(/color-scheme:/);
  });
});
