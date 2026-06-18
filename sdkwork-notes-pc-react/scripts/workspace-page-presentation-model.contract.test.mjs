import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function createDataModuleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

async function loadWorkspacePagePresentationModelModule() {
  const entryPoint = path.resolve(
    process.cwd(),
    'packages/sdkwork-notes-pc-notes/src/services/noteWorkspacePagePresentationModel.ts',
  );
  const source = await readFile(entryPoint, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: entryPoint,
  });

  return import(createDataModuleUrl(transpiled.outputText));
}

const workspacePagePresentationModelModule = await loadWorkspacePagePresentationModelModule();

function createTranslator() {
  return (key, values) => {
    if (values && Object.prototype.hasOwnProperty.call(values, 'value')) {
      return `${key}:${values.value}`;
    }
    return key;
  };
}

function createNote(id, title, overrides = {}) {
  return {
    id,
    uuid: `uuid-${id}`,
    title,
    type: 'doc',
    parentId: null,
    tags: [],
    isFavorite: false,
    snippet: `${title} summary`,
    content: '<p>Weekly sprint review</p>',
    publishStatus: 'draft',
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T12:00:00Z',
    ...overrides,
  };
}

test('workspace page presentation model centralizes shortcut hints, metric cards, and active note focus badges', () => {
  const t = createTranslator();

  const result = workspacePagePresentationModelModule.buildNotesWorkspacePagePresentationModel({
    t,
    activeView: 'recent',
    activeNote: createNote('note-1', 'Weekly sprint review', {
      type: 'article',
      publishStatus: 'archived',
      snippet: 'Sprint summary and checkpoints',
    }),
    saveState: 'saving',
    counts: {
      all: 12,
      favorites: 3,
      recent: 12,
      trash: 1,
    },
    activeTaskProgress: {
      total: 5,
      completed: 3,
      remaining: 2,
      ratio: 0.6,
    },
    activeOutline: [
      { level: 1, text: 'Overview', anchor: 'overview' },
      { level: 2, text: 'Actions', anchor: 'actions' },
    ],
    activeWordCount: 320,
    activeNoteFolderName: 'Projects',
    activeNoteUpdatedLabel: '2 hours ago',
    syncSummary: {
      queueDepth: 3,
      pendingCount: 2,
      blockingCount: 1,
      queuedCount: 1,
      retryingCount: 1,
      failedCount: 0,
      conflictCount: 1,
      completedCount: 0,
      primaryStatus: 'conflict',
      primaryTaskId: 'sync-conflict-1',
      primaryEntityId: 'note-1',
      primaryCode: 'stale-base-version',
      primaryMessage: 'Remote note changed before replay',
      nextRetryLabel: 'in 5 minutes',
    },
    platform: 'MacIntel',
  });

  assert.equal(result.modifierKey, 'Cmd');
  assert.deepEqual(
    result.shortcutHints.map((item) => item.keys),
    ['Cmd+K', 'Cmd+N', 'Cmd+Shift+F', 'Cmd+Enter', 'Cmd+Shift+S', 'Cmd+Shift+I'],
  );
  assert.deepEqual(
    result.metricCards.map((item) => ({
      id: item.id,
      iconKey: item.iconKey,
      value: item.value,
    })),
    [
      { id: 'all', iconKey: 'notebook', value: 12 },
      { id: 'favorites', iconKey: 'star', value: 3 },
      { id: 'recent', iconKey: 'clock', value: 12 },
      { id: 'trash', iconKey: 'trash', value: 1 },
    ],
  );
  assert.equal(result.focusCard.title, 'Weekly sprint review');
  assert.equal(result.focusCard.description, 'Sprint summary and checkpoints');
  assert.equal(result.focusCard.filterLabel, 'notes.workspace.activeFilter');
  assert.equal(result.focusCard.filterValue, 'notes.views.recent');
  assert.deepEqual(
    result.focusCard.badges.map((item) => ({
      id: item.id,
      label: item.label,
      className: item.className,
    })),
    [
      {
        id: 'type',
        label: 'notes.types.article',
        className: 'border border-[var(--line-soft)] bg-[var(--panel-muted)] text-[var(--text-secondary)]',
      },
      {
        id: 'publish-status',
        label: 'notes.publishStatus.archived',
        className: 'border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-200',
      },
      {
        id: 'save-state',
        label: 'notes.editor.status.saving',
        className: 'border border-[var(--line-soft)] bg-[var(--panel-muted)] text-[var(--text-secondary)]',
      },
      {
        id: 'updated-at',
        label: 'notes.editor.editedAt:2 hours ago',
        className: 'border border-[var(--line-soft)] bg-[var(--panel-muted)] text-[var(--text-secondary)]',
      },
    ],
  );
  assert.deepEqual(result.focusCard.details, [
    {
      id: 'selected-folder',
      label: 'notes.workspace.selectedFolder',
      value: 'Projects',
      iconKey: 'folder-tree',
    },
    {
      id: 'task-progress',
      label: 'notes.inspector.taskProgress',
      value: '3/5',
      iconKey: 'book-open-text',
    },
    {
      id: 'headings',
      label: 'notes.inspector.headings',
      value: '2',
      iconKey: null,
    },
    {
      id: 'word-count',
      label: 'notes.inspector.wordCount',
      value: '320',
      iconKey: null,
    },
  ]);
  assert.deepEqual(result.syncCard, {
    title: 'notes.sync.title',
    statusLabel: 'notes.sync.states.conflict',
    description: 'notes.sync.descriptions.conflict',
    badges: [
      {
        id: 'queued',
        label: 'notes.sync.badges.queued 1',
        className: 'border border-[var(--line-soft)] bg-[var(--panel-muted)] text-[var(--text-secondary)]',
      },
      {
        id: 'retrying',
        label: 'notes.sync.badges.retrying 1',
        className: 'border border-[var(--line-soft)] bg-[var(--panel-muted)] text-[var(--text-secondary)]',
      },
      {
        id: 'conflict',
        label: 'notes.sync.badges.conflict 1',
        className: 'border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-200',
      },
    ],
    details: [
      {
        id: 'pending',
        label: 'notes.sync.details.pending',
        value: '2',
      },
      {
        id: 'blocked',
        label: 'notes.sync.details.blocked',
        value: '1',
      },
      {
        id: 'latest-issue',
        label: 'notes.sync.details.latestIssue',
        value: 'Remote note changed before replay',
      },
      {
        id: 'next-retry',
        label: 'notes.sync.details.nextRetry',
        value: 'in 5 minutes',
      },
    ],
    actionLabel: 'notes.actions.reviewSyncIssue',
    actionKind: 'review-note',
    actionTargetNoteId: 'note-1',
  });
});

test('workspace page presentation model falls back to empty focus content and Ctrl shortcuts when no active note is selected', () => {
  const t = createTranslator();

  const result = workspacePagePresentationModelModule.buildNotesWorkspacePagePresentationModel({
    t,
    activeView: 'all',
    activeNote: null,
    saveState: 'idle',
    counts: {
      all: 2,
      favorites: 1,
      recent: 2,
      trash: 0,
    },
    activeTaskProgress: {
      total: 0,
      completed: 0,
      remaining: 0,
      ratio: 0,
    },
    activeOutline: [],
    activeWordCount: 0,
    activeNoteFolderName: null,
    activeNoteUpdatedLabel: '',
    syncSummary: {
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
    },
    platform: 'Win32',
  });

  assert.equal(result.modifierKey, 'Ctrl');
  assert.equal(result.focusCard.title, 'notes.workspace.focusEmptyTitle');
  assert.equal(result.focusCard.description, 'notes.workspace.focusEmptyDescription');
  assert.equal(result.focusCard.filterValue, 'notes.views.all');
  assert.deepEqual(result.focusCard.badges, []);
  assert.deepEqual(result.focusCard.details, []);
  assert.equal(result.syncCard.statusLabel, 'notes.sync.states.idle');
  assert.equal(result.syncCard.actionLabel, null);
  assert.equal(result.syncCard.actionKind, null);
  assert.equal(result.syncCard.actionTargetNoteId, null);
});

test('workspace page presentation model keeps retry drain as the primary action when the queue is pending without a blocking issue', () => {
  const t = createTranslator();

  const result = workspacePagePresentationModelModule.buildNotesWorkspacePagePresentationModel({
    t,
    activeView: 'all',
    activeNote: createNote('note-2', 'Queued note'),
    saveState: 'dirty',
    counts: {
      all: 4,
      favorites: 1,
      recent: 4,
      trash: 0,
    },
    activeTaskProgress: {
      total: 0,
      completed: 0,
      remaining: 0,
      ratio: 0,
    },
    activeOutline: [],
    activeWordCount: 120,
    activeNoteFolderName: null,
    activeNoteUpdatedLabel: 'just now',
    syncSummary: {
      queueDepth: 2,
      pendingCount: 2,
      blockingCount: 0,
      queuedCount: 1,
      retryingCount: 1,
      failedCount: 0,
      conflictCount: 0,
      completedCount: 0,
      primaryStatus: 'retrying',
      primaryTaskId: 'sync-retrying-2',
      primaryEntityId: 'note-2',
      primaryCode: 'network',
      primaryMessage: 'Temporary connectivity loss',
      nextRetryLabel: 'in 30 seconds',
    },
    platform: 'Win32',
  });

  assert.equal(result.syncCard.actionLabel, 'notes.actions.retrySync');
  assert.equal(result.syncCard.actionKind, 'retry-sync');
  assert.equal(result.syncCard.actionTargetNoteId, null);
});
