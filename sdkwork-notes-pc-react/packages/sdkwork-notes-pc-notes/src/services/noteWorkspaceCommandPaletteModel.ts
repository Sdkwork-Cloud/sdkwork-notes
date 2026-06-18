import type { Note, NoteFolder, NoteSummary } from '@sdkwork/notes-pc-types';
import { buildNotesSearchDocuments, searchNotesSearchDocuments } from '@sdkwork/notes-pc-search';
import type { NotesCollectionView } from '../types/notesWorkspace';
import type { CommandPaletteSearchItem } from './noteCommandPalette';

export type NoteWorkspaceCommandPaletteIconKey =
  | 'account'
  | 'clock'
  | 'columns'
  | 'file-code'
  | 'file-text'
  | 'folder-tree'
  | 'newspaper'
  | 'notebook'
  | 'panel-left-close'
  | 'panel-left-open'
  | 'search'
  | 'star'
  | 'trash';

export type NoteWorkspaceCommandPaletteAction =
  | { type: 'create-note'; noteType: Note['type'] }
  | { type: 'toggle-sidebar' }
  | { type: 'toggle-inspector' }
  | { type: 'focus-search' }
  | { type: 'clear-search' }
  | { type: 'navigate-account' }
  | { type: 'change-view'; view: NotesCollectionView }
  | { type: 'open-folder'; folderId: string | null }
  | { type: 'open-note'; noteId: string; isTrashed: boolean; folderId: string | null };

export interface NoteWorkspaceCommandPaletteItem extends CommandPaletteSearchItem {
  badge?: string;
  iconKey: NoteWorkspaceCommandPaletteIconKey;
  action: NoteWorkspaceCommandPaletteAction;
}

type Translate = (key: string, values?: Record<string, unknown>) => string;

function normalizeString(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function normalizeSearchTokens(value: string) {
  return normalizeString(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function uniqueKeywords(values: Array<string | null | undefined>) {
  const keywords: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    const normalized = normalizeString(value);
    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    keywords.push(normalized);
  });

  return keywords;
}

function buildFolderIndex(folders: NoteFolder[]) {
  const index = new Map<string, NoteFolder>();
  folders.forEach((folder) => {
    index.set(folder.id, folder);
  });
  return index;
}

function resolveFolderPath(folderIndex: Map<string, NoteFolder>, folderId: string | null) {
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
    cursor = folder.parentId ?? null;
  }

  return path;
}

function scoreKeywordMatch(value: string, token: string, weight: number) {
  if (!value) {
    return 0;
  }

  if (value === token) {
    return weight * 5;
  }
  if (value.startsWith(token)) {
    return weight * 3;
  }
  if (value.includes(token)) {
    return weight;
  }
  return 0;
}

function getFolderSearchScore(folder: NoteFolder, folderIndex: Map<string, NoteFolder>, searchQuery: string) {
  const tokens = normalizeSearchTokens(searchQuery);
  if (tokens.length === 0) {
    return 0;
  }

  const searchFields = uniqueKeywords([
    folder.name,
    ...resolveFolderPath(folderIndex, folder.id),
  ]).map((value) => value.toLowerCase());

  let score = 0;
  for (const token of tokens) {
    const tokenScore = searchFields.reduce(
      (maxScore, field) => Math.max(maxScore, scoreKeywordMatch(field, token, 80)),
      0,
    );
    if (tokenScore === 0) {
      return null;
    }
    score += tokenScore;
  }

  return score;
}

function resolveNoteIconKey(note: Pick<NoteSummary, 'type'>): NoteWorkspaceCommandPaletteIconKey {
  if (note.type === 'code') {
    return 'file-code';
  }
  if (note.type === 'article') {
    return 'newspaper';
  }
  return 'file-text';
}

export function buildNoteWorkspaceCommandPaletteItems(options: {
  t: Translate;
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
  searchQuery: string;
  sidebarCollapsed: boolean;
  inspectorOpen: boolean;
}): NoteWorkspaceCommandPaletteItem[] {
  const {
    t,
    notes,
    trashedNotes,
    folders,
    searchQuery,
    sidebarCollapsed,
    inspectorOpen,
  } = options;
  const normalizedSearchQuery = normalizeString(searchQuery);
  const folderIndex = buildFolderIndex(folders);
  const noteIndex = new Map(
    [...notes, ...trashedNotes].map((note) => [note.id, note] satisfies [string, NoteSummary]),
  );
  const searchDocuments = buildNotesSearchDocuments({
    workspaceSnapshot: {
      notes,
      trashedNotes,
      folders,
    },
  });
  const documentByNoteId = new Map(
    searchDocuments.map((document) => [document.noteId, document] as const),
  );
  const searchedNotes = normalizedSearchQuery
    ? searchNotesSearchDocuments(
      searchDocuments,
      {
        text: normalizedSearchQuery,
        includeTrashed: true,
        limit: Math.max(searchDocuments.length, 20),
      },
      {
        source: 'command-palette',
      },
    )
    : [];
  const noteItems = normalizedSearchQuery
    ? searchedNotes
      .map((result) => {
        const note = noteIndex.get(result.document.noteId);
        if (!note) {
          return null;
        }

        return {
          note,
          document: result.document,
          priorityBoost: result.score,
        };
      })
      .filter((entry): entry is {
        note: NoteSummary;
        document: typeof searchDocuments[number];
        priorityBoost: number;
      } => entry !== null)
    : [...notes, ...trashedNotes]
      .map((note) => {
        const document = documentByNoteId.get(note.id);
        if (!document) {
          return null;
        }

        return {
          note,
          document,
          priorityBoost: 0,
        };
      })
      .filter((entry): entry is {
        note: NoteSummary;
        document: typeof searchDocuments[number];
        priorityBoost: number;
      } => entry !== null);
  const matchedFolderIds = new Set(
    searchedNotes
      .map((result) => result.document.folder.id)
      .filter((folderId): folderId is string => Boolean(folderId)),
  );
  const folderItems = folders.filter((folder) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    if (matchedFolderIds.has(folder.id)) {
      return true;
    }

    return getFolderSearchScore(folder, folderIndex, normalizedSearchQuery) !== null;
  });

  return [
    {
      id: 'action:new-doc',
      section: 'actions',
      priority: 1_200,
      title: t('notes.actions.newDoc'),
      subtitle: t('notes.commandPalette.actionDescriptions.newDoc'),
      keywords: ['doc', 'document', 'new'],
      iconKey: 'notebook',
      action: {
        type: 'create-note',
        noteType: 'doc',
      },
    },
    {
      id: 'action:new-article',
      section: 'actions',
      priority: 1_180,
      title: t('notes.actions.newArticle'),
      subtitle: t('notes.commandPalette.actionDescriptions.newArticle'),
      keywords: ['article', 'writing', 'draft', 'new'],
      iconKey: 'newspaper',
      action: {
        type: 'create-note',
        noteType: 'article',
      },
    },
    {
      id: 'action:new-code',
      section: 'actions',
      priority: 1_160,
      title: t('notes.actions.newCode'),
      subtitle: t('notes.commandPalette.actionDescriptions.newCode'),
      keywords: ['code', 'snippet', 'developer', 'new'],
      iconKey: 'file-code',
      action: {
        type: 'create-note',
        noteType: 'code',
      },
    },
    {
      id: 'action:toggle-sidebar',
      section: 'actions',
      priority: 1_120,
      title: sidebarCollapsed ? t('notes.actions.showSidebar') : t('notes.actions.hideSidebar'),
      subtitle: t('notes.commandPalette.actionDescriptions.toggleSidebar'),
      keywords: ['sidebar', 'library', 'toggle', 'panel'],
      iconKey: sidebarCollapsed ? 'panel-left-open' : 'panel-left-close',
      action: {
        type: 'toggle-sidebar',
      },
    },
    {
      id: 'action:toggle-inspector',
      section: 'actions',
      priority: 1_100,
      title: inspectorOpen ? t('notes.actions.hideInspector') : t('notes.actions.showInspector'),
      subtitle: t('notes.commandPalette.actionDescriptions.toggleInspector'),
      keywords: ['inspector', 'properties', 'toggle', 'panel'],
      iconKey: 'columns',
      action: {
        type: 'toggle-inspector',
      },
    },
    {
      id: 'action:focus-search',
      section: 'actions',
      priority: 1_080,
      title: t('notes.commandPalette.actions.focusSearch'),
      subtitle: t('notes.commandPalette.actionDescriptions.focusSearch'),
      keywords: ['search', 'filter', 'library'],
      iconKey: 'search',
      action: {
        type: 'focus-search',
      },
    },
    {
      id: 'action:clear-search',
      section: 'actions',
      priority: normalizedSearchQuery ? 1_060 : 840,
      title: t('notes.commandPalette.actions.clearSearch'),
      subtitle: t('notes.commandPalette.actionDescriptions.clearSearch'),
      keywords: ['clear', 'reset', 'search', 'filter'],
      iconKey: 'search',
      action: {
        type: 'clear-search',
      },
    },
    {
      id: 'action:account',
      section: 'actions',
      priority: 980,
      title: t('notes.actions.account'),
      subtitle: t('shell.layout.accountHint'),
      keywords: ['account', 'profile', 'settings'],
      iconKey: 'account',
      action: {
        type: 'navigate-account',
      },
    },
    {
      id: 'view:all',
      section: 'views',
      priority: 920,
      title: t('notes.views.all'),
      subtitle: t('notes.commandPalette.actionDescriptions.viewAll'),
      keywords: ['all', 'notes', 'workspace'],
      iconKey: 'notebook',
      action: {
        type: 'change-view',
        view: 'all',
      },
    },
    {
      id: 'view:favorites',
      section: 'views',
      priority: 900,
      title: t('notes.views.favorites'),
      subtitle: t('notes.commandPalette.actionDescriptions.viewFavorites'),
      keywords: ['favorites', 'starred'],
      iconKey: 'star',
      action: {
        type: 'change-view',
        view: 'favorites',
      },
    },
    {
      id: 'view:recent',
      section: 'views',
      priority: 880,
      title: t('notes.views.recent'),
      subtitle: t('notes.commandPalette.actionDescriptions.viewRecent'),
      keywords: ['recent', 'latest'],
      iconKey: 'clock',
      action: {
        type: 'change-view',
        view: 'recent',
      },
    },
    {
      id: 'view:trash',
      section: 'views',
      priority: 860,
      title: t('notes.views.trash'),
      subtitle: t('notes.commandPalette.actionDescriptions.viewTrash'),
      keywords: ['trash', 'deleted', 'archive'],
      iconKey: 'trash',
      action: {
        type: 'change-view',
        view: 'trash',
      },
    },
    ...folderItems.map((folder) => ({
      id: `folder:${folder.id}`,
      section: 'folders',
      priority: 760 + (normalizedSearchQuery
        ? getFolderSearchScore(folder, folderIndex, normalizedSearchQuery) ?? 0
        : 0),
      title: folder.name,
      subtitle: t('notes.commandPalette.folderDescription'),
      keywords: uniqueKeywords(['folder', folder.name, ...resolveFolderPath(folderIndex, folder.id)]),
      iconKey: 'folder-tree' as const,
      updatedAt: folder.updatedAt,
      action: {
        type: 'open-folder' as const,
        folderId: folder.id,
      },
    })),
    ...noteItems.map(({ note, document, priorityBoost }) => ({
      id: `note:${note.id}`,
      section: 'notes',
      priority: (document.isTrashed ? 620 : 700) + priorityBoost,
      title: document.title,
      subtitle: document.snippet || t('notes.editor.emptyPreview'),
      keywords: uniqueKeywords([
        ...document.tags,
        t(`notes.types.${document.type}`),
        note.publishStatus ?? '',
        document.folder.name,
        ...document.folder.path,
      ]),
      badge: document.isTrashed ? t('notes.views.trash') : t(`notes.types.${document.type}`),
      iconKey: resolveNoteIconKey(note),
      updatedAt: note.updatedAt,
      action: {
        type: 'open-note' as const,
        noteId: note.id,
        isTrashed: document.isTrashed,
        folderId: document.folder.id,
      },
    })),
  ];
}
