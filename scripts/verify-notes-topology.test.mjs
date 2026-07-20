import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();

async function exists(relativePath) {
  try {
    await stat(path.join(ROOT, relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function read(relativePath) {
  return readFile(path.join(ROOT, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

test('declares v2 topology spec and profile env files for sdkwork-notes', async () => {
  assert.equal(await exists('specs/topology.spec.json'), true);
  assert.equal(await exists('scripts/lib/notes-topology.mjs'), true);
  assert.equal(await exists('scripts/notes-dev.mjs'), true);
  assert.equal(await exists('docs/topology-standard.md'), true);

  const spec = await readJson('specs/topology.spec.json');
  assert.equal(spec.schemaVersion, 2);
  assert.equal(spec.kind, 'sdkwork.app.topology');
  assert.equal(spec.appId, 'sdkwork-notes');
  assert.equal(spec.archetype, 'application-http-gateway');
  assert.equal(spec.defaults.developmentProfileId, 'standalone.split-services.development');
  assert.ok(spec.surfaces['application.public-ingress']);
  assert.ok(spec.surfaces['platform.api-gateway']);

  for (const profileId of [
    'standalone.split-services.development',
    'standalone.unified-process.production',
    'cloud.split-services.development',
    'cloud.split-services.production',
  ]) {
    const profilePath = spec.profileFiles[profileId];
    assert.equal(await exists(profilePath), true, `${profilePath} should exist`);
    const profileEnv = await read(profilePath);
    assert.match(profileEnv, /SDKWORK_NOTES_PROFILE_ID=/);
    assert.match(profileEnv, /VITE_SDKWORK_NOTES_APPLICATION_PUBLIC_HTTP_URL=/);
    assert.match(profileEnv, /VITE_SDKWORK_NOTES_PLATFORM_API_GATEWAY_HTTP_URL=/);
  }
});

test('root package.json wires @sdkwork/app-topology and standard dev scripts', async () => {
  const packageJson = await readJson('package.json');
  assert.equal(packageJson.dependencies['@sdkwork/app-topology'], 'file:../sdkwork-app-topology');
  assert.match(packageJson.scripts.dev, /scripts\/notes-dev\.mjs/);
  assert.match(packageJson.scripts['dev:browser'], /scripts\/notes-dev\.mjs/);
  assert.match(packageJson.scripts['topology:validate'], /sdkwork-topology\.mjs validate/);
});

test('notes dev orchestrator rejects retired --topology flag', async () => {
  const notesDev = await read('scripts/notes-dev.mjs');
  assert.match(notesDev, /--topology is retired/);
});

test('run-notes-standalone-gateway loads topology profile env instead of hardcoded bind defaults', async () => {
  const script = await read('scripts/run-notes-standalone-gateway.mjs');
  assert.match(script, /notes-topology\.mjs/);
  assert.match(script, /loadProfile/);
  assert.doesNotMatch(script, /127\.0\.0\.1:8787/);
});

test('notes standalone-gateway reads application.public-ingress bind env key', async () => {
  const mainRs = await read('crates/sdkwork-api-notes-standalone-gateway/src/main.rs');
  assert.match(mainRs, /SDKWORK_NOTES_APPLICATION_PUBLIC_INGRESS_BIND/);
  assert.doesNotMatch(mainRs, /SDKWORK_NOTES_BIND_ADDRESS/);
});

test('notes standalone-gateway exposes /healthz for topology health waits', async () => {
  const routers = await read('crates/sdkwork-api-notes-standalone-gateway/src/bootstrap/routers.rs');
  const bootstrapMod = await read('crates/sdkwork-api-notes-standalone-gateway/src/bootstrap/mod.rs');
  const usesServiceRouter =
    /service_router\s*\(/u.test(routers) || /service_router\s*\(/u.test(bootstrapMod);
  assert.ok(usesServiceRouter, 'standalone gateway must mount infra via service_router');
});

test('declares cloud gateway config bundles referenced by topology spec', async () => {
  const spec = await readJson('specs/topology.spec.json');
  for (const configFile of spec.packaging.cloudConfigFiles) {
    const configPath = path.join('configs', configFile);
    assert.equal(await exists(configPath), true, `${configPath} should exist`);
  }
});

test('notes dev orchestrator uses orchestration spec and gateway config', async () => {
  const devScript = await read('scripts/notes-dev.mjs');
  assert.match(devScript, /listOrchestrationProcesses/);
  assert.match(devScript, /buildProcessesFromOrchestration/);
  assert.match(devScript, /resolveCloudGatewayConfigPath/);
  assert.match(devScript, /--config/);
});

test('notes standalone-gateway requires topology bind env without hardcoded fallback', async () => {
  const mainRs = await read('crates/sdkwork-api-notes-standalone-gateway/src/main.rs');
  assert.match(mainRs, /SDKWORK_NOTES_APPLICATION_PUBLIC_INGRESS_BIND/);
  assert.doesNotMatch(mainRs, /127\.0\.0\.1:8787/);
});

test('gateway cloud bundle script references topology packaging configs', async () => {
  const bundleScript = await read('scripts/gateway-cloud-bundle.mjs');
  assert.match(bundleScript, /NOTES_CLOUD_GATEWAY_CONFIGS/);
  assert.match(bundleScript, /sdkwork-notes-api-gateway-config-/);
  assert.doesNotMatch(bundleScript, /bridgeLegacyServiceEnv/);
});
