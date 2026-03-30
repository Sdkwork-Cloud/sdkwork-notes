import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const workflowPath = path.resolve(
  workspaceRoot,
  '../.github/workflows/sdkwork-notes-desktop-release.yml',
);

test('release workflow publishes desktop bundles with git-backed shared SDK dependencies', () => {
  const workflowSource = fs.readFileSync(workflowPath, 'utf8');

  assert.match(workflowSource, /name:\s+sdkwork-notes-desktop-release/i);
  assert.match(workflowSource, /SDKWORK_SHARED_SDK_MODE:\s+git/);
  assert.match(workflowSource, /SDKWORK_SHARED_SDK_GIT_REF:\s+main/);
  assert.match(workflowSource, /node scripts\/prepare-shared-sdk-git-sources\.mjs/);
  assert.match(workflowSource, /pnpm prepare:shared-sdk/);
  assert.match(workflowSource, /pnpm release:desktop -- --target/);
  assert.match(workflowSource, /uses:\s+softprops\/action-gh-release@v2/);
  assert.match(workflowSource, /runner:\s+windows-2022/);
  assert.match(workflowSource, /runner:\s+windows-11-arm/);
  assert.match(workflowSource, /runner:\s+ubuntu-24\.04/);
  assert.match(workflowSource, /runner:\s+ubuntu-24\.04-arm/);
  assert.match(workflowSource, /runner:\s+macos-15-intel/);
  assert.match(workflowSource, /runner:\s+macos-15/);
  assert.match(workflowSource, /x86_64-pc-windows-msvc/);
  assert.match(workflowSource, /aarch64-pc-windows-msvc/);
  assert.match(workflowSource, /x86_64-unknown-linux-gnu/);
  assert.match(workflowSource, /aarch64-unknown-linux-gnu/);
  assert.match(workflowSource, /x86_64-apple-darwin/);
  assert.match(workflowSource, /aarch64-apple-darwin/);
});
