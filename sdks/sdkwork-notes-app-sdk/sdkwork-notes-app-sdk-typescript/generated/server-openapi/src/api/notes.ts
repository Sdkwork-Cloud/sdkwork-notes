import { appApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';

import type { AiFeedback, AiFeedbackCreateRequest, AiJob, AiSuggestion, AiSuggestionApplyRequest, AiSuggestionDecisionRequest, CreateAiJobRequest, CreatePageRequest, CreateWorkspaceRequest, DriveVersionSummary, NoteRemoteApplyRequest, PageContent, PageInfo, PageSummary, RestorePageVersionRequest, SdkWorkPageData, SearchResult, UpdatePageContentRequest, UpdatePageRequest, Workspace, WorkspaceBootstrap } from '../types';


export class NotesAiSuggestionsFeedbackApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Record user feedback for an AI suggestion quality loop. */
  async create(aiSuggestionId: string, body: AiFeedbackCreateRequest, requestOptions?: ApiRequestOptions): Promise<AiFeedback> {
    return this.client.request<AiFeedback>(appApiPath(`/notes/ai_suggestions/${serializePathParameter(aiSuggestionId, { name: 'aiSuggestionId', style: 'simple', explode: false })}/feedback`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export class NotesAiSuggestionsApi {
  private client: HttpClient;
  public readonly feedback: NotesAiSuggestionsFeedbackApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.feedback = new NotesAiSuggestionsFeedbackApi(client);
  }


/** Accept a reviewable AI suggestion for a Notes page. */
  async accept(aiSuggestionId: string, body: AiSuggestionDecisionRequest, requestOptions?: ApiRequestOptions): Promise<AiSuggestion> {
    return this.client.request<AiSuggestion>(appApiPath(`/notes/ai_suggestions/${serializePathParameter(aiSuggestionId, { name: 'aiSuggestionId', style: 'simple', explode: false })}/accept`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Reject a reviewable AI suggestion for a Notes page. */
  async reject(aiSuggestionId: string, body: AiSuggestionDecisionRequest, requestOptions?: ApiRequestOptions): Promise<AiSuggestion> {
    return this.client.request<AiSuggestion>(appApiPath(`/notes/ai_suggestions/${serializePathParameter(aiSuggestionId, { name: 'aiSuggestionId', style: 'simple', explode: false })}/reject`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Apply an accepted AI suggestion to Drive-backed page content. */
  async apply(aiSuggestionId: string, body: AiSuggestionApplyRequest, requestOptions?: ApiRequestOptions): Promise<PageContent> {
    return this.client.request<PageContent>(appApiPath(`/notes/ai_suggestions/${serializePathParameter(aiSuggestionId, { name: 'aiSuggestionId', style: 'simple', explode: false })}/apply`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export interface NotesAiJobsCreateParams {
  idempotencyKey: string;
}

export class NotesAiJobsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Create an auditable AI job for selected pages, collections, or workspace context. */
  async create(body: CreateAiJobRequest, params: NotesAiJobsCreateParams, requestOptions?: ApiRequestOptions): Promise<AiJob> {
    const requestHeaders = buildRequestHeaders(
      {
        'Idempotency-Key': { value: params.idempotencyKey, style: 'simple', explode: false },
      },
      {}
    );
    return this.client.request<AiJob>(appApiPath(`/notes/ai_jobs`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', ...(requestHeaders !== undefined ? { headers: requestHeaders } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface NotesSearchListParams {
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


/** Search Notes page projections while preserving Drive version provenance. */
  async list(params?: NotesSearchListParams, requestOptions?: ApiRequestOptions): Promise<{ items: SearchResult[]; pageInfo: PageInfo; }> {
    const query = buildQueryString([
      { name: 'workspace_id', value: params?.workspaceId, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<{ items: SearchResult[]; pageInfo: PageInfo; }>(appendQueryString(appApiPath(`/notes/search`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }
}

export interface NotesPagesAiSuggestionsListParams {
  page?: number;
  pageSize?: number;
}

export class NotesPagesAiSuggestionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List reviewable AI suggestions for a Notes page. */
  async list(pageId: string, params?: NotesPagesAiSuggestionsListParams, requestOptions?: ApiRequestOptions): Promise<{ items: AiSuggestion[]; pageInfo: PageInfo; }> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<{ items: AiSuggestion[]; pageInfo: PageInfo; }>(appendQueryString(appApiPath(`/notes/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/ai_suggestions`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
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


/** List Drive node versions for a Notes page through the Notes business facade. */
  async list(pageId: string, params?: NotesPagesVersionsListParams, requestOptions?: ApiRequestOptions): Promise<{ items: DriveVersionSummary[]; pageInfo: PageInfo; }> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<{ items: DriveVersionSummary[]; pageInfo: PageInfo; }>(appendQueryString(appApiPath(`/notes/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/versions`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Restore a Drive-owned page content version through the Notes business facade. */
  async restore(pageId: string, driveVersionId: string, body: RestorePageVersionRequest, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    return this.client.request<SdkWorkPageData>(appApiPath(`/notes/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/versions/${serializePathParameter(driveVersionId, { name: 'driveVersionId', style: 'simple', explode: false })}/restore`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'page' });
  }
}

export class NotesPagesContentApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Retrieve Drive-backed page content through the Notes facade. */
  async retrieve(pageId: string, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    return this.client.request<SdkWorkPageData>(appApiPath(`/notes/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/content`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Update Drive-backed page content and refresh Notes current version pointers. */
  async update(pageId: string, body: UpdatePageContentRequest, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    return this.client.request<SdkWorkPageData>(appApiPath(`/notes/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/content`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PUT' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'page' });
  }
}

export interface NotesPagesListParams {
  page?: number;
  pageSize?: number;
  q?: string;
}

export class NotesPagesApi {
  private client: HttpClient;
  public readonly content: NotesPagesContentApi;
  public readonly versions: NotesPagesVersionsApi;
  public readonly aiSuggestions: NotesPagesAiSuggestionsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.content = new NotesPagesContentApi(client);
    this.versions = new NotesPagesVersionsApi(client);
    this.aiSuggestions = new NotesPagesAiSuggestionsApi(client);
  }


/** List pages in a workspace. */
  async list(workspaceId: string, params?: NotesPagesListParams, requestOptions?: ApiRequestOptions): Promise<{ items: PageSummary[]; pageInfo: PageInfo; }> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<{ items: PageSummary[]; pageInfo: PageInfo; }>(appendQueryString(appApiPath(`/notes/workspaces/${serializePathParameter(workspaceId, { name: 'workspaceId', style: 'simple', explode: false })}/pages`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Create a Drive-backed Notes page. */
  async create(workspaceId: string, body: CreatePageRequest, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    return this.client.request<SdkWorkPageData>(appApiPath(`/notes/workspaces/${serializePathParameter(workspaceId, { name: 'workspaceId', style: 'simple', explode: false })}/pages`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'page' });
  }

/** Retrieve Notes page metadata and Drive binding references. */
  async retrieve(pageId: string, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    return this.client.request<SdkWorkPageData>(appApiPath(`/notes/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Update mutable Notes page metadata. */
  async update(pageId: string, body: UpdatePageRequest, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    return this.client.request<SdkWorkPageData>(appApiPath(`/notes/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'page' });
  }

/** Apply a queued sync mutation to a Notes page. */
  async remoteApply(pageId: string, body: NoteRemoteApplyRequest, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    return this.client.request<SdkWorkPageData>(appApiPath(`/notes/pages/${serializePathParameter(pageId, { name: 'pageId', style: 'simple', explode: false })}/remote_apply`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'page' });
  }
}

export class NotesWorkspacesBootstrapApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Retrieve workspace bootstrap metadata for editor startup. */
  async retrieve(workspaceId: string, requestOptions?: ApiRequestOptions): Promise<WorkspaceBootstrap> {
    return this.client.request<WorkspaceBootstrap>(appApiPath(`/notes/workspaces/${serializePathParameter(workspaceId, { name: 'workspaceId', style: 'simple', explode: false })}/bootstrap`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }
}

export interface NotesWorkspacesListParams {
  page?: number;
  pageSize?: number;
}

export class NotesWorkspacesApi {
  private client: HttpClient;
  public readonly bootstrap: NotesWorkspacesBootstrapApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.bootstrap = new NotesWorkspacesBootstrapApi(client);
  }


/** List Notes workspaces visible to the current app principal. */
  async list(params?: NotesWorkspacesListParams, requestOptions?: ApiRequestOptions): Promise<{ items: Workspace[]; pageInfo: PageInfo; }> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<{ items: Workspace[]; pageInfo: PageInfo; }>(appendQueryString(appApiPath(`/notes/workspaces`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Create a Notes workspace and bind it to a Drive Notes space or compatible app-upload space. */
  async create(body: CreateWorkspaceRequest, requestOptions?: ApiRequestOptions): Promise<Workspace> {
    return this.client.request<Workspace>(appApiPath(`/notes/workspaces`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export class NotesApi {
  public readonly workspaces: NotesWorkspacesApi;
  public readonly pages: NotesPagesApi;
  public readonly search: NotesSearchApi;
  public readonly aiJobs: NotesAiJobsApi;
  public readonly aiSuggestions: NotesAiSuggestionsApi;

  constructor(client: HttpClient) {
    this.workspaces = new NotesWorkspacesApi(client);
    this.pages = new NotesPagesApi(client);
    this.search = new NotesSearchApi(client);
    this.aiJobs = new NotesAiJobsApi(client);
    this.aiSuggestions = new NotesAiSuggestionsApi(client);
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
function buildRequestHeaders(
  headers: Record<string, HeaderParameterSpec | undefined>,
  cookies: Record<string, HeaderParameterSpec | undefined> = {},
): Record<string, string> | undefined {
  const requestHeaders: Record<string, string> = {};

  for (const [name, parameter] of Object.entries(headers)) {
    const serialized = serializeParameterValue(parameter);
    if (serialized !== undefined) {
      requestHeaders[name] = serialized;
    }
  }

  const cookieHeader = buildCookieHeader(cookies);
  if (cookieHeader) {
    requestHeaders.Cookie = requestHeaders.Cookie
      ? `${requestHeaders.Cookie}; ${cookieHeader}`
      : cookieHeader;
  }

  return Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined;
}

interface HeaderParameterSpec {
  value: unknown;
  style: string;
  explode: boolean;
  contentType?: string;
}

function buildCookieHeader(cookies: Record<string, HeaderParameterSpec | undefined>): string | undefined {
  const pairs: string[] = [];
  for (const [name, parameter] of Object.entries(cookies)) {
    const serialized = serializeParameterValue(parameter);
    if (serialized !== undefined) {
      pairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(serialized)}`);
    }
  }
  return pairs.length > 0 ? pairs.join('; ') : undefined;
}

function serializeParameterValue(parameter: HeaderParameterSpec | undefined): string | undefined {
  const value = parameter?.value;
  if (value === undefined || value === null) {
    return undefined;
  }
  if (parameter?.contentType) {
    return JSON.stringify(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeHeaderPrimitive(item)).join(',');
  }
  if (typeof value === 'object' && value !== null) {
    return serializeHeaderObject(value as Record<string, unknown>, parameter?.explode === true);
  }
  return serializeHeaderPrimitive(value);
}

function serializeHeaderObject(value: Record<string, unknown>, explode: boolean): string {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (explode) {
    return entries.map(([key, entryValue]) => `${key}=${serializeHeaderPrimitive(entryValue)}`).join(',');
  }
  return entries.flatMap(([key, entryValue]) => [key, serializeHeaderPrimitive(entryValue)]).join(',');
}

function serializeHeaderPrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}
