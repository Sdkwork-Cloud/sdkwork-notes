import { customApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { CreateExportRequest, CreatePageRequest, DriveVersionPage, ExportJob, Page, PageContent, PageSummaryPage, RestorePageVersionRequest, SearchResultPage, UpdatePageContentRequest, UpdatePageRequest, WorkspacePage } from '../types';


export class NotesExportsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Create an export job for pages, collections, or a workspace. */
  async create(body: CreateExportRequest): Promise<ExportJob> {
    return this.client.post<ExportJob>(customApiPath(`/exports`), body, undefined, undefined, 'application/json');
  }

/** Retrieve export job status. */
  async retrieve(exportId: string): Promise<ExportJob> {
    return this.client.get<ExportJob>(customApiPath(`/exports/${serializePathParameter(exportId, { name: 'exportId', style: 'simple', explode: false })}`));
  }
}

export interface NotesSearchQueryParams {
  workspaceId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export class NotesSearchApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Search page projections through Open API. */
  async query(params?: NotesSearchQueryParams): Promise<SearchResultPage> {
    const query = buildQueryString([
      { name: 'workspace_id', value: params?.workspaceId, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<SearchResultPage>(appendQueryString(customApiPath(`/search`), query));
  }
}

export interface NotesPagesVersionsListParams {
  page?: number;
  pageSize?: number;
}

export class NotesPagesVersionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List Drive node versions for a Notes page. */
  async list(pageId: string, params?: NotesPagesVersionsListParams): Promise<DriveVersionPage> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<DriveVersionPage>(appendQueryString(customApiPath(`/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/versions`), query));
  }

/** Restore a Drive-owned page content version through Open API. */
  async restore(pageId: string, driveVersionId: string, body: RestorePageVersionRequest): Promise<PageContent> {
    return this.client.post<PageContent>(customApiPath(`/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/versions/${serializePathParameter(driveVersionId, { name: 'driveVersionId', style: 'simple', explode: false })}/restore`), body, undefined, undefined, 'application/json');
  }
}

export class NotesPagesContentApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Retrieve Drive-backed page content through the Notes Open API facade. */
  async retrieve(pageId: string): Promise<PageContent> {
    return this.client.get<PageContent>(customApiPath(`/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/content`));
  }

/** Update Drive-backed page content through Open API. */
  async update(pageId: string, body: UpdatePageContentRequest): Promise<PageContent> {
    return this.client.put<PageContent>(customApiPath(`/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/content`), body, undefined, undefined, 'application/json');
  }
}

export interface NotesPagesListParams {
  workspaceId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export class NotesPagesApi {
  private client: HttpClient;
  public readonly content: NotesPagesContentApi;
  public readonly versions: NotesPagesVersionsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.content = new NotesPagesContentApi(client);
    this.versions = new NotesPagesVersionsApi(client);
  }


/** List pages available to the API key context. */
  async list(params?: NotesPagesListParams): Promise<PageSummaryPage> {
    const query = buildQueryString([
      { name: 'workspace_id', value: params?.workspaceId, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<PageSummaryPage>(appendQueryString(customApiPath(`/pages`), query));
  }

/** Create a Drive-backed page through Open API. */
  async create(body: CreatePageRequest): Promise<Page> {
    return this.client.post<Page>(customApiPath(`/pages`), body, undefined, undefined, 'application/json');
  }

/** Retrieve page metadata through Open API. */
  async retrieve(pageId: string): Promise<Page> {
    return this.client.get<Page>(customApiPath(`/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}`));
  }

/** Update page metadata through Open API. */
  async update(pageId: string, body: UpdatePageRequest): Promise<Page> {
    return this.client.patch<Page>(customApiPath(`/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface NotesWorkspacesListParams {
  page?: number;
  pageSize?: number;
}

export class NotesWorkspacesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List workspaces available to the API key context. */
  async list(params?: NotesWorkspacesListParams): Promise<WorkspacePage> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<WorkspacePage>(appendQueryString(customApiPath(`/workspaces`), query));
  }
}

export class NotesApi {
  private client: HttpClient;
  public readonly workspaces: NotesWorkspacesApi;
  public readonly pages: NotesPagesApi;
  public readonly search: NotesSearchApi;
  public readonly exports: NotesExportsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.workspaces = new NotesWorkspacesApi(client);
    this.pages = new NotesPagesApi(client);
    this.search = new NotesSearchApi(client);
    this.exports = new NotesExportsApi(client);
  }

}

export function createNotesApi(client: HttpClient): NotesApi {
  return new NotesApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

interface PathParameterSpec {
  name: string;
  style: string;
  explode: boolean;
}

function serializePathParameter(value: unknown, spec: PathParameterSpec): string {
  if (value === undefined || value === null) {
    return '';
  }

  const style = spec.style || 'simple';
  if (Array.isArray(value)) {
    return serializePathArray(spec.name, value, style, spec.explode);
  }
  if (typeof value === 'object') {
    return serializePathObject(spec.name, value as Record<string, unknown>, style, spec.explode);
  }
  return pathPrefix(spec.name, style, false) + encodePathValue(serializePathPrimitive(value));
}

function serializePathArray(name: string, values: unknown[], style: string, explode: boolean): string {
  const serialized = values
    .filter((item) => item !== undefined && item !== null)
    .map((item) => encodePathValue(serializePathPrimitive(item)));
  if (serialized.length === 0) {
    return pathPrefix(name, style, false);
  }
  if (style === 'matrix') {
    return explode
      ? serialized.map((item) => `;${name}=${item}`).join('')
      : `;${name}=${serialized.join(',')}`;
  }
  return pathPrefix(name, style, false) + serialized.join(explode ? '.' : ',');
}

function serializePathObject(name: string, value: Record<string, unknown>, style: string, explode: boolean): string {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return pathPrefix(name, style, true);
  }
  if (style === 'matrix') {
    return explode
      ? entries.map(([key, entryValue]) => `;${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join('')
      : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',')}`;
  }
  const serialized = explode
    ? entries.map(([key, entryValue]) => `${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join(style === 'label' ? '.' : ',')
    : entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
  return pathPrefix(name, style, true) + serialized;
}

function pathPrefix(name: string, style: string, _objectValue: boolean): string {
  if (style === 'label') return '.';
  if (style === 'matrix') return `;${name}`;
  return '';
}

function encodePathValue(value: string): string {
  return encodeURIComponent(value);
}

function serializePathPrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
interface QueryParameterSpec {
  name: string;
  value: unknown;
  style: string;
  explode: boolean;
  allowReserved: boolean;
  contentType?: string;
}

function buildQueryString(parameters: QueryParameterSpec[]): string {
  const pairs: string[] = [];
  for (const parameter of parameters) {
    appendSerializedParameter(pairs, parameter);
  }
  return pairs.join('&');
}

function appendSerializedParameter(pairs: string[], parameter: QueryParameterSpec): void {
  if (parameter.value === undefined || parameter.value === null) {
    return;
  }

  if (parameter.contentType) {
    pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(JSON.stringify(parameter.value), parameter.allowReserved)}`);
    return;
  }

  const style = parameter.style || 'form';
  if (style === 'deepObject') {
    appendDeepObjectParameter(pairs, parameter.name, parameter.value, parameter.allowReserved);
    return;
  }

  if (Array.isArray(parameter.value)) {
    appendArrayParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
    return;
  }

  if (typeof parameter.value === 'object') {
    appendObjectParameter(pairs, parameter.name, parameter.value as Record<string, unknown>, style, parameter.explode, parameter.allowReserved);
    return;
  }

  pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}

function appendArrayParameter(
  pairs: string[],
  name: string,
  value: unknown[],
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const values = value
    .filter((item) => item !== undefined && item !== null)
    .map((item) => serializePrimitive(item));
  if (values.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const item of values) {
      pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(item, allowReserved)}`);
    }
    return;
  }

  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(values.join(','), allowReserved)}`);
}

function appendObjectParameter(
  pairs: string[],
  name: string,
  value: Record<string, unknown>,
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const [key, entryValue] of entries) {
      pairs.push(`${encodeQueryComponent(key)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
    }
    return;
  }

  const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive(entryValue)]).join(',');
  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serialized, allowReserved)}`);
}

function appendDeepObjectParameter(
  pairs: string[],
  name: string,
  value: unknown,
  allowReserved: boolean,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
    return;
  }

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (entryValue === undefined || entryValue === null) {
      continue;
    }
    pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
  }
}

function serializePrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function encodeQueryComponent(value: string): string {
  return encodeURIComponent(value);
}

function encodeQueryValue(value: string, allowReserved: boolean): string {
  const encoded = encodeURIComponent(value);
  if (!allowReserved) {
    return encoded;
  }
  return encoded.replace(/%3A/gi, ':')
    .replace(/%2F/gi, '/')
    .replace(/%3F/gi, '?')
    .replace(/%23/gi, '#')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
    .replace(/%40/gi, '@')
    .replace(/%21/gi, '!')
    .replace(/%24/gi, '$')
    .replace(/%26/gi, '&')
    .replace(/%27/gi, "'")
    .replace(/%28/gi, '(')
    .replace(/%29/gi, ')')
    .replace(/%2A/gi, '*')
    .replace(/%2B/gi, '+')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%3D/gi, '=');
}
