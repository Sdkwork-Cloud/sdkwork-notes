import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { createSharedSdkPackageContext } from './prepare-shared-sdk-packages.mjs';
import {
  createSharedSdkSourceSpecs,
  resolveSourcePackageContainerRoot,
  resolveSourcePackageRoot,
} from './prepare-shared-sdk-git-sources.mjs';

test('git-backed shared sdk source specs align with the package preparation context', () => {
  const context = createSharedSdkPackageContext({
    currentWorkingDir: process.cwd(),
    env: { SDKWORK_SHARED_SDK_MODE: 'git' },
  });
  const specs = createSharedSdkSourceSpecs(context.workspaceRoot);

  const sdkCommonSpec = specs.find((spec) => spec.id === 'sdk-common');

  assert.ok(sdkCommonSpec, 'expected @sdkwork/sdk-common source spec');

  assert.equal(resolveSourcePackageRoot(sdkCommonSpec), context.sharedSdkCommonRoot);
  assert.equal(
    resolveSourcePackageContainerRoot(sdkCommonSpec),
    path.dirname(context.sharedSdkCommonRoot),
  );
  assert.equal(sdkCommonSpec.monorepoSubmodulePath, '');
});
