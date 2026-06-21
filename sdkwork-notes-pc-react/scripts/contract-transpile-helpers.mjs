import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

export function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

export function createSdkworkUtilsStubUrl() {
  return createDataModuleUrl(`
    export function trim(value) {
      return typeof value === 'string' ? value.trim() : '';
    }
    export function isBlank(value) {
      return trim(value).length === 0;
    }
  `);
}

export function createNotesPcCommonsTextStubUrl() {
  return createDataModuleUrl(`
    export function normalizeString(value) {
      if (typeof value === 'string') {
        return value.trim();
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
      return '';
    }
    export function normalizeNullableString(value) {
      const normalized = normalizeString(value);
      return normalized ? normalized : null;
    }
    export function normalizeStringArray(value) {
      if (!Array.isArray(value)) {
        return [];
      }
      const values = [];
      const seen = new Set();
      for (const item of value) {
        const normalized = normalizeString(item);
        if (!normalized || seen.has(normalized)) {
          continue;
        }
        seen.add(normalized);
        values.push(normalized);
      }
      return values;
    }
    export function toErrorMessage(error, fallback) {
      if (error instanceof Error && error.message.trim()) {
        return error.message;
      }
      if (typeof error === 'string' && error.trim()) {
        return error;
      }
      return fallback;
    }
  `);
}

export function applyContractModuleStubs(source, options = {}) {
  const utilsStubUrl = options.utilsStubUrl ?? createSdkworkUtilsStubUrl();
  const commonsStubUrl = options.commonsStubUrl ?? createNotesPcCommonsTextStubUrl();
  let patched = source
    .replaceAll("'@sdkwork/utils'", `'${utilsStubUrl}'`)
    .replaceAll('"@sdkwork/utils"', `"${utilsStubUrl}"`)
    .replaceAll('@sdkwork/utils', utilsStubUrl)
    .replaceAll("'@sdkwork/notes-pc-commons'", `'${commonsStubUrl}'`)
    .replaceAll('"@sdkwork/notes-pc-commons"', `"${commonsStubUrl}"`)
    .replaceAll('@sdkwork/notes-pc-commons', commonsStubUrl);

  if (
    patched.includes('normalizeString(')
    && !patched.includes(`from '${commonsStubUrl}'`)
    && !patched.includes(`from "${commonsStubUrl}"`)
  ) {
    patched = `import { normalizeString, toErrorMessage, normalizeStringArray, normalizeNullableString } from '${commonsStubUrl}';\n${patched}`;
  }

  return patched;
}

export async function transpileTypeScriptSource(relativePath, cwd = process.cwd()) {
  const entryPoint = path.resolve(cwd, relativePath);
  const source = await readFile(entryPoint, 'utf8');
  return {
    entryPoint,
    outputText: ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: entryPoint,
    }).outputText,
  };
}

export async function importTranspiledContractModule(relativePath, patch = (source) => source) {
  const { outputText } = await transpileTypeScriptSource(relativePath);
  return import(createDataModuleUrl(applyContractModuleStubs(patch(outputText))));
}
