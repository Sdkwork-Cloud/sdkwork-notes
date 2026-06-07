import fs from 'node:fs';
import path from 'node:path';

export const SHARED_SDK_COMMON_LOCAL_ROOT_ENV_VAR = 'SDKWORK_SHARED_SDK_COMMON_LOCAL_ROOT';

function isEmbeddedMonorepoLayout(workspaceRoot) {
  return path.basename(path.dirname(path.dirname(workspaceRoot))) === 'apps';
}

function createRepoRootCandidates(workspaceRoot, repoDirName) {
  const standaloneCandidate = path.resolve(workspaceRoot, `../../${repoDirName}`);
  const monorepoCandidate = path.resolve(workspaceRoot, `../../../${repoDirName}`);

  if (isEmbeddedMonorepoLayout(workspaceRoot)) {
    return [monorepoCandidate, standaloneCandidate];
  }

  return [standaloneCandidate, monorepoCandidate];
}

function resolveRepoRootFromCandidates(candidates) {
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

export function resolveSharedSdkLocalRepoRoots({
  workspaceRoot,
  env = process.env,
} = {}) {
  const explicitCommonRoot = typeof env?.[SHARED_SDK_COMMON_LOCAL_ROOT_ENV_VAR] === 'string'
    ? env[SHARED_SDK_COMMON_LOCAL_ROOT_ENV_VAR].trim()
    : '';

  const sdkCommonRepoRoot = explicitCommonRoot.length > 0
    ? path.resolve(explicitCommonRoot)
    : resolveRepoRootFromCandidates(createRepoRootCandidates(workspaceRoot, 'sdkwork-sdk-commons'));

  return {
    sdkCommonRepoRoot,
  };
}
