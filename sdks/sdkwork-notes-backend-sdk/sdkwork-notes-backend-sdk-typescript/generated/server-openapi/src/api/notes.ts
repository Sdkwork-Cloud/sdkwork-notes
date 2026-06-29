import { backendApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { AdminUpdateWorkspaceRequest, AiFeedback, AiJob, AiSuggestion, AiSuggestionApplyRequest, AiSuggestionDecisionRequest, CompleteAiJobRequest, CreateIndexJobRequest, DriveOrphanDiagnostic, IndexJob, PageContent, PageInfo, RebuildProjectionRequest, RepairDriveOrphansRequest, WorkspaceAdmin } from '../types';


export interface NotesAiSuggestionsFeedbackListParams {
  page?: number;
  pageSize?: number;
}

export class NotesAiSuggestionsFeedbackApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List AI suggestion feedback for backend-admin quality review. */
  async list(aiSuggestionId: string, params?: NotesAiSuggestionsFeedbackListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/notes/ai_suggestions/${serializePathParameter(aiSuggestionId, { name: 'aiSuggestionId', style: 'simple', explode: false })}/feedback`), query));
  }
}

export class NotesAiSuggestionsApi {
  private client: HttpClient;
  public readonly feedback: NotesAiSuggestionsFeedbackApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.feedback = new NotesAiSuggestionsFeedbackApi(client);
  }


/** Accept an AI suggestion through backend-admin controls. */
  async accept(aiSuggestionId: string, body: AiSuggestionDecisionRequest): Promise<AiSuggestion> {
    return this.client.post<AiSuggestion>(backendApiPath(`/notes/ai_suggestions/${serializePathParameter(aiSuggestionId, { name: 'aiSuggestionId', style: 'simple', explode: false })}/accept`), body, undefined, undefined, 'application/json');
  }

/** Reject an AI suggestion through backend-admin controls. */
  async reject(aiSuggestionId: string, body: AiSuggestionDecisionRequest): Promise<AiSuggestion> {
    return this.client.post<AiSuggestion>(backendApiPath(`/notes/ai_suggestions/${serializePathParameter(aiSuggestionId, { name: 'aiSuggestionId', style: 'simple', explode: false })}/reject`), body, undefined, undefined, 'application/json');
  }

/** Apply an accepted AI suggestion through backend-admin controls. */
  async apply(aiSuggestionId: string, body: AiSuggestionApplyRequest): Promise<PageContent> {
    return this.client.post<PageContent>(backendApiPath(`/notes/ai_suggestions/${serializePathParameter(aiSuggestionId, { name: 'aiSuggestionId', style: 'simple', explode: false })}/apply`), body, undefined, undefined, 'application/json');
  }
}

export interface NotesDiagnosticsDriveOrphansListParams {
  workspaceId?: string;
  page?: number;
  pageSize?: number;
}

export class NotesDiagnosticsDriveOrphansApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List Notes metadata records with missing or inconsistent Drive bindings. */
  async list(params?: NotesDiagnosticsDriveOrphansListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'workspace_id', value: params?.workspaceId, style: 'form', explode: true, allowReserved: false },
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/notes/diagnostics/drive_orphans`), query));
  }

/** Queue repair for Notes metadata records with inconsistent Drive bindings. */
  async repair(body: RepairDriveOrphansRequest): Promise<IndexJob> {
    return this.client.post<IndexJob>(backendApiPath(`/notes/diagnostics/drive_orphans`), body, undefined, undefined, 'application/json');
  }
}

export class NotesDiagnosticsApi {
  private client: HttpClient;
  public readonly driveOrphans: NotesDiagnosticsDriveOrphansApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.driveOrphans = new NotesDiagnosticsDriveOrphansApi(client);
  }

}

export interface NotesAiJobsAdminListParams {
  page?: number;
  pageSize?: number;
  workspaceId?: string;
}

export class NotesAiJobsAdminApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List AI jobs for backend-admin review. */
  async list(params?: NotesAiJobsAdminListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'workspace_id', value: params?.workspaceId, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/notes/ai_jobs`), query));
  }

/** Retrieve backend-admin AI job details. */
  async retrieve(aiJobId: string): Promise<AiJob> {
    return this.client.get<AiJob>(backendApiPath(`/notes/ai_jobs/${serializePathParameter(aiJobId, { name: 'aiJobId', style: 'simple', explode: false })}`));
  }
}

export class NotesAiJobsApi {
  private client: HttpClient;
  public readonly admin: NotesAiJobsAdminApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.admin = new NotesAiJobsAdminApi(client);
  }


/** Cancel a running AI job through backend-admin controls. */
  async cancel(aiJobId: string): Promise<AiJob> {
    return this.client.post<AiJob>(backendApiPath(`/notes/ai_jobs/${serializePathParameter(aiJobId, { name: 'aiJobId', style: 'simple', explode: false })}/cancel`));
  }

/** Claim a queued AI job for backend worker execution. */
  async claim(aiJobId: string): Promise<AiJob> {
    return this.client.post<AiJob>(backendApiPath(`/notes/ai_jobs/${serializePathParameter(aiJobId, { name: 'aiJobId', style: 'simple', explode: false })}/claim`));
  }

/** Complete a running AI job and persist reviewable suggestions. */
  async complete(aiJobId: string, body: CompleteAiJobRequest): Promise<AiJob> {
    return this.client.post<AiJob>(backendApiPath(`/notes/ai_jobs/${serializePathParameter(aiJobId, { name: 'aiJobId', style: 'simple', explode: false })}/complete`), body, undefined, undefined, 'application/json');
  }
}

export interface NotesIndexJobsListParams {
  page?: number;
  pageSize?: number;
  workspaceId?: string;
}

export class NotesIndexJobsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List Notes index and projection jobs. */
  async list(params?: NotesIndexJobsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'workspace_id', value: params?.workspaceId, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/notes/index_jobs`), query));
  }

/** Create an index or projection job. */
  async create(body: CreateIndexJobRequest): Promise<IndexJob> {
    return this.client.post<IndexJob>(backendApiPath(`/notes/index_jobs`), body, undefined, undefined, 'application/json');
  }

/** Retrieve an index or projection job. */
  async retrieve(indexJobId: string): Promise<IndexJob> {
    return this.client.get<IndexJob>(backendApiPath(`/notes/index_jobs/${serializePathParameter(indexJobId, { name: 'indexJobId', style: 'simple', explode: false })}`));
  }
}

export class NotesWorkspacesProjectionApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Queue a projection rebuild for a Notes workspace. */
  async rebuild(workspaceId: string, body: RebuildProjectionRequest): Promise<IndexJob> {
    return this.client.post<IndexJob>(backendApiPath(`/notes/workspaces/${serializePathParameter(workspaceId, { name: 'workspaceId', style: 'simple', explode: false })}/projection_rebuild`), body, undefined, undefined, 'application/json');
  }
}

export interface NotesWorkspacesAdminListParams {
  page?: number;
  pageSize?: number;
  q?: string;
}

export class NotesWorkspacesAdminApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List Notes workspaces for backend-admin governance. */
  async list(params?: NotesWorkspacesAdminListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/notes/workspaces`), query));
  }

/** Retrieve backend-admin workspace diagnostics. */
  async retrieve(workspaceId: string): Promise<WorkspaceAdmin> {
    return this.client.get<WorkspaceAdmin>(backendApiPath(`/notes/workspaces/${serializePathParameter(workspaceId, { name: 'workspaceId', style: 'simple', explode: false })}`));
  }

/** Update backend-admin workspace governance fields. */
  async update(workspaceId: string, body: AdminUpdateWorkspaceRequest): Promise<WorkspaceAdmin> {
    return this.client.patch<WorkspaceAdmin>(backendApiPath(`/notes/workspaces/${serializePathParameter(workspaceId, { name: 'workspaceId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export class NotesWorkspacesApi {
  private client: HttpClient;
  public readonly admin: NotesWorkspacesAdminApi;
  public readonly projection: NotesWorkspacesProjectionApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.admin = new NotesWorkspacesAdminApi(client);
    this.projection = new NotesWorkspacesProjectionApi(client);
  }

}

export class NotesApi {
  private client: HttpClient;
  public readonly workspaces: NotesWorkspacesApi;
  public readonly indexJobs: NotesIndexJobsApi;
  public readonly aiJobs: NotesAiJobsApi;
  public readonly diagnostics: NotesDiagnosticsApi;
  public readonly aiSuggestions: NotesAiSuggestionsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.workspaces = new NotesWorkspacesApi(client);
    this.indexJobs = new NotesIndexJobsApi(client);
    this.aiJobs = new NotesAiJobsApi(client);
    this.diagnostics = new NotesDiagnosticsApi(client);
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
