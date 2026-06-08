import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace']);

const OPENAPI_AUTHORITIES = [
  {
    file: 'generated/openapi/notes-app-api.openapi.json',
    prefix: '/app/v3/api/notes',
    surface: 'app-api',
    requiredSecuritySchemes: ['AuthToken', 'AccessToken']
  },
  {
    file: 'generated/openapi/notes-open-api.openapi.json',
    prefix: '/notes/v3/api',
    surface: 'open-api',
    requiredSecuritySchemes: ['ApiKey']
  },
  {
    file: 'generated/openapi/notes-backend-api.openapi.json',
    prefix: '/backend/v3/api/notes',
    surface: 'backend-api',
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

function requiredSchemaProperties(openapi, schemaName) {
  const schema = openapi.components?.schemas?.[schemaName];
  return new Set(Array.isArray(schema?.required) ? schema.required : []);
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
  await verifyAppApiImplementedBodyContracts(rootDir, findings);
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
