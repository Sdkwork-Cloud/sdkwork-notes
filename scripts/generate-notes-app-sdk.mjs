#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GENERATOR_PACKAGE_NAME = '@sdkwork/sdk-generator';
const GENERATOR_CLI_NAME = 'sdkgen';
const STANDARD_PROFILE = 'sdkwork-v3';
const DEFAULT_WORKSPACE_GENERATOR_ENTRYPOINT = '../sdkwork-sdk-generator/bin/sdkgen.js';
const SUPPORTED_LANGUAGES = new Set(['typescript', 'rust']);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    languages: [],
    sdkFamily: 'sdkwork-notes-app-sdk',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (token === '--language') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --language.');
      }
      options.languages.push(next);
      index += 1;
      continue;
    }
    if (token === '--sdk-family') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --sdk-family.');
      }
      options.sdkFamily = next;
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${token}.`);
  }

  return options;
}

function resolveSdkgenEntrypoint(rootDir) {
  const explicit = String(process.env.SDKWORK_SDKGEN_PATH ?? '').trim();
  if (explicit) {
    return path.resolve(rootDir, explicit);
  }

  const workspaceEntrypoint = path.resolve(rootDir, DEFAULT_WORKSPACE_GENERATOR_ENTRYPOINT);
  if (fs.existsSync(workspaceEntrypoint)) {
    return workspaceEntrypoint;
  }

  throw new Error(
    `Missing ${GENERATOR_PACKAGE_NAME} ${GENERATOR_CLI_NAME} entrypoint. Set SDKWORK_SDKGEN_PATH or check out sdkwork-sdk-generator.`,
  );
}

function assertSdkgenEntrypoint(sdkgenEntrypoint) {
  if (!fs.existsSync(sdkgenEntrypoint)) {
    throw new Error(`Missing sdkgen entrypoint: ${sdkgenEntrypoint}.`);
  }

  const packageRoot = path.resolve(path.dirname(sdkgenEntrypoint), '..');
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageJson = fs.existsSync(packageJsonPath) ? readJson(packageJsonPath) : null;
  if (packageJson?.name !== GENERATOR_PACKAGE_NAME) {
    throw new Error(
      `The resolved ${GENERATOR_CLI_NAME} entrypoint is not ${GENERATOR_PACKAGE_NAME}: ${sdkgenEntrypoint}.`,
    );
  }
}

function createGenerationPlans(rootDir, options) {
  const familyRoot = path.join(rootDir, 'sdks', options.sdkFamily);
  const assemblyPath = path.join(familyRoot, '.sdkwork-assembly.json');
  const assembly = readJson(assemblyPath);
  assert.equal(assembly.sdkOwner, 'sdkwork-notes');
  assert.equal(assembly.workspace, options.sdkFamily);

  const requestedLanguages = new Set(
    options.languages.length > 0 ? options.languages : SUPPORTED_LANGUAGES,
  );
  for (const language of requestedLanguages) {
    if (!SUPPORTED_LANGUAGES.has(language)) {
      throw new Error(`Unsupported Notes standard SDK language: ${language}.`);
    }
  }

  const input = path.resolve(familyRoot, assembly.generationInputSpec);
  const apiPrefix = assembly.discoverySurface?.apiPrefix ?? '/app/v3/api';
  const languages = new Map((assembly.languages ?? []).map((entry) => [entry.language, entry]));

  return [...requestedLanguages].map((language) => {
    const languageEntry = languages.get(language);
    assert.ok(languageEntry, `${options.sdkFamily} must declare ${language} in .sdkwork-assembly.json.`);
    return {
      apiPrefix,
      fixedSdkVersion: String(languageEntry.version ?? assembly.apiVersion ?? '0.1.0'),
      input,
      language,
      output: path.resolve(familyRoot, languageEntry.generatedPath),
      packageName: languageEntry.name,
      sdkName: options.sdkFamily,
      surface: assembly.discoverySurface?.sdkTarget ?? 'app',
    };
  });
}

function runPlan(sdkgenEntrypoint, plan, options) {
  const args = [
    sdkgenEntrypoint,
    'generate',
    '--input',
    plan.input,
    '--output',
    plan.output,
    '--name',
    plan.sdkName,
    '--type',
    plan.surface,
    '--language',
    plan.language,
    '--api-prefix',
    plan.apiPrefix,
    '--sdk-name',
    plan.sdkName,
    '--package-name',
    plan.packageName,
    '--fixed-sdk-version',
    plan.fixedSdkVersion,
    '--standard-profile',
    STANDARD_PROFILE,
    ...(options.dryRun ? ['--dry-run'] : []),
  ];

  console.log(`${GENERATOR_CLI_NAME} ${args.slice(1).join(' ')}`);
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${GENERATOR_CLI_NAME} failed for ${plan.sdkName} ${plan.language}.`);
  }
}

export function generateNotesAppSdk(options = {}, rootDir = process.cwd()) {
  const sdkgenEntrypoint = resolveSdkgenEntrypoint(rootDir);
  assertSdkgenEntrypoint(sdkgenEntrypoint);
  const plans = createGenerationPlans(rootDir, options);
  for (const plan of plans) {
    runPlan(sdkgenEntrypoint, plan, options);
  }
  return plans.map((plan) => ({
    language: plan.language,
    output: path.relative(rootDir, plan.output).replace(/\\/g, '/'),
    sdkName: plan.sdkName,
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = generateNotesAppSdk(parseArgs(process.argv.slice(2)));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
