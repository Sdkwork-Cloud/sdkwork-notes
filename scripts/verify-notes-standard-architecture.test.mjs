import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();

const STANDARD_ROOT_DIRECTORIES = [
  'apis',
  'apps',
  'crates',
  'database',
  'sdks',
  'jobs',
  'tools',
  'plugins',
  'examples',
  'configs',
  'deployments',
  'scripts',
  'docs',
  'tests',
];

const REQUIRED_WORKSPACE_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'CODEX.md',
  'GEMINI.md',
  'README.md',
  'Cargo.toml',
  'sdkwork.workflow.json',
  '.github/workflows/package.yml',
  '.sdkwork/README.md',
  '.sdkwork/skills/README.md',
  '.sdkwork/plugins/README.md',
  'docs/root-layout.md',
];

const API_INPUTS = [
  'apis/app-api/notes/notes-app-api.openapi.json',
  'apis/backend-api/notes/notes-backend-api.openapi.json',
  'apis/open-api/notes/notes-open-api.openapi.json',
];

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

const WEB_FRAMEWORK_CRATES = [
  'crates/sdkwork-router-notes-app-api/Cargo.toml',
  'crates/sdkwork-router-notes-backend-api/Cargo.toml',
  'crates/sdkwork-router-notes-http-auth/Cargo.toml',
  'crates/sdkwork-notes-api-server/Cargo.toml',
];

function read(relativePath) {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  const text = read(relativePath).replace(/^\uFEFF/u, '');
  return JSON.parse(text);
}

function exists(relativePath) {
  return existsSync(path.join(ROOT, relativePath));
}

test('declares SDKWork standard root directory dictionary', () => {
  for (const directory of STANDARD_ROOT_DIRECTORIES) {
    assert.equal(exists(directory), true, `${directory}/ should exist`);
    assert.equal(exists(path.join(directory, 'README.md')), true, `${directory}/README.md should exist`);
  }
});

test('declares workspace agent entrypoints and packaging workflow', () => {
  for (const file of REQUIRED_WORKSPACE_FILES) {
    assert.equal(exists(file), true, `${file} should exist`);
  }

  const workflow = readJson('sdkwork.workflow.json');
  assert.equal(workflow.app.id, 'sdkwork-notes-pc-react');
  assert.equal(workflow.app.configPath, 'sdkwork-notes-pc-react/sdkwork.app.config.json');
});

test('declares author-owned API contracts under apis/', () => {
  for (const file of API_INPUTS) {
    assert.equal(exists(file), true, `${file} should exist`);
    const openapi = readJson(file);
    assert.equal(openapi.openapi, '3.1.2');
  }
});

test('integrates sdkwork-web-framework in HTTP route crates and api-server', () => {
  const rootCargo = read('Cargo.toml');
  assert.match(rootCargo, /sdkwork-web-core/);
  assert.match(rootCargo, /sdkwork-web-axum/);

  for (const cargoPath of WEB_FRAMEWORK_CRATES) {
    const cargo = read(cargoPath);
    assert.match(cargo, /sdkwork-web-/);
  }

  const authBootstrap = read('crates/sdkwork-notes-api-server/src/bootstrap/auth.rs');
  assert.match(authBootstrap, /wrap_router_with_web_framework_from_env/);
});

test('integrates sdkwork-utils in HTTP route crates', () => {
  const rootCargo = read('Cargo.toml');
  assert.match(rootCargo, /sdkwork-utils-rust/);

  const appRouteCargo = read('crates/sdkwork-router-notes-app-api/Cargo.toml');
  assert.match(appRouteCargo, /sdkwork-utils-rust/);
});

test('integrates sdkwork-utils-typescript in PC React workspace', () => {
  const workspace = read('sdkwork-notes-pc-react/pnpm-workspace.yaml');
  assert.match(workspace, /sdkwork-utils-typescript/);

  const packageJson = readJson('sdkwork-notes-pc-react/package.json');
  assert.match(packageJson.dependencies['@sdkwork/utils'], /workspace:\*/);
});

test('integrates sdkwork-database in api-server bootstrap', () => {
  const apiServerCargo = read('crates/sdkwork-notes-api-server/Cargo.toml');
  assert.match(apiServerCargo, /sdkwork-database-config/);
  assert.match(apiServerCargo, /sdkwork-database-sqlx|sdkwork_database_sqlx/);

  const databaseBootstrap = read('crates/sdkwork-notes-api-server/src/bootstrap/database.rs');
  assert.match(databaseBootstrap, /DatabaseConfig::from_env\("notes"\)/);
});

test('does not declare sdkwork-discovery without RPC services', () => {
  const rootCargo = read('Cargo.toml');
  assert.doesNotMatch(rootCargo, /sdkwork-discovery/);

  const protoFiles = exists('apis/rpc') || exists('crates') && false;
  assert.equal(protoFiles, false);
  assert.equal(exists('apis/rpc'), false, 'RPC contracts should not exist yet');
});

test('route manifests declare WebRequestContext and apiSurface on every route', () => {
  for (const { file, apiSurface } of ROUTE_MANIFESTS) {
    const manifest = readJson(file);
    assert.ok(Array.isArray(manifest.routes) && manifest.routes.length > 0, `${file} should declare routes`);
    for (const route of manifest.routes) {
      assert.equal(route.requestContext, 'WebRequestContext', `${route.method} ${route.path} missing requestContext`);
      assert.equal(route.apiSurface, apiSurface, `${route.method} ${route.path} missing apiSurface`);
    }
  }
});

test('OpenAPI authorities declare x-sdkwork-request-context and x-sdkwork-api-surface', () => {
  const expectations = [
    { file: 'apis/app-api/notes/notes-app-api.openapi.json', apiSurface: 'app-api' },
    { file: 'apis/backend-api/notes/notes-backend-api.openapi.json', apiSurface: 'backend-api' },
    { file: 'apis/open-api/notes/notes-open-api.openapi.json', apiSurface: 'open-api' },
  ];

  const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);

  for (const { file, apiSurface } of expectations) {
    const openapi = readJson(file);
    let operationCount = 0;
    for (const pathItem of Object.values(openapi.paths ?? {})) {
      for (const [method, operation] of Object.entries(pathItem ?? {})) {
        if (!methods.has(method)) {
          continue;
        }
        operationCount += 1;
        assert.equal(operation['x-sdkwork-request-context'], 'WebRequestContext', `${file} ${method} missing x-sdkwork-request-context`);
        assert.equal(operation['x-sdkwork-api-surface'], apiSurface, `${file} ${method} missing x-sdkwork-api-surface`);
      }
    }
    assert.ok(operationCount > 0, `${file} should contain HTTP operations`);
  }
});

test('declares topology and gateway deployment profiles', () => {
  assert.equal(exists('specs/topology.spec.json'), true);
  assert.equal(exists('configs/topology/self-hosted.split-services.development.env'), true);
  assert.equal(exists('configs/sdkwork-api-gateway.notes.development.toml'), true);

  const topology = readJson('specs/topology.spec.json');
  assert.equal(topology.database?.appPrefix, 'SDKWORK_NOTES');
  assert.deepEqual(topology.surfaces?.['application.public-ingress']?.protocols, ['http']);
});

test('PC application root declares sdkwork.app.config.json and component spec', () => {
  assert.equal(exists('sdkwork-notes-pc-react/sdkwork.app.config.json'), true);
  assert.equal(exists('sdkwork-notes-pc-react/specs/component.spec.json'), true);
  assert.equal(exists('sdkwork-notes-pc-react/AGENTS.md'), true);

  const manifest = readJson('sdkwork-notes-pc-react/sdkwork.app.config.json');
  assert.equal(manifest.schemaVersion, 3);
  assert.equal(manifest.kind, 'sdkwork.app');
});

test('Rust HTTP crates follow sdkwork-router-* and sdkwork-notes-api-server naming', () => {
  const expectedMembers = [
    'crates/sdkwork-router-notes-app-api',
    'crates/sdkwork-router-notes-backend-api',
    'crates/sdkwork-router-notes-http-auth',
    'crates/sdkwork-notes-api-server',
    'crates/sdkwork-notes-pages-service',
    'crates/sdkwork-notes-pages-repository-sqlx',
  ];

  const cargo = read('Cargo.toml');
  for (const member of expectedMembers) {
    assert.match(cargo, new RegExp(`"${member.replaceAll('/', '\\/')}"`));
  }
});

test('schema registry documents Notes-owned tables', () => {
  assert.equal(exists('docs/schema-registry/README.md'), true);
  assert.equal(exists('docs/schema-registry/tables/001-notes-core.yaml'), true);
});
