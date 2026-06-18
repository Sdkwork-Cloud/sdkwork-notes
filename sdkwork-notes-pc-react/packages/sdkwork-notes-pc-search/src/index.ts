export const NOTES_SEARCH_PACKAGE = '@sdkwork/notes-pc-search';
export const NOTES_SEARCH_QUERY_LIMIT_DEFAULT = 20;

export type NotesSearchNoteType = 'doc' | 'article' | 'novel' | 'log' | 'news' | 'code';
export type NotesSearchResultSource = 'workspace-search' | 'command-palette';

export interface NotesSearchRecordRef {
  id: string;
  title: string;
  snippet: string;
}

export interface NotesSearchDocumentFolder {
  id: string | null;
  name: string | null;
  path: string[];
}

export interface NotesSearchDocument {
  id: string;
  kind: 'note';
  noteId: string;
  title: string;
  body: string;
  snippet: string;
  tags: string[];
  folder: NotesSearchDocumentFolder;
  updatedAt: string;
  type: NotesSearchNoteType;
  isFavorite: boolean;
  isTrashed: boolean;
  hasLocalDraft: boolean;
  draftCapturedAt: string | null;
}

export interface NotesSearchQuery {
  text: string;
  tags: string[];
  folderId: string | null;
  limit: number;
  includeTrashed: boolean;
}

export interface NotesSearchResult {
  document: NotesSearchDocument;
  score: number;
  source: 'workspace-search' | 'command-palette';
}

export interface NotesSearchWorkspaceNoteInput {
  id: string;
  title: string;
  type: NotesSearchNoteType;
  parentId: string | null;
  tags: string[];
  isFavorite: boolean;
  snippet: string;
  updatedAt: string | number;
  deletedAt?: string | number;
}

export interface NotesSearchWorkspaceFolderInput {
  id: string;
  name: string;
  parentId: string | null;
  updatedAt: string | number;
}

export interface NotesSearchWorkspaceSnapshotInput {
  notes: NotesSearchWorkspaceNoteInput[];
  trashedNotes?: NotesSearchWorkspaceNoteInput[];
  folders: NotesSearchWorkspaceFolderInput[];
}

export interface NotesSearchLocalDraftPayloadInput {
  title: string;
  content: string;
  type: NotesSearchNoteType;
  parentId: string | null;
  tags: string[];
  isFavorite: boolean;
  publishStatus?: 'draft' | 'archived';
}

export interface NotesSearchLocalDraftInput {
  noteId: string;
  capturedAt: string | number;
  draft: NotesSearchLocalDraftPayloadInput;
}

export interface NotesSearchLocalRecordRefInput {
  id: string;
  updatedAt: string | number;
}

export interface NotesSearchLocalSnapshotInput {
  notes?: NotesSearchLocalRecordRefInput[];
  folders?: NotesSearchLocalRecordRefInput[];
  drafts: NotesSearchLocalDraftInput[];
}

export interface NotesSearchDocumentBuilderInput {
  workspaceSnapshot: NotesSearchWorkspaceSnapshotInput;
  localSnapshot?: NotesSearchLocalSnapshotInput;
}

export interface NotesSearchService {
  search(query: NotesSearchQuery): Promise<NotesSearchResult[]>;
  rebuild(documents?: NotesSearchDocument[]): Promise<void>;
}

function normalizeString(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function normalizeNullableString(value: unknown) {
  const normalized = normalizeString(value);
  return normalized || null;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const values: string[] = [];
  const seen = new Set<string>();

  value.forEach((item) => {
    const normalized = normalizeString(item);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    values.push(normalized);
  });

  return values;
}

function normalizeFilterTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const values: string[] = [];
  const seen = new Set<string>();

  value.forEach((item) => {
    const normalized = normalizeString(item).toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    values.push(normalized);
  });

  return values;
}

function normalizeTimestamp(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  const normalized = normalizeString(value);
  if (!normalized) {
    return '';
  }

  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) {
    return '';
  }

  return typeof value === 'string' ? normalized : new Date(parsed).toISOString();
}

function normalizeLimit(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) {
    return NOTES_SEARCH_QUERY_LIMIT_DEFAULT;
  }

  return Math.max(1, Math.min(100, Math.round(value)));
}

function normalizeNoteType(value: unknown): NotesSearchNoteType {
  return value === 'article'
    || value === 'novel'
    || value === 'log'
    || value === 'news'
    || value === 'code'
    ? value
    : 'doc';
}

function toPlainText(content: unknown) {
  if (typeof content !== 'string' || content.length === 0) {
    return '';
  }

  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createSnippet(body: string, fallback: string) {
  const candidate = body || fallback;
  return candidate.length > 160 ? candidate.slice(0, 160).trimEnd() : candidate;
}

function normalizeSearchText(value: unknown) {
  return normalizeString(value).toLowerCase();
}

function getDocumentTimestamp(document: NotesSearchDocument) {
  const parsed = Date.parse(document.updatedAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

function matchesTagFilters(document: NotesSearchDocument, tags: string[]) {
  if (tags.length === 0) {
    return true;
  }

  const documentTags = new Set(document.tags.map((tag) => normalizeSearchText(tag)));
  return tags.every((tag) => documentTags.has(tag));
}

function matchesFolderFilter(document: NotesSearchDocument, folderId: string | null) {
  if (!folderId) {
    return true;
  }

  return document.folder.id === folderId;
}

function getDocumentTextScore(document: NotesSearchDocument, normalizedText: string) {
  if (!normalizedText) {
    return document.isFavorite ? 10 : 0;
  }

  const title = normalizeSearchText(document.title);
  const body = normalizeSearchText(document.body);
  const tags = document.tags.map((tag) => normalizeSearchText(tag));
  const folder = normalizeSearchText([
    document.folder.name ?? '',
    ...document.folder.path,
  ].join(' '));

  let score = 0;
  let matched = false;

  if (title === normalizedText) {
    score += 180;
    matched = true;
  } else if (title.startsWith(normalizedText)) {
    score += 160;
    matched = true;
  } else if (title.includes(normalizedText)) {
    score += 140;
    matched = true;
  }

  if (tags.some((tag) => tag === normalizedText)) {
    score += 100;
    matched = true;
  } else if (tags.some((tag) => tag.includes(normalizedText))) {
    score += 80;
    matched = true;
  }

  if (folder.includes(normalizedText)) {
    score += 40;
    matched = true;
  }

  if (body.includes(normalizedText)) {
    score += 60;
    matched = true;
  }

  if (!matched) {
    return null;
  }

  if (document.isFavorite) {
    score += 5;
  }

  return score;
}

function buildFolderIndex(folders: NotesSearchWorkspaceFolderInput[]) {
  const index = new Map<string, NotesSearchWorkspaceFolderInput>();
  folders.forEach((folder) => {
    const folderId = normalizeString(folder?.id);
    if (!folderId) {
      return;
    }

    index.set(folderId, folder);
  });
  return index;
}

function resolveFolderPath(
  folderIndex: Map<string, NotesSearchWorkspaceFolderInput>,
  folderId: string | null,
) {
  if (!folderId) {
    return [];
  }

  const path: string[] = [];
  const visited = new Set<string>();
  let cursor: string | null = folderId;

  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const folder = folderIndex.get(cursor);
    if (!folder) {
      break;
    }

    const name = normalizeString(folder.name);
    if (name) {
      path.unshift(name);
    }
    cursor = normalizeNullableString(folder.parentId);
  }

  return path;
}

function resolveFolderRef(
  folderIndex: Map<string, NotesSearchWorkspaceFolderInput>,
  folderId: string | null,
): NotesSearchDocumentFolder {
  if (!folderId) {
    return {
      id: null,
      name: null,
      path: [],
    };
  }

  const folder = folderIndex.get(folderId);
  return {
    id: folderId,
    name: folder ? normalizeString(folder.name) || null : null,
    path: resolveFolderPath(folderIndex, folderId),
  };
}

function buildDraftIndex(localSnapshot?: NotesSearchLocalSnapshotInput) {
  const index = new Map<string, NotesSearchLocalDraftInput>();
  if (!localSnapshot || !Array.isArray(localSnapshot.drafts)) {
    return index;
  }

  localSnapshot.drafts.forEach((draft) => {
    const noteId = normalizeString(draft?.noteId);
    if (!noteId) {
      return;
    }

    index.set(noteId, draft);
  });

  return index;
}

function createDocument(
  note: NotesSearchWorkspaceNoteInput,
  isTrashed: boolean,
  folderIndex: Map<string, NotesSearchWorkspaceFolderInput>,
  draftIndex: Map<string, NotesSearchLocalDraftInput>,
): NotesSearchDocument | null {
  const noteId = normalizeString(note?.id);
  if (!noteId) {
    return null;
  }

  const draft = draftIndex.get(noteId);
  const noteTitle = normalizeString(note.title);
  const noteSnippet = normalizeString(note.snippet);
  const draftTitle = normalizeString(draft?.draft?.title);
  const body = toPlainText(draft?.draft?.content) || noteSnippet;
  const folderId = normalizeNullableString(draft?.draft?.parentId) ?? normalizeNullableString(note.parentId);
  const draftCapturedAt = draft ? normalizeTimestamp(draft.capturedAt) || null : null;

  return {
    id: `note:${noteId}`,
    kind: 'note',
    noteId,
    title: draftTitle || noteTitle,
    body,
    snippet: createSnippet(body, noteSnippet),
    tags: normalizeStringArray(draft?.draft?.tags ?? note.tags),
    folder: resolveFolderRef(folderIndex, folderId),
    updatedAt: draftCapturedAt ?? normalizeTimestamp(note.updatedAt),
    type: normalizeNoteType(draft?.draft?.type ?? note.type),
    isFavorite: draft ? Boolean(draft.draft.isFavorite) : Boolean(note.isFavorite),
    isTrashed: isTrashed || Boolean(note.deletedAt),
    hasLocalDraft: Boolean(draft),
    draftCapturedAt,
  };
}

export function normalizeNotesSearchQuery(
  query: Partial<NotesSearchQuery> & { keyword?: unknown } = {},
): NotesSearchQuery {
  return {
    text: normalizeString(query.text ?? query.keyword),
    tags: normalizeFilterTags(query.tags),
    folderId: normalizeNullableString(query.folderId),
    limit: normalizeLimit(query.limit),
    includeTrashed: Boolean(query.includeTrashed),
  };
}

export function buildNotesSearchDocuments(
  input: NotesSearchDocumentBuilderInput,
): NotesSearchDocument[] {
  const workspaceSnapshot = input?.workspaceSnapshot;
  if (!workspaceSnapshot) {
    return [];
  }

  const folderIndex = buildFolderIndex(Array.isArray(workspaceSnapshot.folders) ? workspaceSnapshot.folders : []);
  const draftIndex = buildDraftIndex(input.localSnapshot);
  const documents = [
    ...(Array.isArray(workspaceSnapshot.notes) ? workspaceSnapshot.notes : []),
    ...(Array.isArray(workspaceSnapshot.trashedNotes) ? workspaceSnapshot.trashedNotes : []),
  ].map((note) => createDocument(note, Boolean(note?.deletedAt), folderIndex, draftIndex));

  return documents.filter((document): document is NotesSearchDocument => document !== null);
}

export function createNotesSearchResult(
  document: NotesSearchDocument,
  overrides: Partial<Pick<NotesSearchResult, 'score' | 'source'>> = {},
): NotesSearchResult {
  return {
    document,
    score: typeof overrides.score === 'number' && Number.isFinite(overrides.score)
      ? overrides.score
      : 1,
    source: overrides.source === 'command-palette' ? 'command-palette' : 'workspace-search',
  };
}

export function searchNotesSearchDocuments(
  documents: NotesSearchDocument[],
  query: Partial<NotesSearchQuery> & { keyword?: unknown } = {},
  options: { source?: NotesSearchResultSource } = {},
): NotesSearchResult[] {
  const normalizedQuery = normalizeNotesSearchQuery(query);
  const normalizedText = normalizeSearchText(normalizedQuery.text);
  const source = options.source === 'command-palette' ? 'command-palette' : 'workspace-search';

  return (Array.isArray(documents) ? documents : [])
    .filter((document) => normalizedQuery.includeTrashed || !document.isTrashed)
    .filter((document) => matchesTagFilters(document, normalizedQuery.tags))
    .filter((document) => matchesFolderFilter(document, normalizedQuery.folderId))
    .map((document) => {
      const score = getDocumentTextScore(document, normalizedText);
      if (score === null) {
        return null;
      }

      return createNotesSearchResult(document, {
        score,
        source,
      });
    })
    .filter((result): result is NotesSearchResult => result !== null)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (left.document.isTrashed !== right.document.isTrashed) {
        return Number(left.document.isTrashed) - Number(right.document.isTrashed);
      }

      const timestampDelta = getDocumentTimestamp(right.document) - getDocumentTimestamp(left.document);
      if (timestampDelta !== 0) {
        return timestampDelta;
      }

      return left.document.title.localeCompare(right.document.title);
    })
    .slice(0, normalizedQuery.limit);
}

export function createInMemoryNotesSearchService(
  initialDocuments: NotesSearchDocument[] = [],
): NotesSearchService {
  let currentDocuments = Array.isArray(initialDocuments) ? [...initialDocuments] : [];

  return {
    async search(query) {
      return searchNotesSearchDocuments(currentDocuments, query);
    },
    async rebuild(documents = []) {
      currentDocuments = Array.isArray(documents) ? [...documents] : [];
    },
  };
}
