#!/usr/bin/env node
/**
 * Sync SDKWork web-framework contract metadata into Notes route manifests and OpenAPI authorities.
 * - Route manifests: requestContext + apiSurface per WEB_FRAMEWORK_SPEC.md
 * - OpenAPI: x-sdkwork-request-context + x-sdkwork-api-surface per API_SPEC.md / WEB_FRAMEWORK_SPEC.md
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const ROUTE_MANIFESTS = [
  {
    file: 'sdks/_route-manifests/app-api/sdkwork-router-notes-app-api.route-manifest.json',
    apiSurface: 'app-api',
  },
  {
    file: 'sdks/_route-manifests/backend-api/sdkwork-router-notes-backend-api.route-manifest.json',
    apiSurface: 'backend-api',
  },
];

const OPENAPI_FILES = [
  {
    file: 'apis/app-api/notes/notes-app-api.openapi.json',
    apiSurface: 'app-api',
  },
  {
    file: 'apis/backend-api/notes/notes-backend-api.openapi.json',
    apiSurface: 'backend-api',
  },
  {
    file: 'apis/open-api/notes/notes-open-api.openapi.json',
    apiSurface: 'open-api',
  },
  {
    file: 'generated/openapi/notes-app-api.openapi.json',
    apiSurface: 'app-api',
  },
  {
    file: 'generated/openapi/notes-backend-api.openapi.json',
    apiSurface: 'backend-api',
  },
  {
    file: 'generated/openapi/notes-open-api.openapi.json',
    apiSurface: 'open-api',
  },
];

async function readJson(relativePath) {
  const text = await readFile(path.join(ROOT, relativePath), 'utf8');
  return JSON.parse(text);
}

async function writeJson(relativePath, value) {
  await writeFile(path.join(ROOT, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function syncRouteManifests() {
  for (const { file, apiSurface } of ROUTE_MANIFESTS) {
    const manifest = await readJson(file);
    for (const route of manifest.routes ?? []) {
      route.requestContext = 'WebRequestContext';
      route.apiSurface = apiSurface;
    }
    await writeJson(file, manifest);
  }
}

async function syncOpenApiFiles() {
  const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

  for (const { file, apiSurface } of OPENAPI_FILES) {
    const openapi = await readJson(file);
    for (const pathItem of Object.values(openapi.paths ?? {})) {
      for (const [method, operation] of Object.entries(pathItem ?? {})) {
        if (!methods.has(method)) {
          continue;
        }
        operation['x-sdkwork-request-context'] = 'WebRequestContext';
        operation['x-sdkwork-api-surface'] = apiSurface;
      }
    }
    await writeJson(file, openapi);
  }
}

await syncRouteManifests();
await syncOpenApiFiles();
console.log('Synced Notes route manifests and OpenAPI framework metadata.');
