#!/usr/bin/env node
/**
 * SDKWork Notes API contract validation and SDK generation pipeline.
 *
 * Usage:
 *   node tools/notes_sdk_generate.mjs --check
 *   node tools/notes_sdk_generate.mjs
 *   node tools/notes_sdk_generate.mjs --sdk-family sdkwork-notes-app-sdk --language typescript
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const API_INPUTS = {
  'open-api': {
    path: 'apis/open-api/notes/notes-open-api.openapi.json',
    sdkFamily: 'sdkwork-notes-sdk',
  },
  'app-api': {
    path: 'apis/app-api/notes/notes-app-api.openapi.json',
    sdkFamily: 'sdkwork-notes-app-sdk',
  },
  'backend-api': {
    path: 'apis/backend-api/notes/notes-backend-api.openapi.json',
    sdkFamily: 'sdkwork-notes-backend-sdk',
  },
};

function parseArgs(argv) {
  const args = {
    check: false,
    language: null,
    sdkFamily: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--check') {
      args.check = true;
      continue;
    }
    if (token === '--language') {
      args.language = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (token === '--sdk-family') {
      args.sdkFamily = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${token}`);
  }

  return args;
}

function validateOpenApiContract(surface, inputPath) {
  const fullPath = resolve(repoRoot, inputPath);
  if (!existsSync(fullPath)) {
    console.error(`[sdkwork-notes] Missing OpenAPI input for ${surface}: ${inputPath}`);
    return false;
  }

  try {
    const content = JSON.parse(readFileSync(fullPath, 'utf8'));
    if (!content.openapi) {
      console.error(`[sdkwork-notes] ${inputPath} is not a valid OpenAPI document`);
      return false;
    }
    if (!content.info?.title || !content.info?.version) {
      console.error(`[sdkwork-notes] ${inputPath} is missing required info.title or info.version`);
      return false;
    }
    if (!content.paths) {
      console.error(`[sdkwork-notes] ${inputPath} is missing required paths section`);
      return false;
    }
    console.log(`[sdkwork-notes] OK: ${surface} (${inputPath}) -> ${content.info.title} v${content.info.version}`);
    return true;
  } catch (error) {
    console.error(`[sdkwork-notes] Failed to parse ${inputPath}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function validateSdkFamily(surface, config) {
  const sdkFamilyDir = resolve(repoRoot, 'sdks', config.sdkFamily);
  if (!existsSync(sdkFamilyDir)) {
    console.warn(`[sdkwork-notes] SDK family directory not yet present: sdks/${config.sdkFamily}`);
    return false;
  }
  const assemblyPath = resolve(sdkFamilyDir, '.sdkwork-assembly.json');
  if (!existsSync(assemblyPath)) {
    console.warn(`[sdkwork-notes] Missing assembly manifest for ${config.sdkFamily}`);
    return false;
  }
  console.log(`[sdkwork-notes] OK: ${surface} SDK family sdks/${config.sdkFamily}`);
  return true;
}

function runGenerateScript(options) {
  const scriptPath = resolve(repoRoot, 'scripts/generate-notes-app-sdk.mjs');
  const args = [scriptPath];
  if (options.language) {
    args.push('--language', options.language);
  }
  if (options.sdkFamily) {
    args.push('--sdk-family', options.sdkFamily);
  }

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error('Notes SDK generation failed.');
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('[sdkwork-notes] Validating OpenAPI contracts...');
  let allValid = true;
  for (const [surface, config] of Object.entries(API_INPUTS)) {
    if (!validateOpenApiContract(surface, config.path)) {
      allValid = false;
    }
  }

  if (!allValid) {
    console.error('[sdkwork-notes] OpenAPI contract validation failed.');
    process.exit(1);
  }

  let familiesValid = true;
  for (const [surface, config] of Object.entries(API_INPUTS)) {
    if (!validateSdkFamily(surface, config)) {
      familiesValid = false;
    }
  }

  if (args.check) {
    if (!familiesValid) {
      console.error('[sdkwork-notes] SDK family validation failed.');
      process.exit(1);
    }
    console.log('[sdkwork-notes] --check complete.');
    return;
  }

  const familiesToGenerate = args.sdkFamily
    ? [args.sdkFamily]
    : ['sdkwork-notes-app-sdk', 'sdkwork-notes-backend-sdk', 'sdkwork-notes-sdk'];

  for (const sdkFamily of familiesToGenerate) {
    console.log(`[sdkwork-notes] Generating ${sdkFamily}...`);
    runGenerateScript({
      language: args.language,
      sdkFamily,
    });
  }

  console.log('[sdkwork-notes] SDK generation pipeline complete.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
