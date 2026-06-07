import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  resolveSharedSdkLocalRepoRoots,
  SHARED_SDK_COMMON_LOCAL_ROOT_ENV_VAR,
} from './shared-sdk-local-roots.mjs';

test('resolveSharedSdkLocalRepoRoots prefers the current SDKWork workspace sibling layout', () => {
  const roots = resolveSharedSdkLocalRepoRoots({
    workspaceRoot: path.join(
      'E:',
      'sdkwork-space',
      'sdkwork-notes',
      'sdkwork-notes-pc-react',
    ),
    env: {},
  });

  assert.equal(
    roots.sdkCommonRepoRoot,
    path.join(
      'E:',
      'sdkwork-space',
      'sdkwork-sdk-commons',
    ),
  );
});

test('resolveSharedSdkLocalRepoRoots falls back to the standalone repo sibling layout outside the monorepo', () => {
  const roots = resolveSharedSdkLocalRepoRoots({
    workspaceRoot: path.join('D:', 'workspace', 'sdkwork-notes', 'sdkwork-notes-pc-react'),
    env: {},
  });

  assert.equal(
    roots.sdkCommonRepoRoot,
    path.join('D:', 'workspace', 'sdkwork-sdk-commons'),
  );
});

test('resolveSharedSdkLocalRepoRoots honors explicit environment overrides', () => {
  const roots = resolveSharedSdkLocalRepoRoots({
    workspaceRoot: path.join('D:', 'workspace', 'sdkwork-notes', 'sdkwork-notes-pc-react'),
    env: {
      [SHARED_SDK_COMMON_LOCAL_ROOT_ENV_VAR]: path.join('E:', 'sdk', 'common'),
    },
  });

  assert.equal(roots.sdkCommonRepoRoot, path.join('E:', 'sdk', 'common'));
});
