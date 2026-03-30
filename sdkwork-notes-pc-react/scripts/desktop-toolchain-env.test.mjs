import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  applyDesktopToolchainEnv,
  resolveWindowsCargoBinDir,
} from './desktop-toolchain-env.mjs';

test('resolveWindowsCargoBinDir resolves the standard cargo bin directory when it exists', () => {
  const cargoBinDir = resolveWindowsCargoBinDir({
    platform: 'win32',
    windowsCargoBinDir: path.join('C:', 'Users', 'admin', '.cargo', 'bin'),
  });

  assert.equal(cargoBinDir, path.join('C:', 'Users', 'admin', '.cargo', 'bin'));
});

test('applyDesktopToolchainEnv prepends the Windows cargo bin directory when PATH is missing it', () => {
  const env = applyDesktopToolchainEnv({
    platform: 'win32',
    windowsCargoBinDir: path.join('C:', 'Users', 'admin', '.cargo', 'bin'),
    env: {
      USERPROFILE: path.join('C:', 'Users', 'admin'),
      PATH: [path.join('C:', 'Windows', 'System32')].join(path.delimiter),
    },
  });

  assert.match(
    env.PATH,
    new RegExp(`^${path.join('C:', 'Users', 'admin', '.cargo', 'bin').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
  );
});

test('applyDesktopToolchainEnv keeps PATH stable when cargo bin is already present', () => {
  const cargoBinDir = path.join('C:', 'Users', 'admin', '.cargo', 'bin');
  const env = applyDesktopToolchainEnv({
    platform: 'win32',
    windowsCargoBinDir: cargoBinDir,
    env: {
      USERPROFILE: path.join('C:', 'Users', 'admin'),
      Path: [cargoBinDir, path.join('C:', 'Windows', 'System32')].join(path.delimiter),
    },
  });

  assert.equal(
    env.Path,
    [cargoBinDir, path.join('C:', 'Windows', 'System32')].join(path.delimiter),
  );
});
