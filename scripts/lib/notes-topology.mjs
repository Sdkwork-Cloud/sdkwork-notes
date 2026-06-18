import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildProfileId,
  createTopologyRuntime,
  isTcpPortReachable,
  loadTopologySpec,
  normalizeText,
  waitForHttpHealthy,
} from '@sdkwork/app-topology';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const SPEC_PATH = path.join(REPO_ROOT, 'specs/topology.spec.json');
export const PC_REACT_ROOT = path.join(REPO_ROOT, 'sdkwork-notes-pc-react');
export const API_GATEWAY_REPO = path.resolve(REPO_ROOT, '..', 'sdkwork-api-gateway');

const spec = loadTopologySpec(SPEC_PATH);
const runtime = createTopologyRuntime(spec, REPO_ROOT);

export const VALID_HOSTING = runtime.hostingValues;
export const VALID_SERVICE_LAYOUTS = runtime.serviceLayoutValues;
export const VALID_ENVIRONMENTS = runtime.environmentValues;
export const DEFAULT_DEV_PROFILE_ID = runtime.defaults.developmentProfileId;
export const DEFAULT_PRODUCTION_PROFILE_ID = runtime.defaults.productionProfileId;
export const DEFAULT_BUILD_PROFILE_ID = runtime.defaults.desktopBuildProfileId;
export const DEFAULT_SELF_HOSTED_BUILD_PROFILE_ID = 'self-hosted.unified-process.production';
export const DEFAULT_GATEWAY_BIND = runtime.defaults.gatewayBind;

export const APPLICATION_PUBLIC_INGRESS_PACKAGE_PROFILE = 'application-public-ingress';
export const PLATFORM_CONFIG_BUNDLE_PROFILE = 'platform-config-bundle';

export const GATEWAY_PACKAGE_TARGETS = runtime.listPackageTargets();
export const APPLICATION_PUBLIC_INGRESS_PACKAGE_TARGETS = runtime.listPackageTargetsByProfile(
  APPLICATION_PUBLIC_INGRESS_PACKAGE_PROFILE,
);
export const PLATFORM_CONFIG_BUNDLE_TARGET = runtime.findPackageTarget('platform-config-bundle-tar-gz');
export const NOTES_CLOUD_GATEWAY_CONFIGS = spec.packaging?.cloudConfigFiles ?? [];

export function resolveDefaultAppSdkBaseUrl(profileEnv = {}) {
  return (
    profileEnv.SDKWORK_NOTES_APPLICATION_PUBLIC_HTTP_URL
    ?? profileEnv.VITE_SDKWORK_NOTES_APPLICATION_PUBLIC_HTTP_URL
  );
}

export function resolveDevProfileId(hosting, serviceLayout = 'split-services') {
  runtime.assertHosting(hosting);
  runtime.assertServiceLayout(serviceLayout);
  return buildProfileId(hosting, serviceLayout, 'development');
}

export const loadProfile = runtime.loadProfile;
export const applyProfileEnv = runtime.applyProfileEnv;
export const mergeRuntimeEnv = runtime.mergeRuntimeEnv;
export const loadEnvFile = runtime.loadEnvFile;
export const assertHosting = runtime.assertHosting;
export const assertServiceLayout = runtime.assertServiceLayout;
export const resolveSurfaceHttpUrl = runtime.resolveSurfaceHttpUrl.bind(runtime);
export const resolveSurfaceBind = runtime.resolveSurfaceBind.bind(runtime);
export const shouldAutostartGateway = runtime.shouldAutostartGateway;
export const resolveGatewayBind = runtime.resolveGatewayBind;
export const resolveGatewayBaseUrl = runtime.resolveGatewayBaseUrl;
export const resolveCloudGatewayConfigPath = runtime.resolveCloudGatewayConfigPath;
export const resolveIamDevEnv = runtime.resolveIamDevEnv;

export function findGatewayPackageTarget(targetId) {
  return runtime.findPackageTarget(targetId);
}

export function listGatewayPackageTargets(profile) {
  return runtime.listPackageTargetsByProfile(profile);
}
export const listOrchestrationProcesses = runtime.listOrchestrationProcesses;
export const listHealthSurfaces = runtime.listHealthSurfaces;

export { buildProfileId, normalizeText, isTcpPortReachable, waitForHttpHealthy, spec, runtime };
