import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  resolveSharedSdkLocalRepoRoots,
  SHARED_SDK_APP_LOCAL_ROOT_ENV_VAR,
  SHARED_SDK_COMMON_LOCAL_ROOT_ENV_VAR,
} from './shared-sdk-local-roots.mjs';

test('resolveSharedSdkLocalRepoRoots prefers the embedded monorepo layout when workspace lives under apps/', () => {
  const roots = resolveSharedSdkLocalRepoRoots({
    workspaceRoot: path.join(
      'D:',
      'javasource',
      'spring-ai-plus',
      'spring-ai-plus-business',
      'apps',
      'sdkwork-notes',
      'sdkwork-notes-pc-react',
    ),
    env: {},
  });

  assert.equal(
    roots.appRepoRoot,
    path.join(
      'D:',
      'javasource',
      'spring-ai-plus',
      'spring-ai-plus-business',
      'spring-ai-plus-app-api',
    ),
  );
  assert.equal(
    roots.sdkCommonRepoRoot,
    path.join(
      'D:',
      'javasource',
      'spring-ai-plus',
      'spring-ai-plus-business',
      'sdk',
    ),
  );
});

test('resolveSharedSdkLocalRepoRoots falls back to the standalone repo sibling layout outside the monorepo', () => {
  const roots = resolveSharedSdkLocalRepoRoots({
    workspaceRoot: path.join('D:', 'workspace', 'sdkwork-notes', 'sdkwork-notes-pc-react'),
    env: {},
  });

  assert.equal(
    roots.appRepoRoot,
    path.join('D:', 'workspace', 'spring-ai-plus-app-api'),
  );
  assert.equal(
    roots.sdkCommonRepoRoot,
    path.join('D:', 'workspace', 'sdk'),
  );
});

test('resolveSharedSdkLocalRepoRoots honors explicit environment overrides', () => {
  const roots = resolveSharedSdkLocalRepoRoots({
    workspaceRoot: path.join('D:', 'workspace', 'sdkwork-notes', 'sdkwork-notes-pc-react'),
    env: {
      [SHARED_SDK_APP_LOCAL_ROOT_ENV_VAR]: path.join('E:', 'sdk', 'app'),
      [SHARED_SDK_COMMON_LOCAL_ROOT_ENV_VAR]: path.join('E:', 'sdk', 'common'),
    },
  });

  assert.equal(roots.appRepoRoot, path.join('E:', 'sdk', 'app'));
  assert.equal(roots.sdkCommonRepoRoot, path.join('E:', 'sdk', 'common'));
});
