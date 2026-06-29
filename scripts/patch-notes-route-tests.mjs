#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const files = [
  'crates/sdkwork-routes-notes-app-api/tests/page_routes.rs',
  'crates/sdkwork-routes-notes-backend-api/tests/ai_job_routes.rs',
];

function stripContextFromUri(uri) {
  return uri
    .replace(/\?tenantId=100001&organizationId=0&operatorId=30&/g, '?')
    .replace(/\?tenantId=100001&organizationId=0&/g, '?')
    .replace(/&tenantId=100001&organizationId=0&operatorId=30/g, '')
    .replace(/\?tenantId=100001&organizationId=0/g, '')
    .replace(/\?tenantId=100001&organizationId=0&operatorId=30/g, '');
}

function stripContextFieldsFromJsonBlocks(source) {
  return source
    .replace(/\n\s*"tenantId": "100001",\n/g, '\n')
    .replace(/\n\s*"organizationId": "0",\n/g, '\n')
    .replace(/\n\s*"operatorId": "30",\n/g, '\n');
}

function ensureEnvelopeHelper(source) {
  if (source.includes('async fn read_envelope_data')) {
    return source;
  }
  return source.replace(
    'async fn read_json(response: axum::response::Response) -> serde_json::Value {',
    `async fn read_envelope_data(response: axum::response::Response) -> serde_json::Value {
    let payload = read_json(response).await;
    assert_eq!(payload["code"], 0);
    payload["data"].clone()
}

async fn read_json(response: axum::response::Response) -> serde_json::Value {`,
  );
}

function swapReadJsonToEnvelope(source) {
  return source.replace(/read_json\(([^)]+)\)\.await/g, 'read_envelope_data($1).await');
}

for (const file of files) {
  let source = await readFile(file, 'utf8');
  source = stripContextFieldsFromJsonBlocks(source);
  source = source.replace(/"uri\(([^)]*)\)"/g, (_, inner) => {
    if (inner.includes('format!')) {
      return `"uri(${inner})"`;
    }
    return `"uri(${stripContextFromUri(inner)})"`;
  });
  source = source.replace(/\.uri\("([^"]+)"\)/g, (_, uri) => `.uri("${stripContextFromUri(uri)}")`);
  source = source.replace(
    /\.uri\(format!\(\s*\n\s*"([^"]+)",/g,
    (match, uriTemplate) => match.replace(uriTemplate, stripContextFromUri(uriTemplate)),
  );
  source = ensureEnvelopeHelper(source);
  source = swapReadJsonToEnvelope(source);
  await writeFile(file, source, 'utf8');
  console.log(`patched ${file}`);
}
