import type { Note, NoteFolder, NoteSummary } from '@sdkwork/notes-pc-types';
import { buildNotesSearchDocuments, searchNotesSearchDocuments } from '@sdkwork/notes-pc-search';
import type { NotesCollectionView } from '../types/notesWorkspace';

export interface FlatFolderTreeItem {
  folder: NoteFolder;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
}

export interface NoteOutlineItem {
  level: number;
  text: string;
  anchor: string;
}

export interface NoteTaskProgress {
  total: number;
  completed: number;
  remaining: number;
  ratio: number;
}

export interface NotesWorkspaceCounts {
  all: number;
  favorites: number;
  recent: number;
  trash: number;
}

export interface NotesWorkspaceSyncTaskLike {
  id: string;
  entityId?: string | null;
  status: 'queued' | 'running' | 'completed' | 'retrying' | 'failed' | 'conflict';
  at?: string | number | null;
  nextRetryAt?: string | number | null;
  lastFailure?: {
    code: string;
    message: string;
    occurredAt?: string | number | null;
  } | null;
  lastConflict?: {
    code: string;
    message: string;
    occurredAt?: string | number | null;
  } | null;
}

export interface NotesWorkspaceSyncSummary {
  queueDepth: number;
  pendingCount: number;
  blockingCount: number;
  queuedCount: number;
  retryingCount: number;
  failedCount: number;
  conflictCount: number;
  completedCount: number;
  primaryStatus: 'idle' | 'queued' | 'retrying' | 'failed' | 'conflict';
  primaryTaskId: string | null;
  primaryEntityId: string | null;
  primaryCode: string | null;
  primaryMessage: string | null;
  nextRetryLabel: string;
}

export interface NotesWorkspaceViewModel {
  visibleNotes: NoteSummary[];
  counts: NotesWorkspaceCounts;
  activeOutline: NoteOutlineItem[];
  activeTaskProgress: NoteTaskProgress;
  activeWordCount: number;
  activeNoteFolderName: string | null;
  activeNoteUpdatedLabel: string;
  syncSummary: NotesWorkspaceSyncSummary;
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

function toTimestamp(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = normalizeString(value);
  if (!normalized) {
    return 0;
  }
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildParentMap(folders: NoteFolder[]) {
  const parentMap = new Map<string, string | null>();
  folders.forEach((folder) => {
    parentMap.set(folder.id, folder.parentId ?? null);
  });
  return parentMap;
}

function isWithinFolderScope(
  parentMap: Map<string, string | null>,
  noteParentId: string | null,
  selectedFolderId: string | null,
) {
  if (!selectedFolderId) {
    return true;
  }

  let cursor = noteParentId;
  while (cursor) {
    if (cursor === selectedFolderId) {
      return true;
    }
    cursor = parentMap.get(cursor) ?? null;
  }
  return false;
}

function getNotesWithinSelectedFolderScope(
  notes: NoteSummary[],
  folders: NoteFolder[],
  selectedFolderId: string | null,
) {
  const parentMap = buildParentMap(folders);
  return notes.filter((note) => isWithinFolderScope(parentMap, note.parentId, selectedFolderId));
}

function searchVisibleNotes(options: {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
  searchQuery: string;
  includeTrashed: boolean;
}) {
  const {
    notes,
    trashedNotes,
    folders,
    searchQuery,
    includeTrashed,
  } = options;

  const allNotes = [...notes, ...trashedNotes];
  const noteIndex = new Map(allNotes.map((note) => [note.id, note] satisfies [string, NoteSummary]));
  const documents = buildNotesSearchDocuments({
    workspaceSnapshot: {
      notes,
      trashedNotes,
      folders,
    },
  });
  const results = searchNotesSearchDocuments(
    documents,
    {
      text: searchQuery,
      includeTrashed,
      limit: Math.max(documents.length, 20),
    },
    {
      source: 'workspace-search',
    },
  );

  return results
    .map((result) => noteIndex.get(result.document.noteId) ?? null)
    .filter((note): note is NoteSummary => note !== null);
}

export function getVisibleNotes(options: {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
  activeView: NotesCollectionView;
  searchQuery: string;
  selectedFolderId: string | null;
}) {
  const {
    notes,
    trashedNotes,
    folders,
    activeView,
    searchQuery,
    selectedFolderId,
  } = options;
  const normalizedSearchQuery = normalizeString(searchQuery);
  const scopedNotes = getNotesWithinSelectedFolderScope(notes, folders, selectedFolderId);
  const scopedTrashedNotes = getNotesWithinSelectedFolderScope(trashedNotes, folders, selectedFolderId);

  if (activeView === 'trash') {
    if (!normalizedSearchQuery) {
      return scopedTrashedNotes;
    }

    return searchVisibleNotes({
      notes: [],
      trashedNotes: scopedTrashedNotes,
      folders,
      searchQuery: normalizedSearchQuery,
      includeTrashed: true,
    });
  }

  if (activeView === 'favorites') {
    const favoriteNotes = scopedNotes.filter((note) => note.isFavorite);
    if (!normalizedSearchQuery) {
      return favoriteNotes;
    }

    return searchVisibleNotes({
      notes: favoriteNotes,
      trashedNotes: [],
      folders,
      searchQuery: normalizedSearchQuery,
      includeTrashed: false,
    });
  }

  if (activeView === 'recent') {
    const recentCandidates = normalizedSearchQuery
      ? searchVisibleNotes({
        notes: scopedNotes,
        trashedNotes: [],
        folders,
        searchQuery: normalizedSearchQuery,
        includeTrashed: false,
      })
      : scopedNotes;

    return [...recentCandidates]
      .sort((left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt))
      .slice(0, 12);
  }

  if (!normalizedSearchQuery) {
    return scopedNotes;
  }

  return searchVisibleNotes({
    notes: scopedNotes,
    trashedNotes: [],
    folders,
    searchQuery: normalizedSearchQuery,
    includeTrashed: false,
  });
}

export function buildNotesWorkspaceViewModel(options: {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
  activeView: NotesCollectionView;
  searchQuery: string;
  selectedFolderId: string | null;
  activeNote: Note | null;
  locale?: string;
  nowValue?: number;
  syncTasks?: NotesWorkspaceSyncTaskLike[];
}): NotesWorkspaceViewModel {
  const {
    notes,
    trashedNotes,
    folders,
    activeView,
    searchQuery,
    selectedFolderId,
    activeNote,
    locale = 'en-US',
    nowValue,
    syncTasks = [],
  } = options;

  return {
    visibleNotes: getVisibleNotes({
      notes,
      trashedNotes,
      folders,
      activeView,
      searchQuery,
      selectedFolderId,
    }),
    counts: {
      all: notes.length,
      favorites: notes.filter((note) => note.isFavorite).length,
      recent: Math.min(notes.length, 12),
      trash: trashedNotes.length,
    },
    activeOutline: extractNoteOutline(activeNote),
    activeTaskProgress: getNoteTaskProgress(activeNote),
    activeWordCount: countNoteWords(activeNote),
    activeNoteFolderName: folders.find((folder) => folder.id === activeNote?.parentId)?.name || null,
    activeNoteUpdatedLabel: activeNote
      ? formatRelativeNoteTime(activeNote.updatedAt, locale, nowValue)
      : '',
    syncSummary: summarizeNotesWorkspaceSyncTasks(syncTasks, locale, nowValue),
  };
}

function createEmptyNotesWorkspaceSyncSummary(): NotesWorkspaceSyncSummary {
  return {
    queueDepth: 0,
    pendingCount: 0,
    blockingCount: 0,
    queuedCount: 0,
    retryingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    completedCount: 0,
    primaryStatus: 'idle',
    primaryTaskId: null,
    primaryEntityId: null,
    primaryCode: null,
    primaryMessage: null,
    nextRetryLabel: '',
  };
}

function resolveNotesWorkspaceSyncPrimaryStatus(
  task: NotesWorkspaceSyncTaskLike | null,
): NotesWorkspaceSyncSummary['primaryStatus'] {
  if (!task) {
    return 'idle';
  }

  if (task.status === 'running') {
    return 'queued';
  }

  if (task.status === 'completed') {
    return 'idle';
  }

  return task.status;
}

function resolveNotesWorkspaceSyncPrimaryCode(task: NotesWorkspaceSyncTaskLike | null) {
  if (!task) {
    return null;
  }

  if (task.status === 'conflict') {
    return normalizeString(task.lastConflict?.code) || null;
  }

  if (task.status === 'failed' || task.status === 'retrying') {
    return normalizeString(task.lastFailure?.code) || null;
  }

  return null;
}

function resolveNotesWorkspaceSyncPrimaryEntityId(task: NotesWorkspaceSyncTaskLike | null) {
  if (!task) {
    return null;
  }

  return normalizeString(task.entityId) || null;
}

function resolveNotesWorkspaceSyncPrimaryMessage(task: NotesWorkspaceSyncTaskLike | null) {
  if (!task) {
    return null;
  }

  if (task.status === 'conflict') {
    return normalizeString(task.lastConflict?.message) || null;
  }

  if (task.status === 'failed' || task.status === 'retrying') {
    return normalizeString(task.lastFailure?.message) || null;
  }

  return null;
}

function resolveNotesWorkspaceSyncPrimaryPriority(task: NotesWorkspaceSyncTaskLike) {
  switch (task.status) {
    case 'conflict':
      return 0;
    case 'failed':
      return 1;
    case 'retrying':
      return 2;
    case 'queued':
    case 'running':
      return 3;
    default:
      return 4;
  }
}

function compareNotesWorkspaceSyncPrimaryTask(
  left: NotesWorkspaceSyncTaskLike,
  right: NotesWorkspaceSyncTaskLike,
) {
  const priorityDelta = resolveNotesWorkspaceSyncPrimaryPriority(left)
    - resolveNotesWorkspaceSyncPrimaryPriority(right);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  switch (left.status) {
    case 'retrying':
      return toTimestamp(left.nextRetryAt) - toTimestamp(right.nextRetryAt);
    case 'queued':
    case 'running':
      return toTimestamp(left.at) - toTimestamp(right.at);
    case 'failed':
      return toTimestamp(right.lastFailure?.occurredAt ?? right.at)
        - toTimestamp(left.lastFailure?.occurredAt ?? left.at);
    case 'conflict':
      return toTimestamp(right.lastConflict?.occurredAt ?? right.at)
        - toTimestamp(left.lastConflict?.occurredAt ?? left.at);
    default:
      return 0;
  }
}

function summarizeNotesWorkspaceSyncTasks(
  syncTasks: NotesWorkspaceSyncTaskLike[],
  locale: string,
  nowValue?: number,
): NotesWorkspaceSyncSummary {
  if (syncTasks.length === 0) {
    return createEmptyNotesWorkspaceSyncSummary();
  }

  const queuedCount = syncTasks.filter(
    (task) => task.status === 'queued' || task.status === 'running',
  ).length;
  const retryingCount = syncTasks.filter((task) => task.status === 'retrying').length;
  const failedCount = syncTasks.filter((task) => task.status === 'failed').length;
  const conflictCount = syncTasks.filter((task) => task.status === 'conflict').length;
  const completedCount = syncTasks.filter((task) => task.status === 'completed').length;
  const pendingCount = queuedCount + retryingCount;
  const blockingCount = failedCount + conflictCount;
  const primaryTask = syncTasks
    .filter((task) => task.status !== 'completed')
    .sort(compareNotesWorkspaceSyncPrimaryTask)[0] ?? null;
  const nextRetryTask = syncTasks
    .filter((task) => task.status === 'retrying')
    .sort((left, right) => toTimestamp(left.nextRetryAt) - toTimestamp(right.nextRetryAt))[0] ?? null;

  return {
    queueDepth: pendingCount + blockingCount,
    pendingCount,
    blockingCount,
    queuedCount,
    retryingCount,
    failedCount,
    conflictCount,
    completedCount,
    primaryStatus: resolveNotesWorkspaceSyncPrimaryStatus(primaryTask),
    primaryTaskId: primaryTask?.id ?? null,
    primaryEntityId: resolveNotesWorkspaceSyncPrimaryEntityId(primaryTask),
    primaryCode: resolveNotesWorkspaceSyncPrimaryCode(primaryTask),
    primaryMessage: resolveNotesWorkspaceSyncPrimaryMessage(primaryTask),
    nextRetryLabel: nextRetryTask?.nextRetryAt
      ? formatRelativeNoteTime(nextRetryTask.nextRetryAt, locale, nowValue)
      : '',
  };
}

export function buildFlatFolderTree(folders: NoteFolder[], expandedFolderIds: string[]) {
  const byParent = new Map<string | null, NoteFolder[]>();
  folders.forEach((folder) => {
    const parentId = folder.parentId ?? null;
    const existing = byParent.get(parentId) ?? [];
    existing.push(folder);
    byParent.set(parentId, existing);
  });

  for (const entry of byParent.values()) {
    entry.sort((left, right) => left.name.localeCompare(right.name));
  }

  const expandedSet = new Set(expandedFolderIds);
  const items: FlatFolderTreeItem[] = [];

  const walk = (parentId: string | null, depth: number) => {
    const children = byParent.get(parentId) ?? [];
    children.forEach((folder) => {
      const hasChildren = (byParent.get(folder.id)?.length ?? 0) > 0;
      const isExpanded = expandedSet.has(folder.id);

      items.push({
        folder,
        depth,
        hasChildren,
        isExpanded,
      });

      if (hasChildren && isExpanded) {
        walk(folder.id, depth + 1);
      }
    });
  };

  walk(null, 0);
  return items;
}

export function countNoteWords(note: Pick<Note, 'content'> | null | undefined) {
  const plain = toPlainText(note?.content);

  if (!plain) {
    return 0;
  }

  return plain.split(' ').filter(Boolean).length;
}

export function toPlainText(content: string | null | undefined) {
  if (!content) {
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

function createOutlineAnchor(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-');

  return normalized || 'section';
}

export function extractNoteOutline(note: Pick<Note, 'content'> | null | undefined) {
  const content = normalizeString(note?.content);
  if (!content) {
    return [] satisfies NoteOutlineItem[];
  }

  const matches = content.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi);
  const outline: NoteOutlineItem[] = [];

  for (const match of matches) {
    const level = Number(match[1]);
    const text = toPlainText(match[2]);
    if (!text || !Number.isFinite(level)) {
      continue;
    }

    outline.push({
      level,
      text,
      anchor: createOutlineAnchor(text),
    });
  }

  return outline;
}

export function getNoteTaskProgress(note: Pick<Note, 'content'> | null | undefined): NoteTaskProgress {
  const content = normalizeString(note?.content);
  if (!content) {
    return {
      total: 0,
      completed: 0,
      remaining: 0,
      ratio: 0,
    };
  }

  const total = Array.from(content.matchAll(/data-type="taskItem"/g)).length;
  const completed = Array.from(content.matchAll(/data-type="taskItem"[^>]*data-checked="true"/g)).length;
  const remaining = Math.max(0, total - completed);

  return {
    total,
    completed,
    remaining,
    ratio: total > 0 ? completed / total : 0,
  };
}

export function countNoteCharacters(note: Pick<Note, 'content'> | null | undefined) {
  return toPlainText(note?.content).length;
}

export function estimateReadingMinutes(
  note: Pick<Note, 'content'> | null | undefined,
  wordsPerMinute = 220,
) {
  const wordCount = countNoteWords(note);
  if (wordCount === 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function formatNoteDateTime(value: string | number | undefined, locale = 'en-US') {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export function formatRelativeNoteTime(
  value: string | number | undefined,
  locale = 'en-US',
  nowValue = Date.now(),
) {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return '';
  }

  const delta = timestamp - nowValue;
  const absoluteDelta = Math.abs(delta);
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
  });

  if (absoluteDelta < 60_000) {
    return formatter.format(Math.round(delta / 1_000), 'second');
  }

  if (absoluteDelta < 3_600_000) {
    return formatter.format(Math.round(delta / 60_000), 'minute');
  }

  if (absoluteDelta < 86_400_000) {
    return formatter.format(Math.round(delta / 3_600_000), 'hour');
  }

  if (absoluteDelta < 604_800_000) {
    return formatter.format(Math.round(delta / 86_400_000), 'day');
  }

  return formatNoteDateTime(value, locale);
}
