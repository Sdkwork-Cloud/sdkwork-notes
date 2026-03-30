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

  const appSdkSpec = specs.find((spec) => spec.id === 'app-sdk');
  const sdkCommonSpec = specs.find((spec) => spec.id === 'sdk-common');

  assert.ok(appSdkSpec, 'expected @sdkwork/app-sdk source spec');
  assert.ok(sdkCommonSpec, 'expected @sdkwork/sdk-common source spec');

  assert.equal(resolveSourcePackageRoot(appSdkSpec), context.sharedAppSdkRoot);
  assert.equal(
    resolveSourcePackageContainerRoot(appSdkSpec),
    path.dirname(context.sharedAppSdkRoot),
  );
  assert.equal(appSdkSpec.monorepoSubmodulePath, 'sdkwork-sdk-app');

  assert.equal(resolveSourcePackageRoot(sdkCommonSpec), context.sharedSdkCommonRoot);
  assert.equal(
    resolveSourcePackageContainerRoot(sdkCommonSpec),
    path.dirname(context.sharedSdkCommonRoot),
  );
  assert.equal(sdkCommonSpec.monorepoSubmodulePath, 'sdkwork-sdk-commons');
});
