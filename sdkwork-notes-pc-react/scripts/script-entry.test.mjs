import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { isDirectCliExecution } from './script-entry.mjs';

test('isDirectCliExecution resolves relative argv[1] paths against the current working directory', () => {
  const workspaceRoot = path.join('D:', 'workspace', 'sdkwork-notes-pc-react');
  const scriptPath = path.join(workspaceRoot, 'scripts', 'run-with-shared-sdk-mode.mjs');

  assert.equal(
    isDirectCliExecution({
      importMetaUrl: pathToFileURL(scriptPath).href,
      argv1: path.join('scripts', 'run-with-shared-sdk-mode.mjs'),
      currentWorkingDir: workspaceRoot,
    }),
    true,
  );
});

test('isDirectCliExecution returns false when argv[1] points to a different file', () => {
  const workspaceRoot = path.join('D:', 'workspace', 'sdkwork-notes-pc-react');
  const scriptPath = path.join(workspaceRoot, 'scripts', 'run-with-shared-sdk-mode.mjs');

  assert.equal(
    isDirectCliExecution({
      importMetaUrl: pathToFileURL(scriptPath).href,
      argv1: path.join('scripts', 'run-cargo-command.mjs'),
      currentWorkingDir: workspaceRoot,
    }),
    false,
  );
});
