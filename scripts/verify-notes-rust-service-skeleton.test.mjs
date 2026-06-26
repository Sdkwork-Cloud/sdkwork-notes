import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
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

async function absoluteExists(absolutePath) {
  try {
    await stat(absolutePath);
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

async function walk(relativePath) {
  if (!(await exists(relativePath))) {
    return [];
  }

  const absolutePath = path.join(ROOT, relativePath);
  const metadata = await stat(absolutePath);
  if (metadata.isFile()) {
    return [relativePath];
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const childPath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(childPath));
    } else if (entry.isFile()) {
      files.push(childPath);
    }
  }
  return files;
}

test('declares root Rust workspace service and app-api route crates for Notes runtime phases', async () => {
  assert.equal(await exists('Cargo.toml'), true, 'root Cargo.toml should exist');

  const cargo = await read('Cargo.toml');
  assert.match(cargo, /\[workspace\]/);
  assert.match(cargo, /"crates\/sdkwork-notes-pages-service"/);
  assert.match(cargo, /"crates\/sdkwork-notes-pages-repository-sqlx"/);
  assert.match(cargo, /"crates\/sdkwork-routes-notes-app-api"/);
  assert.match(cargo, /"crates\/sdkwork-routes-notes-backend-api"/);
  assert.doesNotMatch(cargo, /packages\/native-rust/);
  assert.doesNotMatch(cargo, /sdkwork-routes-notes/);

  const productCargo = await read('crates/sdkwork-notes-pages-service/Cargo.toml');
  assert.match(productCargo, /name\s*=\s*"sdkwork-notes-pages-service"/);

  const repositoryCargo = await read('crates/sdkwork-notes-pages-repository-sqlx/Cargo.toml');
  assert.match(repositoryCargo, /name\s*=\s*"sdkwork-notes-pages-repository-sqlx"/);

  const appApiCargo = await read('crates/sdkwork-routes-notes-app-api/Cargo.toml');
  assert.match(appApiCargo, /name\s*=\s*"sdkwork-routes-notes-app-api"/);
  assert.match(appApiCargo, /name\s*=\s*"sdkwork_routes_notes_app_api"/);

  const backendApiCargo = await read('crates/sdkwork-routes-notes-backend-api/Cargo.toml');
  assert.match(backendApiCargo, /name\s*=\s*"sdkwork-routes-notes-backend-api"/);
  assert.match(backendApiCargo, /name\s*=\s*"sdkwork_routes_notes_backend_api"/);
});

test('does not create generated SDK transport output inside Notes SDK families', async () => {
  const generatedTransportRoots = [
    'sdks/sdkwork-notes-sdk/generated/server-openapi',
    'sdks/sdkwork-notes-app-sdk/generated/server-openapi',
    'sdks/sdkwork-notes-backend-sdk/generated/server-openapi'
  ];

  for (const relativePath of generatedTransportRoots) {
    assert.equal(
      await exists(relativePath),
      false,
      `${relativePath} must stay absent until canonical sdkgen output is produced`
    );
  }
});

test('declares component specs for new Rust service crates', async () => {
  for (const relativePath of [
    'crates/sdkwork-notes-pages-service/specs/component.spec.json',
    'crates/sdkwork-notes-pages-repository-sqlx/specs/component.spec.json',
    'crates/sdkwork-routes-notes-app-api/specs/component.spec.json',
    'crates/sdkwork-routes-notes-backend-api/specs/component.spec.json'
  ]) {
    assert.equal(await exists(relativePath), true, `${relativePath} should exist`);
    const componentSpec = await readJson(relativePath);
    assert.equal(componentSpec.kind, 'sdkwork.component.spec');
    assert.ok(componentSpec.canonicalSpecs.some((spec) => spec.file === 'CODE_STYLE_SPEC.md'));
    assert.ok(componentSpec.canonicalSpecs.some((spec) => spec.file === 'NAMING_SPEC.md'));
    assert.ok(componentSpec.canonicalSpecs.some((spec) => spec.file === 'RUST_CODE_SPEC.md'));
    assert.deepEqual(componentSpec.contracts.dependencyApiExports, []);
    for (const canonicalSpec of componentSpec.canonicalSpecs) {
      const specPath = path.resolve(ROOT, path.dirname(relativePath), canonicalSpec.path);
      assert.equal(
        await absoluteExists(specPath),
        true,
        `${relativePath} canonical spec path should resolve: ${canonicalSpec.path}`
      );
    }
  }
});

test('declares a route manifest artifact aligned with the Notes App OpenAPI authority', async () => {
  const manifestPath = 'sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json';
  assert.equal(await exists(manifestPath), true, `${manifestPath} should exist`);

  const manifest = await readJson(manifestPath);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.kind, 'sdkwork.route.manifest');
  assert.equal(manifest.packageName, 'sdkwork-routes-notes-app-api');
  assert.equal(manifest.surface, 'app-api');
  assert.equal(manifest.owner, 'sdkwork-notes');
  assert.equal(manifest.domain, 'notes');
  assert.equal(manifest.capability, 'notes');
  assert.equal(manifest.apiAuthority, 'sdkwork-notes-app-api');
  assert.equal(manifest.sdkFamily, 'sdkwork-notes-app-sdk');
  assert.equal(manifest.prefix, '/app/v3/api');
  assert.deepEqual(manifest.source, {
    crateRoot: 'crates/sdkwork-routes-notes-app-api',
    crateImport: 'sdkwork_routes_notes_app_api'
  });

  const componentSpec = await readJson('crates/sdkwork-routes-notes-app-api/specs/component.spec.json');
  assert.equal(componentSpec.component.type, 'rust-route-crate');
  assert.equal(componentSpec.contracts.routeManifest, '../../../sdks/_route-manifests/app-api/sdkwork-routes-notes-app-api.route-manifest.json');

  const openapi = await readJson('apis/app-api/notes/notes-app-api.openapi.json');
  const openapiOperations = new Map();
  for (const [apiPath, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        continue;
      }
      openapiOperations.set(`${method.toUpperCase()} ${apiPath}`, operation);
    }
  }

  const expectedImplementedOperations = new Set([
    'GET /app/v3/api/notes/workspaces',
    'POST /app/v3/api/notes/workspaces',
    'GET /app/v3/api/notes/workspaces/{workspaceId}/bootstrap',
    'GET /app/v3/api/notes/workspaces/{workspaceId}/pages',
    'POST /app/v3/api/notes/workspaces/{workspaceId}/pages',
    'GET /app/v3/api/notes/pages/{pageId}',
    'PATCH /app/v3/api/notes/pages/{pageId}',
    'POST /app/v3/api/notes/pages/{pageId}/remote_apply',
    'GET /app/v3/api/notes/pages/{pageId}/content',
    'PUT /app/v3/api/notes/pages/{pageId}/content',
    'GET /app/v3/api/notes/pages/{pageId}/versions',
    'POST /app/v3/api/notes/pages/{pageId}/versions/{driveVersionId}/restore',
    'GET /app/v3/api/notes/pages/{pageId}/ai_suggestions',
    'POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/accept',
    'POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/reject',
    'POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/apply',
    'POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/feedback',
    'GET /app/v3/api/notes/search',
    'POST /app/v3/api/notes/ai_jobs'
  ]);

  const manifestOperations = new Map();
  for (const route of manifest.routes ?? []) {
    const key = `${route.method} ${route.path}`;
    manifestOperations.set(key, route);
    assert.ok(expectedImplementedOperations.has(key), `${key} is not an implemented App API operation`);
    assert.ok(route.handler?.module, `${key} should declare handler.module`);
    assert.ok(route.handler?.name, `${key} should declare handler.name`);
    assert.deepEqual(route.ownership, {
      owner: 'sdkwork-notes',
      apiAuthority: 'sdkwork-notes-app-api'
    });
    assert.equal(route.auth?.mode, 'dual-token');
    assert.equal(route.requestContext, 'WebRequestContext');
    assert.equal(route.apiSurface, 'app-api');
  }

  assert.deepEqual(new Set(manifestOperations.keys()), expectedImplementedOperations);

  for (const [key, route] of manifestOperations) {
    const operation = openapiOperations.get(key);
    assert.ok(operation, `${key} should exist in apis/app-api/notes/notes-app-api.openapi.json`);
    assert.equal(route.operationId, operation.operationId);
    assert.equal(route.ownership.owner, operation['x-sdkwork-owner']);
    assert.equal(operation['x-sdkwork-api-authority'], 'sdkwork-notes-app-api');
  }
});

test('declares a backend route manifest artifact aligned with the Notes Backend OpenAPI authority', async () => {
  const manifestPath = 'sdks/_route-manifests/backend-api/sdkwork-routes-notes-backend-api.route-manifest.json';
  assert.equal(await exists(manifestPath), true, `${manifestPath} should exist`);

  const manifest = await readJson(manifestPath);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.kind, 'sdkwork.route.manifest');
  assert.equal(manifest.packageName, 'sdkwork-routes-notes-backend-api');
  assert.equal(manifest.surface, 'backend-api');
  assert.equal(manifest.owner, 'sdkwork-notes');
  assert.equal(manifest.domain, 'notes');
  assert.equal(manifest.capability, 'notes');
  assert.equal(manifest.apiAuthority, 'sdkwork-notes-backend-api');
  assert.equal(manifest.sdkFamily, 'sdkwork-notes-backend-sdk');
  assert.equal(manifest.prefix, '/backend/v3/api');
  assert.deepEqual(manifest.source, {
    crateRoot: 'crates/sdkwork-routes-notes-backend-api',
    crateImport: 'sdkwork_routes_notes_backend_api'
  });

  const componentSpec = await readJson('crates/sdkwork-routes-notes-backend-api/specs/component.spec.json');
  assert.equal(componentSpec.component.type, 'rust-route-crate');
  assert.equal(componentSpec.contracts.routeManifest, '../../../sdks/_route-manifests/backend-api/sdkwork-routes-notes-backend-api.route-manifest.json');

  const openapi = await readJson('apis/backend-api/notes/notes-backend-api.openapi.json');
  const openapiOperations = new Map();
  for (const [apiPath, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        continue;
      }
      openapiOperations.set(`${method.toUpperCase()} ${apiPath}`, operation);
    }
  }

  const expectedImplementedOperations = new Set([
    'GET /backend/v3/api/notes/ai_jobs',
    'GET /backend/v3/api/notes/ai_jobs/{aiJobId}',
    'POST /backend/v3/api/notes/ai_jobs/{aiJobId}/cancel',
    'POST /backend/v3/api/notes/ai_jobs/{aiJobId}/claim',
    'POST /backend/v3/api/notes/ai_jobs/{aiJobId}/complete',
    'POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/accept',
    'POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/reject',
    'POST /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/apply',
    'GET /backend/v3/api/notes/ai_suggestions/{aiSuggestionId}/feedback'
  ]);

  const manifestOperations = new Map();
  for (const route of manifest.routes ?? []) {
    const key = `${route.method} ${route.path}`;
    manifestOperations.set(key, route);
    assert.ok(expectedImplementedOperations.has(key), `${key} is not an implemented Backend API operation`);
    assert.ok(route.handler?.module, `${key} should declare handler.module`);
    assert.ok(route.handler?.name, `${key} should declare handler.name`);
    assert.deepEqual(route.ownership, {
      owner: 'sdkwork-notes',
      apiAuthority: 'sdkwork-notes-backend-api'
    });
    assert.equal(route.auth?.mode, 'dual-token');
    assert.equal(route.requestContext, 'WebRequestContext');
    assert.equal(route.apiSurface, 'backend-api');
  }

  assert.deepEqual(new Set(manifestOperations.keys()), expectedImplementedOperations);

  for (const [key, route] of manifestOperations) {
    const operation = openapiOperations.get(key);
    assert.ok(operation, `${key} should exist in apis/backend-api/notes/notes-backend-api.openapi.json`);
    assert.equal(route.operationId, operation.operationId);
    assert.equal(route.ownership.owner, operation['x-sdkwork-owner']);
    assert.equal(operation['x-sdkwork-api-authority'], 'sdkwork-notes-backend-api');
  }
});

test('keeps Notes service source free of Drive-owned storage lifecycle terms', async () => {
  const files = [
    ...await walk('services'),
    ...await walk('crates')
  ]
    .filter((file) => /[\\/]src[\\/].*\.(rs|sql)$/.test(file));
  assert.ok(files.length > 0, 'service source files should be discoverable');

  const forbiddenPatterns = [
    { label: ['storage', 'object'].join('_'), regex: new RegExp(['storage', 'object'].join('_'), 'i') },
    { label: ['upload', 'session'].join('_'), regex: new RegExp(['upload', 'session'].join('_'), 'i') },
    { label: 'buck' + 'et', regex: new RegExp('buck' + 'et', 'i') },
    { label: ['object', 'key'].join('_'), regex: new RegExp(['object', 'key'].join('_'), 'i') },
    { label: ['notes', 'note'].join('_'), regex: new RegExp(['notes', 'note'].join('_'), 'i') },
    { label: ['notes', 'revision'].join('_'), regex: new RegExp(['notes', 'revision'].join('_'), 'i') },
    { label: '/notes/' + 'notes', regex: new RegExp('/notes/' + 'notes', 'i') }
  ];

  const driveAdapterAllowlist = new Set([
    'crates/sdkwork-notes-api-server/src/bootstrap/drive_app_sdk_facade.rs',
  ]);

  const findings = [];
  for (const file of files) {
    const normalized = file.replaceAll('\\', '/');
    if (driveAdapterAllowlist.has(normalized)) {
      continue;
    }
    const text = await read(file);
    for (const pattern of forbiddenPatterns) {
      if (pattern.regex.test(text)) {
        findings.push(`${file}: ${pattern.label}`);
      }
    }
  }

  assert.deepEqual(findings, []);
});
