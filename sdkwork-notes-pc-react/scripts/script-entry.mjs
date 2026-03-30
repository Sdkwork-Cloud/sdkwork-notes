import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function isDirectCliExecution({
  importMetaUrl,
  argv1 = process.argv[1],
  currentWorkingDir = process.cwd(),
} = {}) {
  if (typeof importMetaUrl !== 'string' || importMetaUrl.trim().length === 0) {
    return false;
  }

  if (typeof argv1 !== 'string' || argv1.trim().length === 0) {
    return false;
  }

  return path.resolve(currentWorkingDir, argv1) === path.resolve(fileURLToPath(importMetaUrl));
}
