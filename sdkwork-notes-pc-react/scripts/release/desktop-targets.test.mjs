import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDesktopReleaseEnv,
  buildDesktopTargetTriple,
  parseDesktopTargetTriple,
  resolveDesktopReleaseTarget,
} from './desktop-targets.mjs';

test('buildDesktopTargetTriple resolves all supported platform and architecture combinations', () => {
  assert.equal(
    buildDesktopTargetTriple({ platform: 'windows', arch: 'x64' }),
    'x86_64-pc-windows-msvc',
  );
  assert.equal(
    buildDesktopTargetTriple({ platform: 'windows', arch: 'arm64' }),
    'aarch64-pc-windows-msvc',
  );
  assert.equal(
    buildDesktopTargetTriple({ platform: 'linux', arch: 'x64' }),
    'x86_64-unknown-linux-gnu',
  );
  assert.equal(
    buildDesktopTargetTriple({ platform: 'linux', arch: 'arm64' }),
    'aarch64-unknown-linux-gnu',
  );
  assert.equal(
    buildDesktopTargetTriple({ platform: 'macos', arch: 'x64' }),
    'x86_64-apple-darwin',
  );
  assert.equal(
    buildDesktopTargetTriple({ platform: 'macos', arch: 'arm64' }),
    'aarch64-apple-darwin',
  );
});

test('parseDesktopTargetTriple returns normalized release metadata for supported targets', () => {
  assert.deepEqual(parseDesktopTargetTriple('aarch64-pc-windows-msvc'), {
    platform: 'windows',
    arch: 'arm64',
    targetTriple: 'aarch64-pc-windows-msvc',
  });

  assert.deepEqual(parseDesktopTargetTriple('x86_64-apple-darwin'), {
    platform: 'macos',
    arch: 'x64',
    targetTriple: 'x86_64-apple-darwin',
  });
});

test('resolveDesktopReleaseTarget prefers explicit target triples before platform and architecture hints', () => {
  assert.deepEqual(
    resolveDesktopReleaseTarget({
      targetTriple: 'aarch64-unknown-linux-gnu',
      platform: 'windows',
      arch: 'x64',
      env: {},
    }),
    {
      platform: 'linux',
      arch: 'arm64',
      targetTriple: 'aarch64-unknown-linux-gnu',
    },
  );
});

test('buildDesktopReleaseEnv forwards the normalized target metadata into environment variables', () => {
  const env = buildDesktopReleaseEnv({
    env: {},
    targetTriple: 'x86_64-pc-windows-msvc',
  });

  assert.equal(env.SDKWORK_DESKTOP_TARGET, 'x86_64-pc-windows-msvc');
  assert.equal(env.SDKWORK_DESKTOP_TARGET_PLATFORM, 'windows');
  assert.equal(env.SDKWORK_DESKTOP_TARGET_ARCH, 'x64');
  assert.equal(env.SDKWORK_SHARED_SDK_MODE, 'git');
});
