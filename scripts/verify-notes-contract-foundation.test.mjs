import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { verifyNotesContractFoundation } from './verify-notes-contract-foundation.mjs';

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeText(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, value, 'utf8');
}

function openApi(
  paths,
  securitySchemes = { ApiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' } },
  schemas = {}
) {
  return {
    openapi: '3.1.2',
    info: { title: 'Fixture', version: '0.1.0' },
    paths,
    components: {
      securitySchemes,
      schemas: {
        ProblemDetail: {
          type: 'object',
          required: ['type', 'title', 'status'],
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'integer' }
          }
        },
        ...schemas
      }
    }
  };
}

function operation(operationId = 'pages.list') {
  return {
    summary: 'Fixture operation',
    operationId,
    tags: ['notes'],
    security: [{ ApiKey: [] }],
    responses: {
      200: { description: 'OK' }
    },
    'x-sdkwork-owner': 'sdkwork-notes',
    'x-sdkwork-api-authority': 'sdkwork-notes.open'
  };
}

function temporaryContextQueryParameters() {
  return [
    {
      name: 'tenantId',
      in: 'query',
      required: true,
      schema: { type: 'string' }
    },
    {
      name: 'organizationId',
      in: 'query',
      required: true,
      schema: { type: 'string' }
    },
    {
      name: 'operatorId',
      in: 'query',
      required: false,
      schema: { type: 'string' }
    }
  ];
}

function withTemporaryContextQuery(operationValue, { omitContext = false } = {}) {
  return {
    ...operationValue,
    parameters: [
      ...operationValue.parameters ?? [],
      ...omitContext ? [] : temporaryContextQueryParameters()
    ]
  };
}

function withIdempotencyKeyHeader(operationValue, { omitHeader = false } = {}) {
  if (omitHeader) {
    return operationValue;
  }

  return {
    ...operationValue,
    parameters: [
      ...operationValue.parameters ?? [],
      { $ref: '#/components/parameters/IdempotencyKeyHeader' }
    ]
  };
}

function appTemporaryContextRequestSchemas({ omitContext = false } = {}) {
  const contextProperties = omitContext
    ? {}
    : {
      tenantId: { type: 'string' },
      organizationId: { type: 'string' },
      operatorId: { type: 'string' }
    };
  const contextRequired = omitContext ? [] : ['tenantId', 'organizationId', 'operatorId'];

  return {
    CreateWorkspaceRequest: {
      type: 'object',
      additionalProperties: false,
      required: [...contextRequired, 'id', 'name', 'driveSpaceId'],
      properties: {
        ...contextProperties,
        id: { type: 'string' },
        ownerSubjectType: { type: 'string' },
        ownerSubjectId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        driveSpaceId: { type: 'string' },
        defaultPageContentType: { type: 'string' },
        defaultPageSchemaVersion: { type: 'string' },
        aiIndexPolicyCode: { type: 'string' }
      }
    },
    CreatePageRequest: {
      type: 'object',
      additionalProperties: false,
      required: [...contextRequired, 'id', 'title'],
      properties: {
        ...contextProperties,
        id: { type: 'string' },
        title: { type: 'string' },
        pageKind: { type: 'string' },
        parentPageId: { type: 'string' },
        folderDriveNodeId: { type: 'string' },
        initialContent: { type: 'object', additionalProperties: true },
        contentType: { type: 'string' },
        contentSchemaVersion: { type: 'string' },
        changeSummary: { type: 'string' }
      }
    },
    UpdatePageRequest: {
      type: 'object',
      additionalProperties: false,
      required: contextRequired,
      properties: {
        ...contextProperties,
        title: { type: 'string' },
        favorite: { type: 'boolean' },
        archiveStatus: { type: 'string' },
        publishStatus: { type: 'string' },
        expectedVersion: { type: 'string' }
      }
    },
    UpdatePageContentRequest: {
      type: 'object',
      additionalProperties: false,
      required: [...contextRequired, 'content'],
      properties: {
        ...contextProperties,
        content: { type: 'object', additionalProperties: true },
        contentType: { type: 'string' },
        contentSchemaVersion: { type: 'string' },
        changeSummary: { type: 'string' },
        expectedDriveVersionId: { type: 'string' },
        createCheckpoint: { type: 'boolean' }
      }
    },
    CreateAiJobRequest: {
      type: 'object',
      additionalProperties: false,
      required: [...contextRequired, 'workspaceId', 'jobType', 'targetType'],
      properties: {
        ...contextProperties,
        workspaceId: { type: 'string' },
        jobType: { type: 'string' },
        targetType: { type: 'string' },
        targetId: { type: 'string' },
        prompt: { type: 'string' },
        contextPolicy: { type: 'object', additionalProperties: true }
      }
    },
    AiSuggestionDecisionRequest: {
      type: 'object',
      additionalProperties: false,
      required: contextRequired,
      properties: {
        ...contextProperties
      }
    },
    AiSuggestionApplyRequest: {
      type: 'object',
      additionalProperties: false,
      required: contextRequired,
      properties: {
        ...contextProperties,
        expectedDriveVersionId: { type: 'string' },
        createCheckpoint: { type: 'boolean' }
      }
    },
    AiFeedbackCreateRequest: {
      type: 'object',
      additionalProperties: false,
      required: [...contextRequired, 'feedbackType'],
      properties: {
        ...contextProperties,
        feedbackType: { type: 'string' },
        feedbackText: { type: 'string' }
      }
    }
  };
}

async function createFixture(options = {}) {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'notes-contract-'));
  const driveVersionSchemas = options.omitDriveVersionContracts ? {} : {
    PageSummary: {
      type: 'object',
      properties: {
        driveNodeId: { type: 'string' },
        currentDriveVersionNo: { type: 'string' }
      }
    },
    Page: {
      allOf: [
        { $ref: '#/components/schemas/PageSummary' },
        {
          type: 'object',
          properties: {
            driveSpaceId: { type: 'string' },
            driveUri: { type: 'string' },
            currentDriveVersionId: { type: 'string' }
          }
        }
      ]
    },
    PageContent: {
      type: 'object',
      properties: {
        driveNodeId: { type: 'string' },
        driveVersionId: { type: 'string' },
        driveVersionNo: { type: 'string' }
      }
    },
    DriveVersionSummary: {
      type: 'object',
      properties: {
        driveVersionId: { type: 'string' },
        driveVersionNo: { type: 'string' }
      }
    }
  };
  const aiJobStatusProperty = options.omitAiJobStatusEnum
    ? { type: 'string' }
    : {
      type: 'string',
      enum: ['queued', 'running', 'succeeded', 'failed', 'canceled']
    };
  const aiJobSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'workspaceId', 'jobType', 'targetType', 'status', 'createdAt'],
    properties: {
      id: { type: 'string' },
      workspaceId: { type: 'string' },
      jobType: { type: 'string' },
      targetType: { type: 'string' },
      targetId: { type: 'string' },
      status: options.wrongAiJobStatusEnum
        ? { type: 'string', enum: ['proposed', 'accepted', 'applied', 'rejected', 'dismissed'] }
        : aiJobStatusProperty,
      result: { type: 'object', additionalProperties: true },
      sourceCount: { type: 'string' },
      suggestionCount: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  };

  await writeText(
    path.join(rootDir, 'docs/superpowers/specs/2026-06-08-sdkwork-notes-ai-native-design.md'),
    [
      '# Design',
      '',
      'Forbidden new design names:',
      '',
      '```text',
      '/notes/notes',
      'notes_note',
      'notes_note_revision',
      'client.notes.notes.*',
      '```'
    ].join('\n')
  );

  await writeText(
    path.join(rootDir, 'docs/schema-registry/tables/001-notes-core.yaml'),
    options.schemaText ?? (
      options.omitDriveVersionContracts
        ? 'module: notes\ntables:\n  - name: notes_page\n'
        : [
          'module: notes',
          'tables:',
          '  - name: notes_page',
          '    columns:',
          '      - name: drive_space_id',
          '      - name: drive_node_id',
          '      - name: drive_uri',
          '      - name: current_drive_version_id',
          '      - name: current_drive_version_no',
          ''
        ].join('\n')
    )
  );

  await writeText(
    path.join(rootDir, 'docs/schema-registry/tables/003-notes-ai-projections.yaml'),
    options.omitDriveVersionContracts
      ? 'module: notes\ntables:\n  - name: notes_page_search_projection\n'
      : [
        'module: notes',
        'tables:',
        '  - name: notes_page_search_projection',
        '    columns:',
        '      - name: source_drive_version_id',
        '      - name: source_drive_version_no',
        '  - name: notes_ai_job_source',
        '    columns:',
        '      - name: drive_version_id',
        '      - name: drive_version_no',
        ''
      ].join('\n')
  );

  await writeJson(
    path.join(rootDir, 'generated/openapi/notes-app-api.openapi.json'),
    openApi({
      [options.appPath ?? '/app/v3/api/notes/pages']: {
        get: withTemporaryContextQuery(
          operation(options.appOperationId ?? 'pages.list'),
          { omitContext: options.omitAppQueryContextContracts }
        )
      },
      '/app/v3/api/notes/ai_jobs': {
        post: withIdempotencyKeyHeader(operation('aiJobs.create'), {
          omitHeader: options.omitAppIdempotencyKeyHeader
        })
      }
    }, {
      AuthToken: { type: 'http', scheme: 'bearer' },
      AccessToken: { type: 'apiKey', in: 'header', name: 'Access-Token' }
    }, {
      ...driveVersionSchemas,
      AiJob: aiJobSchema,
      ...appTemporaryContextRequestSchemas({
        omitContext: options.omitAppBodyContextContracts
      })
    })
  );
  const appOpenapiPath = path.join(rootDir, 'generated/openapi/notes-app-api.openapi.json');
  const appOpenapi = JSON.parse(await readFile(appOpenapiPath, 'utf8'));
  appOpenapi.components.parameters ??= {};
  appOpenapi.components.parameters.IdempotencyKeyHeader = {
    name: 'Idempotency-Key',
    in: 'header',
    required: true,
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 255
    }
  };
  await writeJson(appOpenapiPath, appOpenapi);

  await writeJson(
    path.join(rootDir, 'generated/openapi/notes-open-api.openapi.json'),
    openApi({
      [options.openPath ?? '/notes/v3/api/pages']: {
        get: operation(options.openOperationId ?? 'pages.list')
      }
    }, undefined, driveVersionSchemas)
  );

  await writeJson(
    path.join(rootDir, 'generated/openapi/notes-backend-api.openapi.json'),
    openApi({
      [options.backendPath ?? '/backend/v3/api/notes/pages']: {
        get: withTemporaryContextQuery(
          operation(options.backendOperationId ?? 'aiJobs.admin.list'),
          { omitContext: options.omitBackendQueryContextContracts }
        )
      }
    }, {
      AuthToken: { type: 'http', scheme: 'bearer' },
      AccessToken: { type: 'apiKey', in: 'header', name: 'Access-Token' }
    }, {
      ...driveVersionSchemas,
      AiJob: aiJobSchema
    })
  );

  await writeJson(
    path.join(rootDir, 'sdks/sdkwork-notes-app-sdk/.sdkwork-assembly.json'),
    {
      workspace: 'sdkwork-notes-app-sdk',
      sdkDependencies: options.omitAppDriveDependency ? [] : [
        {
          workspace: 'sdkwork-drive-app-sdk',
          generatedTransportImportPolicy: 'forbidden'
        }
      ]
    }
  );
  await writeJson(
    path.join(rootDir, 'sdks/sdkwork-notes-backend-sdk/.sdkwork-assembly.json'),
    {
      workspace: 'sdkwork-notes-backend-sdk',
      sdkDependencies: options.omitBackendDriveDependency ? [] : [
        {
          workspace: 'sdkwork-drive-backend-sdk',
          generatedTransportImportPolicy: 'forbidden'
        }
      ]
    }
  );
  await writeJson(
    path.join(rootDir, 'sdks/sdkwork-notes-sdk/.sdkwork-assembly.json'),
    {
      workspace: 'sdkwork-notes-sdk',
      sdkDependencies: []
    }
  );

  return rootDir;
}

test('accepts a healthy contract foundation and ignores explicit forbidden-name documentation', async () => {
  const rootDir = await createFixture();
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.deepEqual(result.findings, []);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects forbidden active contract names outside the design forbidden-name section', async () => {
  const rootDir = await createFixture({
    schemaText: 'module: notes\ntables:\n  - name: notes_note\n'
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'FORBIDDEN_CONTRACT_NAME'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects wrong OpenAPI prefixes and operationIds that repeat the notes tag', async () => {
  const rootDir = await createFixture({
    openPath: '/notes/notes/pages',
    openOperationId: 'notes.pages.list'
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'OPENAPI_PREFIX_MISMATCH'));
    assert.ok(result.findings.some((finding) => finding.code === 'OPENAPI_OPERATION_ID_TAG_PREFIX'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects missing Drive SDK dependencies for app and backend SDK families', async () => {
  const rootDir = await createFixture({
    omitAppDriveDependency: true,
    omitBackendDriveDependency: true
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'APP_SDK_DRIVE_DEPENDENCY_MISSING'));
    assert.ok(result.findings.some((finding) => finding.code === 'BACKEND_SDK_DRIVE_DEPENDENCY_MISSING'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects missing Drive version references in Notes schema and OpenAPI contracts', async () => {
  const rootDir = await createFixture({
    omitDriveVersionContracts: true
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'NOTES_PAGE_DRIVE_VERSION_FIELDS_MISSING'));
    assert.ok(result.findings.some((finding) => finding.code === 'NOTES_AI_SOURCE_DRIVE_VERSION_FIELDS_MISSING'));
    assert.ok(result.findings.some((finding) => finding.code === 'OPENAPI_PAGE_DRIVE_VERSION_FIELDS_MISSING'));
    assert.ok(result.findings.some((finding) => finding.code === 'OPENAPI_PAGE_CONTENT_DRIVE_VERSION_FIELDS_MISSING'));
    assert.ok(result.findings.some((finding) => finding.code === 'OPENAPI_PAGE_VERSION_DRIVE_VERSION_FIELDS_MISSING'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects App API AiJob status enum that does not match implemented job lifecycle states', async () => {
  const rootDir = await createFixture({
    wrongAiJobStatusEnum: true
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'OPENAPI_AI_JOB_STATUS_ENUM_MISMATCH'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects Backend API AiJob status without an enum matching implemented job lifecycle states', async () => {
  const rootDir = await createFixture({
    omitAiJobStatusEnum: true
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'OPENAPI_AI_JOB_STATUS_ENUM_MISMATCH'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects app AI job create contract missing required Idempotency-Key header enforced by Rust handler', async () => {
  const rootDir = await createFixture({
    omitAppIdempotencyKeyHeader: true
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'APP_HEADER_CONTRACT_MISSING'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects app body schemas missing temporary route context fields required by implemented DTOs', async () => {
  const rootDir = await createFixture({
    omitAppBodyContextContracts: true
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'APP_BODY_CONTEXT_CONTRACT_MISSING'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects app body schemas that require fields defaulted by implemented DTOs', async () => {
  const rootDir = await createFixture();
  try {
    const file = path.join(rootDir, 'generated/openapi/notes-app-api.openapi.json');
    const openapi = JSON.parse(await readFile(file, 'utf8'));
    openapi.components.schemas.UpdatePageContentRequest.required.push('contentType');
    await writeJson(file, openapi);

    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'APP_BODY_REQUIRED_CONTRACT_MISMATCH'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects app AI suggestion schemas missing temporary route context fields required by implemented DTOs', async () => {
  const rootDir = await createFixture();
  try {
    const file = path.join(rootDir, 'generated/openapi/notes-app-api.openapi.json');
    const openapi = JSON.parse(await readFile(file, 'utf8'));
    delete openapi.components.schemas.AiFeedbackCreateRequest.properties.tenantId;
    openapi.components.schemas.AiFeedbackCreateRequest.required =
      openapi.components.schemas.AiFeedbackCreateRequest.required.filter((field) => field !== 'tenantId');
    await writeJson(file, openapi);

    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'APP_BODY_CONTEXT_CONTRACT_MISSING'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects implemented App API query operations missing temporary route context parameters required by Rust DTOs', async () => {
  const rootDir = await createFixture({
    omitAppQueryContextContracts: true
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'APP_QUERY_CONTEXT_CONTRACT_MISSING'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('rejects implemented Backend API query operations missing temporary route context parameters required by Rust DTOs', async () => {
  const rootDir = await createFixture({
    omitBackendQueryContextContracts: true
  });
  try {
    const result = await verifyNotesContractFoundation({ rootDir });
    assert.ok(result.findings.some((finding) => finding.code === 'BACKEND_QUERY_CONTEXT_CONTRACT_MISSING'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
