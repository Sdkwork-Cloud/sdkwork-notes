import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const distDir = path.resolve(process.cwd(), 'packages/sdkwork-notes-desktop/dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(
    indexPath,
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Notes Studio</title></head><body></body></html>\n',
    'utf8',
  );
}
