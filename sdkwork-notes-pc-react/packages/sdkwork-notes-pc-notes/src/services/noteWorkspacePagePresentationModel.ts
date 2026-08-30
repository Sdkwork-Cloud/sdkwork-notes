import type { Note } from '@sdkwork/notes-pc-types-commons';
import type {
  NoteSaveState,
  NotesCollectionView,
} from '../types/notesWorkspace';
import type {
  NoteOutlineItem,
  NoteTaskProgress,
  NotesWorkspaceCounts,
  NotesWorkspaceSyncSummary,
} from './noteWorkspaceSelectors';

type Translate = (key: string, values?: Record<string, unknown>) => string;

const MUTED_CHIP_CLASS =
  'border border-[var(--line-soft)] bg-[var(--panel-muted)] text-[var(--text-secondary)]';
const ARCHIVED_CHIP_CLASS =
  'border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-200';
const FAILED_CHIP_CLASS =
  'border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200';

export type NoteWorkspacePagePresentationIconKey =
  | 'book-open-text'
  | 'clock'
  | 'folder-tree'
  | 'notebook'
  | 'star'
  | 'trash';

export interface NotesWorkspaceShortcutHint {
  id: string;
  keys: string;
  label: string;
}

export interface NotesWorkspaceMetricCardModel {
  id: 'all' | 'favorites' | 'recent' | 'trash';
  iconKey: NoteWorkspacePagePresentationIconKey;
  label: string;
  value: number;
}

export interface NotesWorkspaceFocusBadgeModel {
  id: 'type' | 'publish-status' | 'save-state' | 'updated-at';
  label: string;
  className: string;
}

export interface NotesWorkspaceFocusDetailModel {
  id: 'selected-folder' | 'task-progress' | 'headings' | 'word-count';
  label: string;
  value: string;
  iconKey: NoteWorkspacePagePresentationIconKey | null;
}

export interface NotesWorkspaceFocusCardModel {
  title: string;
  description: string;
  filterLabel: string;
  filterValue: string;
  badges: NotesWorkspaceFocusBadgeModel[];
  details: NotesWorkspaceFocusDetailModel[];
}

export interface NotesWorkspaceSyncBadgeModel {
  id: 'queued' | 'retrying' | 'failed' | 'conflict';
  label: string;
  className: string;
}

export interface NotesWorkspaceSyncDetailModel {
  id: 'pending' | 'blocked' | 'latest-issue' | 'next-retry';
  label: string;
  value: string;
}

export interface NotesWorkspaceSyncCardModel {
  title: string;
  statusLabel: string;
  description: string;
  badges: NotesWorkspaceSyncBadgeModel[];
  details: NotesWorkspaceSyncDetailModel[];
  actionLabel: string | null;
  actionKind: 'retry-sync' | 'review-note' | null;
  actionTargetNoteId: string | null;
}

export interface NotesWorkspacePagePresentationModel {
  modifierKey: 'Cmd' | 'Ctrl';
  shortcutHints: NotesWorkspaceShortcutHint[];
  metricCards: NotesWorkspaceMetricCardModel[];
  focusCard: NotesWorkspaceFocusCardModel;
  syncCard: NotesWorkspaceSyncCardModel;
}

export interface BuildNotesWorkspacePagePresentationModelOptions {
  t: Translate;
  activeView: NotesCollectionView;
  activeNote: Note | null;
  saveState: NoteSaveState;
  counts: NotesWorkspaceCounts;
  activeTaskProgress: NoteTaskProgress;
  activeOutline: NoteOutlineItem[];
  activeWordCount: number;
  activeNoteFolderName: string | null;
  activeNoteUpdatedLabel: string;
  syncSummary: NotesWorkspaceSyncSummary;
  platform?: string | null;
}

export function resolveNotesWorkspaceModifierKey(platform?: string | null): 'Cmd' | 'Ctrl' {
  const normalizedPlatform = typeof platform === 'string' ? platform : '';
  return /Mac|iPhone|iPad/i.test(normalizedPlatform) ? 'Cmd' : 'Ctrl';
}

export function resolveNotesWorkspacePublishStatusChipClass(
  status: Note['publishStatus'] | undefined,
) {
  return status === 'archived' ? ARCHIVED_CHIP_CLASS : MUTED_CHIP_CLASS;
}

function buildShortcutHints(t: Translate, modifierKey: 'Cmd' | 'Ctrl'): NotesWorkspaceShortcutHint[] {
  return [
    {
      id: 'command-palette',
      keys: `${modifierKey}+K`,
      label: t('notes.shortcuts.commandPalette'),
    },
    {
      id: 'new-doc',
      keys: `${modifierKey}+N`,
      label: t('notes.shortcuts.newDoc'),
    },
    {
      id: 'focus-search',
      keys: `${modifierKey}+Shift+F`,
      label: t('notes.shortcuts.focusSearch'),
    },
    {
      id: 'save',
      keys: `${modifierKey}+Enter`,
      label: t('notes.shortcuts.save'),
    },
    {
      id: 'toggle-sidebar',
      keys: `${modifierKey}+Shift+S`,
      label: t('notes.shortcuts.toggleSidebar'),
    },
    {
      id: 'toggle-inspector',
      keys: `${modifierKey}+Shift+I`,
      label: t('notes.shortcuts.toggleInspector'),
    },
  ];
}

function buildMetricCards(
  t: Translate,
  counts: NotesWorkspaceCounts,
): NotesWorkspaceMetricCardModel[] {
  return [
    {
      id: 'all',
      iconKey: 'notebook',
      label: t('notes.views.all'),
      value: counts.all,
    },
    {
      id: 'favorites',
      iconKey: 'star',
      label: t('notes.views.favorites'),
      value: counts.favorites,
    },
    {
      id: 'recent',
      iconKey: 'clock',
      label: t('notes.views.recent'),
      value: counts.recent,
    },
    {
      id: 'trash',
      iconKey: 'trash',
      label: t('notes.views.trash'),
      value: counts.trash,
    },
  ];
}

function buildFocusCard(
  options: Omit<BuildNotesWorkspacePagePresentationModelOptions, 'platform'>,
): NotesWorkspaceFocusCardModel {
  const {
    t,
    activeView,
    activeNote,
    saveState,
    activeTaskProgress,
    activeOutline,
    activeWordCount,
    activeNoteFolderName,
    activeNoteUpdatedLabel,
  } = options;

  const activeViewLabel = t(`notes.views.${activeView}`);

  if (!activeNote) {
    return {
      title: t('notes.workspace.focusEmptyTitle'),
      description: t('notes.workspace.focusEmptyDescription'),
      filterLabel: t('notes.workspace.activeFilter'),
      filterValue: activeViewLabel,
      badges: [],
      details: [],
    };
  }

  const badges: NotesWorkspaceFocusBadgeModel[] = [
    {
      id: 'type',
      label: t(`notes.types.${activeNote.type}`),
      className: MUTED_CHIP_CLASS,
    },
    {
      id: 'publish-status',
      label: t(`notes.publishStatus.${activeNote.publishStatus ?? 'draft'}`),
      className: resolveNotesWorkspacePublishStatusChipClass(activeNote.publishStatus),
    },
    {
      id: 'save-state',
      label: t(`notes.editor.status.${saveState}`),
      className: MUTED_CHIP_CLASS,
    },
  ];

  if (activeNoteUpdatedLabel) {
    badges.push({
      id: 'updated-at',
      label: t('notes.editor.editedAt', { value: activeNoteUpdatedLabel }),
      className: MUTED_CHIP_CLASS,
    });
  }

  return {
    title: activeNote.title,
    description: activeNote.snippet || t('notes.workspace.focusDescription'),
    filterLabel: t('notes.workspace.activeFilter'),
    filterValue: activeViewLabel,
    badges,
    details: [
      {
        id: 'selected-folder',
        label: t('notes.workspace.selectedFolder'),
        value: activeNoteFolderName || t('notes.inspector.rootFolder'),
        iconKey: 'folder-tree',
      },
      {
        id: 'task-progress',
        label: t('notes.inspector.taskProgress'),
        value: `${activeTaskProgress.completed}/${activeTaskProgress.total}`,
        iconKey: 'book-open-text',
      },
      {
        id: 'headings',
        label: t('notes.inspector.headings'),
        value: String(activeOutline.length),
        iconKey: null,
      },
      {
        id: 'word-count',
        label: t('notes.inspector.wordCount'),
        value: String(activeWordCount),
        iconKey: null,
      },
    ],
  };
}

function resolveNotesWorkspaceSyncStateKey(
  status: NotesWorkspaceSyncSummary['primaryStatus'],
) {
  switch (status) {
    case 'queued':
      return 'queued';
    case 'retrying':
      return 'retrying';
    case 'failed':
      return 'failed';
    case 'conflict':
      return 'conflict';
    default:
      return 'idle';
  }
}

function resolveNotesWorkspaceSyncBadgeClass(
  id: NotesWorkspaceSyncBadgeModel['id'],
) {
  switch (id) {
    case 'conflict':
      return ARCHIVED_CHIP_CLASS;
    case 'failed':
      return FAILED_CHIP_CLASS;
    default:
      return MUTED_CHIP_CLASS;
  }
}

function buildSyncBadges(
  t: Translate,
  syncSummary: NotesWorkspaceSyncSummary,
): NotesWorkspaceSyncBadgeModel[] {
  const badges: NotesWorkspaceSyncBadgeModel[] = [];

  if (syncSummary.queuedCount > 0) {
    badges.push({
      id: 'queued',
      label: `${t('notes.sync.badges.queued')} ${syncSummary.queuedCount}`,
      className: resolveNotesWorkspaceSyncBadgeClass('queued'),
    });
  }

  if (syncSummary.retryingCount > 0) {
    badges.push({
      id: 'retrying',
      label: `${t('notes.sync.badges.retrying')} ${syncSummary.retryingCount}`,
      className: resolveNotesWorkspaceSyncBadgeClass('retrying'),
    });
  }

  if (syncSummary.failedCount > 0) {
    badges.push({
      id: 'failed',
      label: `${t('notes.sync.badges.failed')} ${syncSummary.failedCount}`,
      className: resolveNotesWorkspaceSyncBadgeClass('failed'),
    });
  }

  if (syncSummary.conflictCount > 0) {
    badges.push({
      id: 'conflict',
      label: `${t('notes.sync.badges.conflict')} ${syncSummary.conflictCount}`,
      className: resolveNotesWorkspaceSyncBadgeClass('conflict'),
    });
  }

  return badges;
}

function buildSyncDetails(
  t: Translate,
  syncSummary: NotesWorkspaceSyncSummary,
): NotesWorkspaceSyncDetailModel[] {
  const details: NotesWorkspaceSyncDetailModel[] = [
    {
      id: 'pending',
      label: t('notes.sync.details.pending'),
      value: String(syncSummary.pendingCount),
    },
    {
      id: 'blocked',
      label: t('notes.sync.details.blocked'),
      value: String(syncSummary.blockingCount),
    },
  ];

  if (syncSummary.primaryCode) {
    details.push({
      id: 'latest-issue',
      label: t('notes.sync.details.latestIssue'),
      value: syncSummary.primaryMessage || syncSummary.primaryCode,
    });
  }

  if (syncSummary.nextRetryLabel) {
    details.push({
      id: 'next-retry',
      label: t('notes.sync.details.nextRetry'),
      value: syncSummary.nextRetryLabel,
    });
  }

  return details;
}

function buildSyncCard(
  t: Translate,
  syncSummary: NotesWorkspaceSyncSummary,
): NotesWorkspaceSyncCardModel {
  const stateKey = resolveNotesWorkspaceSyncStateKey(syncSummary.primaryStatus);
  const shouldReviewBlockingIssue = (
    (syncSummary.primaryStatus === 'failed' || syncSummary.primaryStatus === 'conflict')
    && Boolean(syncSummary.primaryEntityId)
  );
  const shouldRetryPendingQueue = !shouldReviewBlockingIssue && syncSummary.pendingCount > 0;

  return {
    title: t('notes.sync.title'),
    statusLabel: t(`notes.sync.states.${stateKey}`),
    description: t(`notes.sync.descriptions.${stateKey}`),
    badges: buildSyncBadges(t, syncSummary),
    details: buildSyncDetails(t, syncSummary),
    actionLabel: shouldReviewBlockingIssue
      ? t('notes.actions.reviewSyncIssue')
      : shouldRetryPendingQueue
        ? t('notes.actions.retrySync')
        : null,
    actionKind: shouldReviewBlockingIssue
      ? 'review-note'
      : shouldRetryPendingQueue
        ? 'retry-sync'
        : null,
    actionTargetNoteId: shouldReviewBlockingIssue ? syncSummary.primaryEntityId : null,
  };
}

export function buildNotesWorkspacePagePresentationModel(
  options: BuildNotesWorkspacePagePresentationModelOptions,
): NotesWorkspacePagePresentationModel {
  const modifierKey = resolveNotesWorkspaceModifierKey(options.platform);

  return {
    modifierKey,
    shortcutHints: buildShortcutHints(options.t, modifierKey),
    metricCards: buildMetricCards(options.t, options.counts),
    focusCard: buildFocusCard(options),
    syncCard: buildSyncCard(options.t, options.syncSummary),
  };
}
