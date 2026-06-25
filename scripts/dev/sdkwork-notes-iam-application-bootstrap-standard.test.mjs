import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const iamRepoRoot = path.resolve(repoRoot, '..', 'sdkwork-iam');

function read(relativePath, root = repoRoot) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const bootstrapSource = read(
  'crates/sdkwork-notes-api-server/src/bootstrap/iam_application_bootstrap.rs',
);
const routersSource = read('crates/sdkwork-notes-api-server/src/bootstrap/routers.rs');
const apiServerCargo = read('crates/sdkwork-notes-api-server/Cargo.toml');
const workspaceCargo = read('Cargo.toml');
const topologySource = read('scripts/lib/notes-topology.mjs');
const sharedBootstrapSource = read(
  'crates/sdkwork-iam-embedded-application-bootstrap/src/runtime.rs',
  iamRepoRoot,
);

assert.match(
  bootstrapSource,
  /ensure_tenant_application_from_app_root_with_env_and_fallback/u,
  'Notes IAM bootstrap must delegate to the shared embedded bootstrap crate.',
);

assert.match(
  bootstrapSource,
  /sdkwork-notes-pc-react/u,
  'Notes IAM bootstrap must resolve the PC React manifest root when repo root has no manifest.',
);

assert.match(
  routersSource,
  /ensure_notes_tenant_application_bootstrap/u,
  'Notes API server must provision tenant applications before building the IAM router.',
);

assert.match(
  routersSource,
  /bootstrap_iam_database_from_env/u,
  'Notes API server must bootstrap IAM schema before tenant application provisioning.',
);

assert.match(
  apiServerCargo,
  /sdkwork_iam_embedded_application_bootstrap/u,
  'API server must depend on sdkwork-iam-embedded-application-bootstrap.',
);

assert.match(
  workspaceCargo,
  /sdkwork-iam-embedded-application-bootstrap/u,
  'Workspace must include sdkwork-iam-embedded-application-bootstrap.',
);

assert.match(
  topologySource,
  /SDKWORK_APP_ROOT:\s*PC_REACT_ROOT/u,
  'Dev topology must inject SDKWORK_APP_ROOT at the PC React manifest root.',
);

assert.match(
  topologySource,
  /SDKWORK_IAM_APP_ROOT:\s*IAM_REPO_ROOT/u,
  'Dev topology must export SDKWORK_IAM_APP_ROOT at the sdkwork-iam repository root for IMF catalog materialization.',
);

assert.match(
  sharedBootstrapSource,
  /SDKWORK_NOTES_APP_ROOT/u,
  'Shared embedded bootstrap must resolve SDKWORK_NOTES_APP_ROOT.',
);

console.log('sdkwork-notes IAM application bootstrap standard passed.');
