import type { Note, NoteFolder, NoteSummary } from '@sdkwork/notes-types';
import type { NotesCollectionView } from '../types/notesWorkspace';

export interface FlatFolderTreeItem {
  folder: NoteFolder;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
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

function matchesQuery(note: NoteSummary, query: string) {
  const normalizedQuery = normalizeString(query).toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    note.title,
    note.snippet,
    ...(note.tags || []),
  ]
    .map((value) => normalizeString(value).toLowerCase())
    .some((value) => value.includes(normalizedQuery));
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

  const parentMap = buildParentMap(folders);
  const matchesCurrentFilters = (note: NoteSummary) =>
    isWithinFolderScope(parentMap, note.parentId, selectedFolderId)
    && matchesQuery(note, searchQuery);

  if (activeView === 'trash') {
    return trashedNotes.filter(matchesCurrentFilters);
  }

  if (activeView === 'favorites') {
    return notes.filter((note) => note.isFavorite).filter(matchesCurrentFilters);
  }

  if (activeView === 'recent') {
    return [...notes]
      .filter(matchesCurrentFilters)
      .sort((left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt))
      .slice(0, 12);
  }

  return notes.filter(matchesCurrentFilters);
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
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
