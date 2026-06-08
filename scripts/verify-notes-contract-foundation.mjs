import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace']);

const OPENAPI_AUTHORITIES = [
  {
    file: 'generated/openapi/notes-app-api.openapi.json',
    prefix: '/app/v3/api/notes',
    surface: 'app-api',
    apiAuthority: 'sdkwork-notes-app-api',
    requiredSecuritySchemes: ['AuthToken', 'AccessToken']
  },
  {
    file: 'generated/openapi/notes-open-api.openapi.json',
    prefix: '/notes/v3/api',
    surface: 'open-api',
    apiAuthority: 'sdkwork-notes-open-api',
    requiredSecuritySchemes: ['ApiKey']
  },
  {
    file: 'generated/openapi/notes-backend-api.openapi.json',
    prefix: '/backend/v3/api/notes',
    surface: 'backend-api',
    apiAuthority: 'sdkwork-notes-backend-api',
    requiredSecuritySchemes: ['AuthToken', 'AccessToken']
  }
];

const FORBIDDEN_CONTRACT_PATTERNS = [
  {
    label: '/notes/notes',
    regex: /\/notes\/notes/g
  },
  {
    label: 'notes_note_revision',
    regex: /(?<![A-Za-z0-9_])notes_note_revision(?![A-Za-z0-9_])/g
  },
  {
    label: 'notes_note',
    regex: /(?<![A-Za-z0-9_])notes_note(?![A-Za-z0-9_])/g
  },
  {
    label: 'client.notes.notes',
    regex: /client\.notes\.notes/g
  }
];

const SCHEMA_DRIVE_OWNERSHIP_PATTERNS = [
  {
    label: 'storage_object',
    regex: /(?<![A-Za-z0-9_])storage_object(?![A-Za-z0-9_])/g
  },
  {
    label: 'upload_session',
    regex: /(?<![A-Za-z0-9_])upload_session(?![A-Za-z0-9_])/g
  },
  {
    label: 'bucket',
    regex: /(?<![A-Za-z0-9_])bucket(?![A-Za-z0-9_])/g
  },
  {
    label: 'object_key',
    regex: /(?<![A-Za-z0-9_])object_key(?![A-Za-z0-9_])/g
  }
];

const DESIGN_SPEC = 'docs/superpowers/specs/2026-06-08-sdkwork-notes-ai-native-design.md';
const NOTES_CORE_SCHEMA = 'docs/schema-registry/tables/001-notes-core.yaml';
const NOTES_AI_PROJECTIONS_SCHEMA = 'docs/schema-registry/tables/003-notes-ai-projections.yaml';

const REQUIRED_PAGE_DRIVE_FIELDS = [
  'drive_space_id',
  'drive_node_id',
  'drive_uri',
  'current_drive_version_id',
  'current_drive_version_no'
];

const REQUIRED_AI_SOURCE_DRIVE_VERSION_FIELDS = [
  'source_drive_version_id',
  'source_drive_version_no',
  'drive_version_id',
  'drive_version_no'
];

const REQUIRED_AI_JOB_STATUS_VALUES = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'canceled'
];

const APP_BODY_SCHEMA_REQUIREMENTS = [
  {
    schemaName: 'CreateWorkspaceRequest',
    properties: [
      'tenantId',
      'organizationId',
      'operatorId',
      'id',
      'ownerSubjectType',
      'ownerSubjectId',
      'name',
      'description',
      'driveSpaceId',
      'defaultPageContentType',
      'defaultPageSchemaVersion',
      'aiIndexPolicyCode'
    ],
    required: ['tenantId', 'organizationId', 'operatorId', 'id', 'name', 'driveSpaceId']
  },
  {
    schemaName: 'CreatePageRequest',
    properties: [
      'tenantId',
      'organizationId',
      'operatorId',
      'id',
      'title',
      'pageKind',
      'parentPageId',
      'folderDriveNodeId',
      'initialContent',
      'contentType',
      'contentSchemaVersion',
      'changeSummary'
    ],
    required: ['tenantId', 'organizationId', 'operatorId', 'id', 'title']
  },
  {
    schemaName: 'UpdatePageRequest',
    properties: [
      'tenantId',
      'organizationId',
      'operatorId',
      'title',
      'favorite',
      'archiveStatus',
      'publishStatus',
      'expectedVersion'
    ],
    required: ['tenantId', 'organizationId', 'operatorId']
  },
  {
    schemaName: 'UpdatePageContentRequest',
    properties: [
      'tenantId',
      'organizationId',
      'operatorId',
      'content',
      'contentType',
      'contentSchemaVersion',
      'changeSummary',
      'expectedDriveVersionId',
      'createCheckpoint'
    ],
    required: ['tenantId', 'organizationId', 'operatorId', 'content']
  },
  {
    schemaName: 'CreateAiJobRequest',
    properties: [
      'tenantId',
      'organizationId',
      'operatorId',
      'workspaceId',
      'jobType',
      'targetType',
      'targetId',
      'prompt',
      'contextPolicy'
    ],
    required: [
      'tenantId',
      'organizationId',
      'operatorId',
      'workspaceId',
      'jobType',
      'targetType'
    ]
  },
  {
    schemaName: 'AiSuggestionDecisionRequest',
    properties: ['tenantId', 'organizationId', 'operatorId'],
    required: ['tenantId', 'organizationId', 'operatorId']
  },
  {
    schemaName: 'AiSuggestionApplyRequest',
    properties: [
      'tenantId',
      'organizationId',
      'operatorId',
      'expectedDriveVersionId',
      'createCheckpoint'
    ],
    required: ['tenantId', 'organizationId', 'operatorId']
  },
  {
    schemaName: 'AiFeedbackCreateRequest',
    properties: [
      'tenantId',
      'organizationId',
      'operatorId',
      'feedbackType',
      'feedbackText'
    ],
    required: ['tenantId', 'organizationId', 'operatorId', 'feedbackType']
  }
];

const APP_QUERY_CONTEXT_REQUIREMENTS = [
  'workspaces.list',
  'workspaces.bootstrap.retrieve',
  'pages.list',
  'pages.retrieve',
  'pages.content.retrieve',
  'pages.versions.list',
  'pages.aiSuggestions.list',
  'search.query'
].map((operationId) => ({
  operationId,
  parameters: ['tenantId', 'organizationId', 'operatorId'],
  required: ['tenantId', 'organizationId']
}));

const BACKEND_QUERY_CONTEXT_REQUIREMENTS = [
  'aiJobs.admin.list',
  'aiJobs.admin.retrieve',
  'aiJobs.cancel',
  'aiJobs.claim',
  'aiJobs.complete',
  'aiSuggestions.feedback.list'
].map((operationId) => ({
  operationId,
  parameters: ['tenantId', 'organizationId', 'operatorId'],
  required: ['tenantId', 'organizationId']
}));

const APP_HEADER_REQUIREMENTS = [
  {
    operationId: 'aiJobs.create',
    parameters: ['Idempotency-Key'],
    required: ['Idempotency-Key']
  }
];

const SURFACE_EXPECTATIONS = {
  'open-api': {
    apiAuthoritySuffix: 'open-api',
    sdkFamilySuffix: 'sdk',
    surfacePrefix: null
  },
  'app-api': {
    apiAuthoritySuffix: 'app-api',
    sdkFamilySuffix: 'app-sdk',
    surfacePrefix: '/app/v3/api'
  },
  'backend-api': {
    apiAuthoritySuffix: 'backend-api',
    sdkFamilySuffix: 'backend-sdk',
    surfacePrefix: '/backend/v3/api'
  }
};

const SDK_FAMILY_EXPECTATIONS = [
  {
    familyDir: 'sdks/sdkwork-notes-sdk',
    domain: 'notes',
    surface: 'open-api',
    sdkFamily: 'sdkwork-notes-sdk',
    apiPrefix: '/notes/v3/api',
    generationInputSpec: '../../generated/openapi/notes-open-api.openapi.json'
  },
  {
    familyDir: 'sdks/sdkwork-notes-app-sdk',
    domain: 'notes',
    surface: 'app-api',
    sdkFamily: 'sdkwork-notes-app-sdk',
    apiPrefix: '/app/v3/api',
    generationInputSpec: '../../generated/openapi/notes-app-api.openapi.json'
  },
  {
    familyDir: 'sdks/sdkwork-notes-backend-sdk',
    domain: 'notes',
    surface: 'backend-api',
    sdkFamily: 'sdkwork-notes-backend-sdk',
    apiPrefix: '/backend/v3/api',
    generationInputSpec: '../../generated/openapi/notes-backend-api.openapi.json'
  }
];

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function walkFiles(rootDir, relativeDir) {
  const absoluteDir = path.join(rootDir, relativeDir);
  if (!(await pathExists(absoluteDir))) {
    return [];
  }

  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const childRelative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(rootDir, childRelative));
    } else if (entry.isFile()) {
      files.push(toPosix(childRelative));
    }
  }
  return files;
}

async function readText(rootDir, relativePath) {
  return readFile(path.join(rootDir, relativePath), 'utf8');
}

async function readJson(rootDir, relativePath) {
  const text = await readText(rootDir, relativePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    error.message = `${relativePath}: ${error.message}`;
    throw error;
  }
}

async function readOptionalJson(rootDir, relativePath) {
  if (!(await pathExists(path.join(rootDir, relativePath)))) {
    return null;
  }
  return readJson(rootDir, relativePath);
}

function pushFinding(findings, code, file, message, line = null) {
  findings.push({
    code,
    file,
    line,
    message
  });
}

function expectedApiAuthority(domain, surface) {
  const expectation = SURFACE_EXPECTATIONS[surface];
  return expectation ? `sdkwork-${domain}-${expectation.apiAuthoritySuffix}` : null;
}

function expectedSdkFamily(domain, surface) {
  const expectation = SURFACE_EXPECTATIONS[surface];
  return expectation ? `sdkwork-${domain}-${expectation.sdkFamilySuffix}` : null;
}

function expectedSurfacePrefix(surface) {
  return SURFACE_EXPECTATIONS[surface]?.surfacePrefix ?? null;
}

function parseRoutePackageName(packageName) {
  if (typeof packageName !== 'string' || !packageName.startsWith('sdkwork-routes-')) {
    return null;
  }

  for (const surface of ['backend-api', 'app-api', 'open-api']) {
    const suffix = `-${surface}`;
    if (!packageName.endsWith(suffix)) {
      continue;
    }

    const capability = packageName.slice('sdkwork-routes-'.length, -suffix.length);
    if (!capability) {
      return null;
    }
    return { capability, surface };
  }

  return null;
}

function packageImportName(packageName) {
  return typeof packageName === 'string' ? packageName.replaceAll('-', '_') : null;
}

function sdkFamilyFromDirectory(familyDir) {
  return path.basename(familyDir);
}

function isDesignAllowedForbiddenLine(lines, lineIndex, heading) {
  const currentLine = lines[lineIndex] ?? '';
  const lookback = lines.slice(Math.max(0, lineIndex - 12), lineIndex + 1).join('\n');

  if (lookback.includes('Forbidden new design names')) {
    return true;
  }
  if (/Acceptance Criteria/i.test(heading)) {
    return true;
  }
  if (/Forbidden/i.test(currentLine)) {
    return true;
  }
  if (/\b(do not|must not|not)\b/i.test(currentLine)) {
    return true;
  }

  return false;
}

function scanTextForPatterns({ findings, relativePath, text, patterns, code, allowDesignDocumentation }) {
  const lines = text.split(/\r?\n/);
  let heading = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      heading = headingMatch[1];
    }

    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      if (!pattern.regex.test(line)) {
        continue;
      }

      if (
        allowDesignDocumentation
        && relativePath === DESIGN_SPEC
        && isDesignAllowedForbiddenLine(lines, i, heading)
      ) {
        continue;
      }

      pushFinding(
        findings,
        code,
        relativePath,
        `Forbidden contract token "${pattern.label}" appears in active Notes contract text.`,
        i + 1
      );
    }
  }
}

async function verifyForbiddenNames(rootDir, findings) {
  const scanFiles = [
    ...await walkFiles(rootDir, 'docs/schema-registry'),
    ...await walkFiles(rootDir, 'generated/openapi'),
    ...await walkFiles(rootDir, 'sdks')
  ];

  if (await pathExists(path.join(rootDir, DESIGN_SPEC))) {
    scanFiles.push(DESIGN_SPEC);
  }

  for (const relativePath of scanFiles) {
    if (!/\.(json|ya?ml|md)$/i.test(relativePath)) {
      continue;
    }

    const text = await readText(rootDir, relativePath);
    scanTextForPatterns({
      findings,
      relativePath,
      text,
      patterns: FORBIDDEN_CONTRACT_PATTERNS,
      code: 'FORBIDDEN_CONTRACT_NAME',
      allowDesignDocumentation: true
    });

    if (relativePath.startsWith('docs/schema-registry/')) {
      scanTextForPatterns({
        findings,
        relativePath,
        text,
        patterns: SCHEMA_DRIVE_OWNERSHIP_PATTERNS,
        code: 'DRIVE_OWNED_STORAGE_TERM_IN_SCHEMA',
        allowDesignDocumentation: false
      });
    }
  }
}

function iterOpenApiOperations(openapi) {
  const operations = [];
  for (const [apiPath, pathItem] of Object.entries(openapi.paths ?? {})) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method)) {
        continue;
      }
      operations.push({ apiPath, method, operation });
    }
  }
  return operations;
}

function schemaProperties(openapi, schema, visited = new Set()) {
  if (!schema || typeof schema !== 'object') {
    return new Set();
  }

  if (typeof schema.$ref === 'string') {
    const refName = schema.$ref.match(/^#\/components\/schemas\/(.+)$/)?.[1];
    if (!refName || visited.has(refName)) {
      return new Set();
    }
    visited.add(refName);
    return schemaProperties(openapi, openapi.components?.schemas?.[refName], visited);
  }

  const properties = new Set(Object.keys(schema.properties ?? {}));
  for (const child of schema.allOf ?? []) {
    for (const propertyName of schemaProperties(openapi, child, visited)) {
      properties.add(propertyName);
    }
  }
  return properties;
}

function missingSchemaProperties(openapi, schemaName, requiredProperties) {
  const properties = schemaProperties(openapi, openapi.components?.schemas?.[schemaName]);
  return requiredProperties.filter((propertyName) => !properties.has(propertyName));
}

function verifyOpenApiSchemaProperties({ findings, file, openapi, schemaName, requiredProperties, code }) {
  const missing = missingSchemaProperties(openapi, schemaName, requiredProperties);
  if (missing.length === 0) {
    return;
  }
  pushFinding(
    findings,
    code,
    file,
    `${schemaName} must expose Drive version reference properties: ${missing.join(', ')}.`
  );
}

function verifySchemaStringEnum({ findings, file, openapi, schemaName, propertyName, expectedValues, code }) {
  const property = openapi.components?.schemas?.[schemaName]?.properties?.[propertyName];
  const actualValues = Array.isArray(property?.enum) ? property.enum : null;
  if (!actualValues) {
    pushFinding(
      findings,
      code,
      file,
      `${schemaName}.${propertyName} must expose a closed enum matching implemented persistence and service states: ${expectedValues.join(', ')}.`
    );
    return;
  }

  const missingValues = expectedValues.filter((value) => !actualValues.includes(value));
  const unexpectedValues = actualValues.filter((value) => !expectedValues.includes(value));
  if (missingValues.length === 0 && unexpectedValues.length === 0) {
    return;
  }

  const details = [];
  if (missingValues.length > 0) {
    details.push(`missing ${missingValues.join(', ')}`);
  }
  if (unexpectedValues.length > 0) {
    details.push(`unexpected ${unexpectedValues.join(', ')}`);
  }
  pushFinding(
    findings,
    code,
    file,
    `${schemaName}.${propertyName} enum must match implemented persistence and service states: ${details.join('; ')}.`
  );
}

function requiredSchemaProperties(openapi, schemaName) {
  const schema = openapi.components?.schemas?.[schemaName];
  return new Set(Array.isArray(schema?.required) ? schema.required : []);
}

function resolveOpenApiParameter(openapi, parameter) {
  if (!parameter || typeof parameter !== 'object') {
    return null;
  }
  if (typeof parameter.$ref === 'string') {
    const refName = parameter.$ref.match(/^#\/components\/parameters\/(.+)$/)?.[1];
    return refName ? openapi.components?.parameters?.[refName] ?? null : null;
  }
  return parameter;
}

function operationQueryParameterMap(openapi, operation) {
  const parameters = new Map();
  for (const parameter of operation?.parameters ?? []) {
    const resolved = resolveOpenApiParameter(openapi, parameter);
    if (resolved?.in !== 'query' || typeof resolved.name !== 'string') {
      continue;
    }
    parameters.set(resolved.name, resolved);
  }
  return parameters;
}

function operationHeaderParameterMap(openapi, operation) {
  const parameters = new Map();
  for (const parameter of operation?.parameters ?? []) {
    const resolved = resolveOpenApiParameter(openapi, parameter);
    if (resolved?.in !== 'header' || typeof resolved.name !== 'string') {
      continue;
    }
    parameters.set(resolved.name.toLowerCase(), resolved);
  }
  return parameters;
}

function operationById(openapi, operationId) {
  return iterOpenApiOperations(openapi)
    .find((entry) => entry.operation?.operationId === operationId);
}

async function verifyAppApiImplementedHeaderContracts(rootDir, findings) {
  const file = 'generated/openapi/notes-app-api.openapi.json';
  if (!(await pathExists(path.join(rootDir, file)))) {
    return;
  }

  const openapi = await readJson(rootDir, file);
  for (const requirement of APP_HEADER_REQUIREMENTS) {
    const entry = operationById(openapi, requirement.operationId);
    if (!entry) {
      continue;
    }

    const headerParameters = operationHeaderParameterMap(openapi, entry.operation);
    const missingParameters = requirement.parameters
      .filter((parameterName) => !headerParameters.has(parameterName.toLowerCase()));
    if (missingParameters.length > 0) {
      pushFinding(
        findings,
        'APP_HEADER_CONTRACT_MISSING',
        file,
        `${entry.operation.operationId} must expose header parameters required by the implemented Rust handler: ${missingParameters.join(', ')}.`
      );
    }

    const missingRequired = requirement.required
      .filter((parameterName) => headerParameters.get(parameterName.toLowerCase())?.required !== true);
    if (missingRequired.length > 0) {
      pushFinding(
        findings,
        'APP_HEADER_CONTRACT_MISSING',
        file,
        `${entry.operation.operationId} must require header parameters enforced by the implemented Rust handler: ${missingRequired.join(', ')}.`
      );
    }
  }
}

async function verifyAppApiImplementedBodyContracts(rootDir, findings) {
  const file = 'generated/openapi/notes-app-api.openapi.json';
  if (!(await pathExists(path.join(rootDir, file)))) {
    return;
  }

  const openapi = await readJson(rootDir, file);
  for (const requirement of APP_BODY_SCHEMA_REQUIREMENTS) {
    const missingProperties = missingSchemaProperties(
      openapi,
      requirement.schemaName,
      requirement.properties
    );
    if (missingProperties.length > 0) {
      pushFinding(
        findings,
        'APP_BODY_CONTEXT_CONTRACT_MISSING',
        file,
        `${requirement.schemaName} must expose fields required by the implemented App API DTO: ${missingProperties.join(', ')}.`
      );
    }

    const requiredProperties = requiredSchemaProperties(openapi, requirement.schemaName);
    const missingRequired = requirement.required.filter(
      (propertyName) => !requiredProperties.has(propertyName)
    );
    if (missingRequired.length > 0) {
      pushFinding(
        findings,
        'APP_BODY_CONTEXT_CONTRACT_MISSING',
        file,
        `${requirement.schemaName} must require fields needed by the implemented App API route context: ${missingRequired.join(', ')}.`
      );
    }

    const unexpectedRequired = [...requiredProperties]
      .filter((propertyName) => !requirement.required.includes(propertyName));
    if (unexpectedRequired.length > 0) {
      pushFinding(
        findings,
        'APP_BODY_REQUIRED_CONTRACT_MISMATCH',
        file,
        `${requirement.schemaName} must not require fields that the implemented App API DTO accepts as optional/defaulted: ${unexpectedRequired.join(', ')}.`
      );
    }
  }
}

async function verifyImplementedQueryContextContracts(rootDir, findings) {
  const authorities = [
    {
      file: 'generated/openapi/notes-app-api.openapi.json',
      requirements: APP_QUERY_CONTEXT_REQUIREMENTS,
      code: 'APP_QUERY_CONTEXT_CONTRACT_MISSING'
    },
    {
      file: 'generated/openapi/notes-backend-api.openapi.json',
      requirements: BACKEND_QUERY_CONTEXT_REQUIREMENTS,
      code: 'BACKEND_QUERY_CONTEXT_CONTRACT_MISSING'
    }
  ];

  for (const authority of authorities) {
    if (!(await pathExists(path.join(rootDir, authority.file)))) {
      continue;
    }

    const openapi = await readJson(rootDir, authority.file);
    for (const requirement of authority.requirements) {
      const entry = operationById(openapi, requirement.operationId);
      if (!entry) {
        continue;
      }

      const queryParameters = operationQueryParameterMap(openapi, entry.operation);
      const missingParameters = requirement.parameters
        .filter((parameterName) => !queryParameters.has(parameterName));
      if (missingParameters.length > 0) {
        pushFinding(
          findings,
          authority.code,
          authority.file,
          `${entry.operation.operationId} must expose query parameters accepted or required by the implemented Rust route DTO: ${missingParameters.join(', ')}.`
        );
      }

      const missingRequired = requirement.required
        .filter((parameterName) => queryParameters.get(parameterName)?.required !== true);
      if (missingRequired.length > 0) {
        pushFinding(
          findings,
          authority.code,
          authority.file,
          `${entry.operation.operationId} must require query parameters needed by the implemented Rust route context: ${missingRequired.join(', ')}.`
        );
      }
    }
  }
}

async function verifyImplementedSchemaValueContracts(rootDir, findings) {
  for (const file of [
    'generated/openapi/notes-app-api.openapi.json',
    'generated/openapi/notes-backend-api.openapi.json'
  ]) {
    if (!(await pathExists(path.join(rootDir, file)))) {
      continue;
    }

    const openapi = await readJson(rootDir, file);
    verifySchemaStringEnum({
      findings,
      file,
      openapi,
      schemaName: 'AiJob',
      propertyName: 'status',
      expectedValues: REQUIRED_AI_JOB_STATUS_VALUES,
      code: 'OPENAPI_AI_JOB_STATUS_ENUM_MISMATCH'
    });
  }
}

async function verifyOpenApi(rootDir, findings) {
  for (const authority of OPENAPI_AUTHORITIES) {
    if (!(await pathExists(path.join(rootDir, authority.file)))) {
      pushFinding(findings, 'OPENAPI_AUTHORITY_MISSING', authority.file, `Missing ${authority.surface} OpenAPI authority.`);
      continue;
    }

    const openapi = await readJson(rootDir, authority.file);
    if (openapi.openapi !== '3.1.2') {
      pushFinding(
        findings,
        'OPENAPI_VERSION_MISMATCH',
        authority.file,
        `Expected OpenAPI 3.1.2 for ${authority.surface}, got ${openapi.openapi ?? 'missing'}.`
      );
    }

    if (!openapi.components?.schemas?.ProblemDetail) {
      pushFinding(
        findings,
        'OPENAPI_PROBLEM_DETAIL_MISSING',
        authority.file,
        `Missing components.schemas.ProblemDetail in ${authority.surface}.`
      );
    }

    for (const scheme of authority.requiredSecuritySchemes) {
      if (!openapi.components?.securitySchemes?.[scheme]) {
        pushFinding(
          findings,
          'OPENAPI_SECURITY_SCHEME_MISSING',
          authority.file,
          `Missing ${scheme} security scheme in ${authority.surface}.`
        );
      }
    }

    for (const apiPath of Object.keys(openapi.paths ?? {})) {
      if (!apiPath.startsWith(authority.prefix)) {
        pushFinding(
          findings,
          'OPENAPI_PREFIX_MISMATCH',
          authority.file,
          `Path ${apiPath} must start with ${authority.prefix}.`
        );
      }
    }

    const operationIds = new Map();
    for (const { apiPath, method, operation } of iterOpenApiOperations(openapi)) {
      const location = `${method.toUpperCase()} ${apiPath}`;
      if (!operation?.operationId) {
        pushFinding(
          findings,
          'OPENAPI_OPERATION_ID_MISSING',
          authority.file,
          `${location} is missing operationId.`
        );
        continue;
      }

      if (operation.operationId.startsWith('notes.')) {
        pushFinding(
          findings,
          'OPENAPI_OPERATION_ID_TAG_PREFIX',
          authority.file,
          `${location} operationId "${operation.operationId}" repeats the notes tag. Use pages.*, workspaces.*, search.*, or another resource segment.`
        );
      }

      if (operationIds.has(operation.operationId)) {
        pushFinding(
          findings,
          'OPENAPI_OPERATION_ID_DUPLICATE',
          authority.file,
          `${location} duplicates operationId "${operation.operationId}" from ${operationIds.get(operation.operationId)}.`
        );
      } else {
        operationIds.set(operation.operationId, location);
      }
    }
  }
}

async function verifyDriveVersionReferenceContracts(rootDir, findings) {
  const coreText = await pathExists(path.join(rootDir, NOTES_CORE_SCHEMA))
    ? await readText(rootDir, NOTES_CORE_SCHEMA)
    : '';
  const missingPageFields = REQUIRED_PAGE_DRIVE_FIELDS.filter((field) => !coreText.includes(field));
  if (missingPageFields.length > 0) {
    pushFinding(
      findings,
      'NOTES_PAGE_DRIVE_VERSION_FIELDS_MISSING',
      NOTES_CORE_SCHEMA,
      `notes_page must persist Drive content/version references: ${missingPageFields.join(', ')}.`
    );
  }

  const aiProjectionText = await pathExists(path.join(rootDir, NOTES_AI_PROJECTIONS_SCHEMA))
    ? await readText(rootDir, NOTES_AI_PROJECTIONS_SCHEMA)
    : '';
  const missingAiFields = REQUIRED_AI_SOURCE_DRIVE_VERSION_FIELDS.filter((field) => !aiProjectionText.includes(field));
  if (missingAiFields.length > 0) {
    pushFinding(
      findings,
      'NOTES_AI_SOURCE_DRIVE_VERSION_FIELDS_MISSING',
      NOTES_AI_PROJECTIONS_SCHEMA,
      `AI projections and sources must record source Drive versions: ${missingAiFields.join(', ')}.`
    );
  }

  for (const authority of OPENAPI_AUTHORITIES.filter((item) => item.surface !== 'backend-api')) {
    if (!(await pathExists(path.join(rootDir, authority.file)))) {
      continue;
    }
    const openapi = await readJson(rootDir, authority.file);
    verifyOpenApiSchemaProperties({
      findings,
      file: authority.file,
      openapi,
      schemaName: 'PageSummary',
      requiredProperties: ['driveNodeId', 'currentDriveVersionNo'],
      code: 'OPENAPI_PAGE_DRIVE_VERSION_FIELDS_MISSING'
    });
    verifyOpenApiSchemaProperties({
      findings,
      file: authority.file,
      openapi,
      schemaName: 'Page',
      requiredProperties: ['driveSpaceId', 'driveUri', 'currentDriveVersionId'],
      code: 'OPENAPI_PAGE_DRIVE_VERSION_FIELDS_MISSING'
    });
    verifyOpenApiSchemaProperties({
      findings,
      file: authority.file,
      openapi,
      schemaName: 'PageContent',
      requiredProperties: ['driveNodeId', 'driveVersionId', 'driveVersionNo'],
      code: 'OPENAPI_PAGE_CONTENT_DRIVE_VERSION_FIELDS_MISSING'
    });
    verifyOpenApiSchemaProperties({
      findings,
      file: authority.file,
      openapi,
      schemaName: 'DriveVersionSummary',
      requiredProperties: ['driveVersionId', 'driveVersionNo'],
      code: 'OPENAPI_PAGE_VERSION_DRIVE_VERSION_FIELDS_MISSING'
    });
  }
}

function dependenciesFromComponent(componentSpec) {
  return componentSpec?.contracts?.sdkDependencies;
}

function hasDependency(dependencies, workspace) {
  return Array.isArray(dependencies) && dependencies.some((dependency) => dependency?.workspace === workspace);
}

function dependencyFor(dependencies, workspace) {
  return Array.isArray(dependencies)
    ? dependencies.find((dependency) => dependency?.workspace === workspace)
    : null;
}

async function checkDependencyLayer({ rootDir, findings, file, layer, workspace, missingCode }) {
  if (!(await pathExists(path.join(rootDir, file)))) {
    if (layer === 'assembly') {
      pushFinding(findings, 'SDK_ASSEMBLY_MISSING', file, `Missing SDK assembly metadata for ${workspace}.`);
    }
    return;
  }

  const json = await readJson(rootDir, file);
  const dependencies = layer === 'component'
    ? dependenciesFromComponent(json)
    : json.sdkDependencies;

  if (!hasDependency(dependencies, workspace)) {
    pushFinding(findings, missingCode, file, `Missing required dependency ${workspace}.`);
    return;
  }

  const dependency = dependencyFor(dependencies, workspace);
  if (dependency?.generatedTransportImportPolicy !== 'forbidden') {
    pushFinding(
      findings,
      'SDK_DEPENDENCY_IMPORT_POLICY_MISMATCH',
      file,
      `Dependency ${workspace} must set generatedTransportImportPolicy to "forbidden".`
    );
  }
}

async function verifySdkDependencies(rootDir, findings) {
  const appLayers = [
    { file: 'sdks/sdkwork-notes-app-sdk/.sdkwork-assembly.json', layer: 'assembly' },
    { file: 'sdks/sdkwork-notes-app-sdk/sdk-manifest.json', layer: 'manifest' },
    { file: 'sdks/sdkwork-notes-app-sdk/specs/component.spec.json', layer: 'component' }
  ];
  const backendLayers = [
    { file: 'sdks/sdkwork-notes-backend-sdk/.sdkwork-assembly.json', layer: 'assembly' },
    { file: 'sdks/sdkwork-notes-backend-sdk/sdk-manifest.json', layer: 'manifest' },
    { file: 'sdks/sdkwork-notes-backend-sdk/specs/component.spec.json', layer: 'component' }
  ];

  for (const layer of appLayers) {
    await checkDependencyLayer({
      rootDir,
      findings,
      file: layer.file,
      layer: layer.layer,
      workspace: 'sdkwork-drive-app-sdk',
      missingCode: 'APP_SDK_DRIVE_DEPENDENCY_MISSING'
    });
  }

  for (const layer of backendLayers) {
    await checkDependencyLayer({
      rootDir,
      findings,
      file: layer.file,
      layer: layer.layer,
      workspace: 'sdkwork-drive-backend-sdk',
      missingCode: 'BACKEND_SDK_DRIVE_DEPENDENCY_MISSING'
    });
  }

  const openMetadataFiles = [
    { file: 'sdks/sdkwork-notes-sdk/.sdkwork-assembly.json', layer: 'assembly' },
    { file: 'sdks/sdkwork-notes-sdk/sdk-manifest.json', layer: 'manifest' },
    { file: 'sdks/sdkwork-notes-sdk/specs/component.spec.json', layer: 'component' }
  ];

  for (const metadataFile of openMetadataFiles) {
    const json = await readOptionalJson(rootDir, metadataFile.file);
    if (!json) {
      continue;
    }
    const dependencies = metadataFile.layer === 'component'
      ? dependenciesFromComponent(json)
      : json.sdkDependencies;
    if (!Array.isArray(dependencies)) {
      pushFinding(
        findings,
        'OPEN_SDK_DEPENDENCIES_NOT_EXPLICIT',
        metadataFile.file,
        'Open SDK metadata must declare sdkDependencies as an explicit array.'
      );
      continue;
    }
    for (const dependency of dependencies) {
      if (/appbase.*app|login|session/i.test(dependency?.workspace ?? '') || /login|session/i.test(dependency?.role ?? '')) {
        pushFinding(
          findings,
          'OPEN_SDK_APPBASE_LOGIN_DEPENDENCY_FORBIDDEN',
          metadataFile.file,
          `Open SDK must not declare appbase login/session dependency ${dependency.workspace}.`
        );
      }
    }
  }
}

async function verifyForbiddenSdkFamilyDirectories(rootDir, findings) {
  const forbiddenDirectories = [
    'sdks/sdkwork-notes-open-api',
    'sdks/sdkwork-notes-app-api',
    'sdks/sdkwork-notes-backend-api',
    'sdks/notes-open-sdk',
    'sdks/notes-app-sdk',
    'sdks/notes-backend-sdk'
  ];

  for (const relativePath of forbiddenDirectories) {
    if (await pathExists(path.join(rootDir, relativePath))) {
      pushFinding(
        findings,
        'FORBIDDEN_SDK_FAMILY_DIRECTORY',
        relativePath,
        'SDK family directories must use sdkwork-notes-sdk, sdkwork-notes-app-sdk, or sdkwork-notes-backend-sdk.'
      );
    }
  }
}

export async function verifyNotesContractFoundation({ rootDir = process.cwd() } = {}) {
  const findings = [];
  await verifyForbiddenNames(rootDir, findings);
  await verifyOpenApi(rootDir, findings);
  await verifyAppApiImplementedHeaderContracts(rootDir, findings);
  await verifyAppApiImplementedBodyContracts(rootDir, findings);
  await verifyImplementedQueryContextContracts(rootDir, findings);
  await verifyImplementedSchemaValueContracts(rootDir, findings);
  await verifyDriveVersionReferenceContracts(rootDir, findings);
  await verifySdkDependencies(rootDir, findings);
  await verifyForbiddenSdkFamilyDirectories(rootDir, findings);
  return {
    ok: findings.length === 0,
    findings
  };
}

function formatFinding(finding) {
  const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
  return `[${finding.code}] ${location} ${finding.message}`;
}

async function main() {
  const result = await verifyNotesContractFoundation();
  if (!result.ok) {
    console.error('SDKWork Notes contract foundation verification failed:');
    for (const finding of result.findings) {
      console.error(`- ${formatFinding(finding)}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('SDKWork Notes contract foundation verification passed.');
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
