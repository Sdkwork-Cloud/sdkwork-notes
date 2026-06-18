// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { createEmptyNotesSyncQueueSnapshot } from '@sdkwork/notes-pc-sync';
import { NotesWorkspacePage } from './NotesWorkspacePage';

const { mockAppStore, mockWorkspaceStore } = vi.hoisted(() => ({
  mockAppStore: {
    state: {} as Record<string, unknown>,
  },
  mockWorkspaceStore: {
    state: {} as Record<string, unknown>,
  },
}));

vi.mock('@sdkwork/notes-pc-core', () => ({
  useAppStore: <T,>(selector: (state: Record<string, unknown>) => T) => selector(mockAppStore.state),
}));

vi.mock('@sdkwork/notes-pc-i18n', () => ({
  useNotesTranslation: () => ({
    i18n: {
      language: 'en-US',
    },
    t: (key: string, values?: Record<string, string>) => {
      const dictionary: Record<string, string> = {
        'notes.commandPalette.title': 'Quick switcher',
        'notes.commandPalette.description': 'Search documents, folders, and actions from one place.',
        'notes.commandPalette.placeholder': 'Type a command or search notes',
        'notes.actions.newArticle': 'New article',
        'notes.defaults.articleTitle': 'New article draft',
        'notes.workspace.title': 'Workspace',
      };

      const template = dictionary[key] ?? key;
      if (!values) {
        return template;
      }

      return Object.entries(values).reduce(
        (currentValue, [entryKey, entryValue]) => currentValue.replace(`{{${entryKey}}}`, entryValue),
        template,
      );
    },
  }),
}));

vi.mock('../components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components')>();

  return {
    ...actual,
    NoteEditorPane: () => <div data-testid="note-editor-pane" />,
    NoteInspectorPanel: () => <div data-testid="note-inspector-pane" />,
    NotesSidebar: () => <div data-testid="notes-sidebar" />,
  };
});

vi.mock('../store/useNotesWorkspaceStore', () => ({
  useNotesWorkspaceStore: <T,>(selector: (state: Record<string, unknown>) => T) => selector(mockWorkspaceStore.state),
}));

function primeStores() {
  const initialize = vi.fn(async () => {});
  const createNote = vi.fn(async () => 'note-created');
  const selectNote = vi.fn(async () => {});
  const setActiveView = vi.fn();
  const setSearchQuery = vi.fn();
  const setSelectedFolderId = vi.fn();

  mockAppStore.state = {
    sidebarCollapsed: false,
    toggleSidebar: vi.fn(),
    inspectorOpen: true,
    setInspectorOpen: vi.fn(),
  };

  mockWorkspaceStore.state = {
    isLoading: false,
    saveState: 'saved',
    errorMessage: null,
    notes: [
      {
        id: 'note-1',
        uuid: 'uuid-note-1',
        title: 'Launch brief',
        type: 'doc',
        parentId: null,
        tags: ['launch'],
        isFavorite: false,
        snippet: 'Launch plan',
        createdAt: '2026-03-30T00:00:00Z',
        updatedAt: '2026-03-30T12:00:00Z',
      },
    ],
    trashedNotes: [],
    folders: [],
    syncQueueSnapshot: createEmptyNotesSyncQueueSnapshot(),
    recoveredDrafts: [],
    activeRecoveredDraft: null,
    activeNoteId: 'note-1',
    activeNote: {
      id: 'note-1',
      uuid: 'uuid-note-1',
      title: 'Launch brief',
      type: 'doc',
      parentId: null,
      tags: ['launch'],
      isFavorite: false,
      snippet: 'Launch plan',
      content: '<p>Launch plan</p>',
      publishStatus: 'draft',
      createdAt: '2026-03-30T00:00:00Z',
      updatedAt: '2026-03-30T12:00:00Z',
    },
    activeView: 'all',
    searchQuery: '',
    selectedFolderId: null,
    sidebarWidth: 320,
    expandedFolderIds: [],
    initialize,
    captureActiveNoteExitRecovery: vi.fn(),
    createNote,
    createFolder: vi.fn(),
    renameFolder: vi.fn(),
    moveFolder: vi.fn(),
    deleteFolder: vi.fn(),
    selectNote,
    updateActiveNoteDraft: vi.fn(),
    restoreRecoveredDraft: vi.fn(async () => true),
    dismissRecoveredDraft: vi.fn(async () => true),
    persistActiveNote: vi.fn(async () => true),
    moveNote: vi.fn(async () => true),
    moveNoteToTrash: vi.fn(),
    restoreNoteFromTrash: vi.fn(),
    deleteNotePermanently: vi.fn(),
    clearTrash: vi.fn(),
    toggleFavorite: vi.fn(),
    requestSyncDrain: vi.fn(async () => undefined),
    setActiveView,
    setSearchQuery,
    setSelectedFolderId,
    setSidebarWidth: vi.fn(),
    toggleFolderExpanded: vi.fn(),
    clearError: vi.fn(),
  };

  return {
    createNote,
    initialize,
    selectNote,
    setActiveView,
    setSearchQuery,
    setSelectedFolderId,
  };
}

describe('NotesWorkspacePage command palette', () => {
  beforeEach(() => {
    primeStores();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('opens a quick switcher with Ctrl+K and executes quick-create actions', async () => {
    const { createNote } = primeStores();

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, {
      key: 'k',
      ctrlKey: true,
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Quick switcher')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a command or search notes')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: /New article/i }));

    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith(expect.objectContaining({
        type: 'article',
        title: 'New article draft',
        parentId: null,
      }));
    });
  });

  it('filters note results in the quick switcher and opens the selected note with Enter', async () => {
    const { selectNote } = primeStores();

    render(
      <MemoryRouter>
        <NotesWorkspacePage />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, {
      key: 'k',
      ctrlKey: true,
    });

    const input = screen.getByPlaceholderText('Type a command or search notes');

    fireEvent.change(input, {
      target: {
        value: 'launch brief',
      },
    });

    fireEvent.keyDown(input, {
      key: 'Enter',
    });

    await waitFor(() => {
      expect(selectNote).toHaveBeenCalledWith('note-1');
    });
  });
});
