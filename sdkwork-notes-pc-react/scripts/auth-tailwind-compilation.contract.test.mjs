import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { compile } from 'tailwindcss';

const workspaceRoot = process.cwd();
const shellStylesheetPath = path.resolve(
  workspaceRoot,
  'packages',
  'sdkwork-notes-pc-shell',
  'src',
  'styles',
  'index.css',
);

async function loadTailwindStylesheet(id, base) {
  const resolvedPath = id === 'tailwindcss'
    ? path.resolve(workspaceRoot, 'node_modules', 'tailwindcss', 'index.css')
    : path.resolve(base, id);

  return {
    path: resolvedPath,
    base: path.dirname(resolvedPath),
    content: await fs.readFile(resolvedPath, 'utf8'),
  };
}

test('shared auth Tailwind sources compile into the classes required by the notes IAM host', async () => {
  const shellStylesheetSource = await fs.readFile(shellStylesheetPath, 'utf8');
  const sourceDirectives = shellStylesheetSource
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('@source "'));

  assert.deepEqual(
    sourceDirectives,
    [
      '@source "../../../../";',
      '@source "../../../../../../sdkwork-ui/sdkwork-ui-pc-react/src";',
      '@source "../../../../../../sdkwork-iam/apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react/src";',
    ],
    'Expected notes shell stylesheet to register the workspace root plus shared UI/auth Tailwind scan roots.',
  );

  const compiled = await compile(
    ['@import "tailwindcss";', ...sourceDirectives].join('\n'),
    {
      base: path.dirname(shellStylesheetPath),
      from: shellStylesheetPath,
      loadStylesheet: loadTailwindStylesheet,
    },
  );

  assert.deepEqual(
    compiled.sources,
    [
      {
        base: path.resolve(workspaceRoot, 'packages', 'sdkwork-notes-pc-shell', 'src', 'styles'),
        pattern: '../../../../',
        negated: false,
      },
      {
        base: path.resolve(workspaceRoot, 'packages', 'sdkwork-notes-pc-shell', 'src', 'styles'),
        pattern: '../../../../../../sdkwork-ui/sdkwork-ui-pc-react/src',
        negated: false,
      },
      {
        base: path.resolve(workspaceRoot, 'packages', 'sdkwork-notes-pc-shell', 'src', 'styles'),
        pattern: '../../../../../../sdkwork-iam/apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react/src',
        negated: false,
      },
    ],
    'Expected Tailwind to register the shared notes/UI/auth scan roots from the real shell stylesheet base path.',
  );

  const sampleCss = compiled.build([
    'rounded-[2rem]',
    'rounded-[1.75rem]',
    'lg:min-h-[720px]',
    'lg:w-[42%]',
    'shadow-[0_28px_80px_rgba(24,24,27,0.10)]',
  ]);

  assert.equal(
    sampleCss.includes('.rounded-\\[2rem\\]'),
    true,
    'Expected Tailwind to emit the shared auth outer shell radius class.',
  );
  assert.equal(
    sampleCss.includes('.rounded-\\[1\\.75rem\\]'),
    true,
    'Expected Tailwind to emit the shared auth aside panel radius class.',
  );
  assert.equal(
    sampleCss.includes('.lg\\:min-h-\\[720px\\]'),
    true,
    'Expected Tailwind to emit the shared auth desktop shell minimum-height class.',
  );
  assert.equal(
    sampleCss.includes('.lg\\:w-\\[42\\%\\]'),
    true,
    'Expected Tailwind to emit the shared auth desktop aside width class.',
  );
  assert.equal(
    sampleCss.includes('--tw-shadow: 0 28px 80px var(--tw-shadow-color, rgba(24,24,27,0.10))'),
    true,
    'Expected Tailwind to emit the shared auth shell elevation class.',
  );
});
