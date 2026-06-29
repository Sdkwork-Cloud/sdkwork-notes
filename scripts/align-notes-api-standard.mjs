#!/usr/bin/env node
/**
 * Align Notes OpenAPI authorities with API_SPEC context-selector and SdkWorkApiResponse rules.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { migrateOpenApiDocument } from '../../sdkwork-specs/tools/lib/migrate-openapi-legacy-envelope.mjs';

const ROOT = process.cwd();
const OPENAPI_FILES = [
  'apis/app-api/notes/notes-app-api.openapi.json',
  'apis/backend-api/notes/notes-backend-api.openapi.json',
  'apis/open-api/notes/notes-open-api.openapi.json',
];

const FORBIDDEN_PARAM_REFS = new Set([
  '#/components/parameters/TenantIdQuery',
  '#/components/parameters/OrganizationIdQuery',
  '#/components/parameters/OperatorIdQuery',
]);

const FORBIDDEN_BODY_FIELDS = new Set(['tenantId', 'organizationId', 'operatorId']);

function stripForbiddenParameters(operation) {
  if (!Array.isArray(operation.parameters)) {
    return;
  }
  operation.parameters = operation.parameters.filter((parameter) => {
    const ref = parameter?.$ref;
    if (ref && FORBIDDEN_PARAM_REFS.has(ref)) {
      return false;
    }
    const name = parameter?.name;
    return !FORBIDDEN_BODY_FIELDS.has(name);
  });
  if (operation.parameters.length === 0) {
    delete operation.parameters;
  }
}

function stripForbiddenBodyFields(schema) {
  if (!schema || typeof schema !== 'object') {
    return;
  }
  if (Array.isArray(schema.allOf)) {
    for (const part of schema.allOf) {
      stripForbiddenBodyFields(part);
    }
  }
  if (schema.properties) {
    for (const key of FORBIDDEN_BODY_FIELDS) {
      delete schema.properties[key];
    }
    if (Array.isArray(schema.required)) {
      schema.required = schema.required.filter((field) => !FORBIDDEN_BODY_FIELDS.has(field));
      if (schema.required.length === 0) {
        delete schema.required;
      }
    }
  }
}

function stripForbiddenRequestBodies(openapi) {
  for (const pathItem of Object.values(openapi.paths ?? {})) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== 'object' || !operation.requestBody) {
        continue;
      }
      const content = operation.requestBody.content?.['application/json'];
      if (content?.schema) {
        stripForbiddenBodyFields(content.schema);
      }
    }
  }
  for (const schema of Object.values(openapi.components?.schemas ?? {})) {
    if (schema?.['x-sdkwork-request-body'] || schema?.title?.endsWith('Request')) {
      stripForbiddenBodyFields(schema);
    }
    stripForbiddenBodyFields(schema);
  }
}

function stripForbiddenComponents(openapi) {
  const parameters = openapi.components?.parameters;
  if (parameters) {
    delete parameters.TenantIdQuery;
    delete parameters.OrganizationIdQuery;
    delete parameters.OperatorIdQuery;
  }
}

async function alignFile(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const openapi = JSON.parse(await readFile(filePath, 'utf8'));

  for (const pathItem of Object.values(openapi.paths ?? {})) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== 'object') {
        continue;
      }
      stripForbiddenParameters(operation);
    }
  }

  stripForbiddenRequestBodies(openapi);
  stripForbiddenComponents(openapi);

  const migrated = migrateOpenApiDocument(openapi);
  await writeFile(filePath, `${JSON.stringify(migrated, null, 2)}\n`, 'utf8');
  console.log(`aligned ${relativePath}`);
}

for (const file of OPENAPI_FILES) {
  await alignFile(file);
}

try {
  execFileSync(
    'node',
    [path.join(ROOT, '../sdkwork-specs/tools/check-api-response-envelope.mjs'), '--workspace', ROOT],
    { stdio: 'inherit' },
  );
} catch {
  process.exitCode = 1;
}
