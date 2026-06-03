import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

import {
  createInternalTurboArgs,
  INTERNAL_WORKSPACE_PACKAGES,
} from './run-internal-packages-turbo.mjs';

const workspaceRoot = process.cwd();

function runTurboDryRun(task) {
  const outputPath = path.join(
    os.tmpdir(),
    `sdkwork-notes-turbo-${task}-${process.pid}-${Date.now()}.json`,
  );
  const outputFd = fs.openSync(outputPath, 'w');
  const result = spawnSync('pnpm', createInternalTurboArgs(task, ['--dry=json']), {
    cwd: workspaceRoot,
    shell: process.platform === 'win32',
    stdio: ['ignore', outputFd, 'inherit'],
  });
  fs.closeSync(outputFd);

  const stdout = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, 'utf8')
    : '';
  fs.rmSync(outputPath, { force: true });

  assert.equal(
    result.status,
    0,
    `Expected turbo dry-run for ${task} to succeed.\nSTDOUT:\n${stdout}\nERROR:\n${result.error?.message ?? ''}`,
  );

  const jsonStart = stdout.indexOf('{');
  const jsonEnd = stdout.lastIndexOf('}');

  assert.notEqual(jsonStart, -1, `Expected JSON output for ${task} dry-run.`);
  assert.notEqual(jsonEnd, -1, `Expected JSON output terminator for ${task} dry-run.`);

  return JSON.parse(stdout.slice(jsonStart, jsonEnd + 1));
}

function assertGraphStaysInsideWorkspace(graph, task) {
  const expectedPackages = [...INTERNAL_WORKSPACE_PACKAGES].sort();
  const actualPackages = [...graph.packages].sort();

  assert.deepEqual(
    actualPackages,
    expectedPackages,
    `Expected turbo ${task} graph to only include notes workspace packages.`,
  );

  for (const entry of graph.tasks) {
    assert.doesNotMatch(
      String(entry.directory ?? ''),
      /\.\.[\\/]/,
      `Expected turbo ${task} task ${entry.taskId} to stay inside the notes workspace.`,
    );
    assert.match(
      String(entry.package ?? ''),
      /^@sdkwork\/notes-/,
      `Expected turbo ${task} task ${entry.taskId} to target an internal notes package.`,
    );
  }
}

test('internal turbo build graph excludes external shared sdk packages', () => {
  const graph = runTurboDryRun('build');
  assertGraphStaysInsideWorkspace(graph, 'build');
});

test('internal turbo typecheck graph excludes external shared sdk packages', () => {
  const graph = runTurboDryRun('typecheck');
  assertGraphStaysInsideWorkspace(graph, 'typecheck');
});
