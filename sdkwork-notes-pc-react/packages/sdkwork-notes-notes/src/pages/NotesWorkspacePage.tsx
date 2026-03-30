import { startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Columns3Cog, PanelLeftClose, PanelLeftOpen, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Dialog } from '@sdkwork/notes-commons';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import { useAppStore } from '@sdkwork/notes-core';
import type { Note } from '@sdkwork/notes-types';
import { getVisibleNotes } from '../services';
import { NoteEditorPane, NoteInspectorPanel, NotesSidebar } from '../components';
import { useNotesWorkspaceStore } from '../store/useNotesWorkspaceStore';

function clampSidebarWidth(value: number) {
  return Math.max(220, Math.min(420, value));
}

export function NotesWorkspacePage() {
  const { t } = useNotesTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [pendingDialog, setPendingDialog] = useState<
    | { kind: 'clearTrash' }
    | { kind: 'deleteNote'; noteId: string }
    | { kind: 'deleteFolder'; folderId: string }
    | null
  >(null);
  const isLoading = useNotesWorkspaceStore((state) => state.isLoading);
  const saveState = useNotesWorkspaceStore((state) => state.saveState);
  const errorMessage = useNotesWorkspaceStore((state) => state.errorMessage);
  const notes = useNotesWorkspaceStore((state) => state.notes);
  const trashedNotes = useNotesWorkspaceStore((state) => state.trashedNotes);
  const folders = useNotesWorkspaceStore((state) => state.folders);
  const activeNoteId = useNotesWorkspaceStore((state) => state.activeNoteId);
  const activeNote = useNotesWorkspaceStore((state) => state.activeNote);
  const activeView = useNotesWorkspaceStore((state) => state.activeView);
  const searchQuery = useNotesWorkspaceStore((state) => state.searchQuery);
  const selectedFolderId = useNotesWorkspaceStore((state) => state.selectedFolderId);
  const sidebarWidth = useNotesWorkspaceStore((state) => state.sidebarWidth);
  const expandedFolderIds = useNotesWorkspaceStore((state) => state.expandedFolderIds);
  const initialize = useNotesWorkspaceStore((state) => state.initialize);
  const createNote = useNotesWorkspaceStore((state) => state.createNote);
  const createFolder = useNotesWorkspaceStore((state) => state.createFolder);
  const renameFolder = useNotesWorkspaceStore((state) => state.renameFolder);
  const deleteFolder = useNotesWorkspaceStore((state) => state.deleteFolder);
  const selectNote = useNotesWorkspaceStore((state) => state.selectNote);
  const updateActiveNoteDraft = useNotesWorkspaceStore((state) => state.updateActiveNoteDraft);
  const persistActiveNote = useNotesWorkspaceStore((state) => state.persistActiveNote);
  const moveNoteToTrash = useNotesWorkspaceStore((state) => state.moveNoteToTrash);
  const restoreNoteFromTrash = useNotesWorkspaceStore((state) => state.restoreNoteFromTrash);
  const deleteNotePermanently = useNotesWorkspaceStore((state) => state.deleteNotePermanently);
  const clearTrash = useNotesWorkspaceStore((state) => state.clearTrash);
  const toggleFavorite = useNotesWorkspaceStore((state) => state.toggleFavorite);
  const setActiveView = useNotesWorkspaceStore((state) => state.setActiveView);
  const setSearchQuery = useNotesWorkspaceStore((state) => state.setSearchQuery);
  const setSelectedFolderId = useNotesWorkspaceStore((state) => state.setSelectedFolderId);
  const setSidebarWidth = useNotesWorkspaceStore((state) => state.setSidebarWidth);
  const toggleFolderExpanded = useNotesWorkspaceStore((state) => state.toggleFolderExpanded);
  const clearError = useNotesWorkspaceStore((state) => state.clearError);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const inspectorOpen = useAppStore((state) => state.inspectorOpen);
  const setInspectorOpen = useAppStore((state) => state.setInspectorOpen);
  const modifierKey = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd' : 'Ctrl';

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const visibleNotes = useMemo(
    () => getVisibleNotes({
      notes,
      trashedNotes,
      folders,
      activeView,
      searchQuery,
      selectedFolderId,
    }),
    [activeView, folders, notes, searchQuery, selectedFolderId, trashedNotes],
  );

  const counts = useMemo(() => ({
    all: notes.length,
    favorites: notes.filter((note) => note.isFavorite).length,
    recent: Math.min(notes.length, 12),
    trash: trashedNotes.length,
  }), [notes, trashedNotes.length]);

  const deferredDraftKey = useDeferredValue(
    activeNote
      ? [
          activeNote.id,
          activeNote.title,
          activeNote.content,
          activeNote.parentId ?? '',
          activeNote.type,
          activeNote.tags.join(','),
          activeNote.isFavorite ? '1' : '0',
        ].join('::')
      : '',
  );

  const flushDraft = useEffectEvent(() => {
    if (!activeNote || activeNote.deletedAt || saveState !== 'dirty') {
      return;
    }
    void persistActiveNote();
  });

  useEffect(() => {
    if (!activeNote || activeNote.deletedAt || saveState !== 'dirty') {
      return;
    }

    const timer = window.setTimeout(() => {
      flushDraft();
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeNote?.deletedAt, activeNote?.id, deferredDraftKey, flushDraft, saveState]);

  useEffect(() => {
    const handlePageHide = () => {
      flushDraft();
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [flushDraft]);

  const handleWorkspaceHotkey = useEffectEvent((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const hasModifier = event.metaKey || event.ctrlKey;

    if (hasModifier && !event.altKey && !event.shiftKey && key === 'n') {
      event.preventDefault();
      void handleCreateNote('doc');
      return;
    }

    if (hasModifier && !event.altKey && !event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      flushDraft();
      return;
    }

    if (hasModifier && event.shiftKey && !event.altKey && key === 'f') {
      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
      return;
    }

    if (hasModifier && event.shiftKey && !event.altKey && key === 's') {
      event.preventDefault();
      toggleSidebar();
      return;
    }

    if (hasModifier && event.shiftKey && !event.altKey && key === 'i') {
      event.preventDefault();
      setInspectorOpen(!inspectorOpen);
      return;
    }

    if (event.key === 'Escape' && document.activeElement === searchInputRef.current) {
      event.preventDefault();
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  });

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      handleWorkspaceHotkey(event);
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [handleWorkspaceHotkey]);

  const handleCreateNote = async (type: Note['type']) => {
    const createdId = await createNote({
      type,
      title:
        type === 'article'
          ? t('notes.defaults.articleTitle')
          : type === 'code'
            ? t('notes.defaults.codeTitle')
            : t('notes.defaults.docTitle'),
      parentId: selectedFolderId,
    });

    if (!createdId) {
      return;
    }

    startTransition(() => {
      setActiveView('all');
    });
  };

  const handleClearTrash = () => {
    setPendingDialog({ kind: 'clearTrash' });
  };

  const handleRestoreNote = async (id: string) => {
    const restored = await restoreNoteFromTrash(id);
    if (!restored) {
      return;
    }

    startTransition(() => {
      setActiveView('all');
    });
    await selectNote(id);
  };

  const handleDeletePermanently = (id: string) => {
    setPendingDialog({ kind: 'deleteNote', noteId: id });
  };

  const handleDeleteFolder = (id: string) => {
    setPendingDialog({ kind: 'deleteFolder', folderId: id });
  };

  const dialogNote = pendingDialog?.kind === 'deleteNote'
    ? [...notes, ...trashedNotes].find((note) => note.id === pendingDialog.noteId) ?? null
    : null;
  const dialogFolder = pendingDialog?.kind === 'deleteFolder'
    ? folders.find((folder) => folder.id === pendingDialog.folderId) ?? null
    : null;
  const dialogTitle =
    pendingDialog?.kind === 'clearTrash'
      ? t('notes.dialogs.clearTrash.title')
      : pendingDialog?.kind === 'deleteNote'
        ? t('notes.dialogs.deleteNote.title')
        : pendingDialog?.kind === 'deleteFolder'
          ? t('notes.dialogs.deleteFolder.title')
          : '';
  const dialogDescription =
    pendingDialog?.kind === 'clearTrash'
      ? t('notes.dialogs.clearTrash.description')
      : pendingDialog?.kind === 'deleteNote'
        ? t('notes.dialogs.deleteNote.description', {
            title: dialogNote?.title || t('notes.defaults.docTitle'),
          })
        : pendingDialog?.kind === 'deleteFolder'
          ? t('notes.dialogs.deleteFolder.description', {
              name: dialogFolder?.name || t('notes.defaults.folderTitle'),
            })
          : '';

  const confirmPendingDialog = async () => {
    const dialog = pendingDialog;
    setPendingDialog(null);

    if (!dialog) {
      return;
    }

    if (dialog.kind === 'clearTrash') {
      await clearTrash();
      return;
    }

    if (dialog.kind === 'deleteNote') {
      await deleteNotePermanently(dialog.noteId);
      return;
    }

    await deleteFolder(dialog.folderId);
  };

  const handleSidebarResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = clampSidebarWidth(startWidth + (moveEvent.clientX - startX));
      setSidebarWidth(nextWidth);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-4 lg:px-6">
        <section className="rounded-[32px] border border-[var(--line-soft)] bg-[var(--panel-bg)] px-6 py-5 shadow-[var(--shadow-md)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                {t('notes.workspace.badge')}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
                  {t('notes.workspace.title')}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
                  {t('notes.workspace.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => handleCreateNote('doc')}>
                {t('notes.actions.newDoc')}
              </Button>
              <Button onClick={() => handleCreateNote('article')}>
                {t('notes.actions.newArticle')}
              </Button>
              <Button onClick={() => handleCreateNote('code')}>
                {t('notes.actions.newCode')}
              </Button>
              <Button onClick={() => setInspectorOpen(!inspectorOpen)}>
                <Columns3Cog className="h-4 w-4" />
                {inspectorOpen ? t('notes.actions.hideInspector') : t('notes.actions.showInspector')}
              </Button>
              <Button onClick={() => toggleSidebar()}>
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                {sidebarCollapsed ? t('notes.actions.showSidebar') : t('notes.actions.hideSidebar')}
              </Button>
              <Link
                to="/account"
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--panel-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--panel-muted)]"
              >
                <UserCircle2 className="h-4 w-4" />
                {t('notes.actions.account')}
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{t('notes.shortcuts.label')}</span>
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1">
              {modifierKey}+N
            </span>
            <span>{t('notes.shortcuts.newDoc')}</span>
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1">
              {modifierKey}+Shift+F
            </span>
            <span>{t('notes.shortcuts.focusSearch')}</span>
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1">
              {modifierKey}+Enter
            </span>
            <span>{t('notes.shortcuts.save')}</span>
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1">
              {modifierKey}+Shift+S
            </span>
            <span>{t('notes.shortcuts.toggleSidebar')}</span>
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1">
              {modifierKey}+Shift+I
            </span>
            <span>{t('notes.shortcuts.toggleInspector')}</span>
          </div>

          {errorMessage ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{errorMessage}</span>
              <Button appearance="ghost" onClick={clearError}>
                {t('notes.actions.dismissError')}
              </Button>
            </div>
          ) : null}
        </section>

        <section className="flex min-h-0 flex-1 gap-4 overflow-hidden">
          {!sidebarCollapsed ? (
            <>
              <div className="min-h-0 shrink-0" style={{ width: `${sidebarWidth}px` }}>
                <NotesSidebar
                  activeNoteId={activeNoteId}
                  activeView={activeView}
                  counts={counts}
                  expandedFolderIds={expandedFolderIds}
                  folders={folders}
                  notes={visibleNotes}
                  searchQuery={searchQuery}
                  selectedFolderId={selectedFolderId}
                  searchInputRef={searchInputRef}
                  onClearTrash={handleClearTrash}
                  onCreateFolder={(name, parentId) => {
                    void createFolder(name, parentId);
                  }}
                  onCreateNote={handleCreateNote}
                  onDeleteFolder={handleDeleteFolder}
                  onRenameFolder={(folderId, name) => {
                    void renameFolder(folderId, name);
                  }}
                  onSearchChange={setSearchQuery}
                  onSelectFolder={setSelectedFolderId}
                  onSelectNote={(noteId) => {
                    void selectNote(noteId);
                  }}
                  onToggleFolderExpanded={toggleFolderExpanded}
                  onViewChange={setActiveView}
                />
              </div>

              <button
                type="button"
                onPointerDown={handleSidebarResizeStart}
                className="group relative hidden w-3 shrink-0 rounded-full bg-transparent lg:block"
                aria-label={t('notes.actions.resizeSidebar')}
              >
                <span className="absolute inset-y-10 left-1/2 w-px -translate-x-1/2 rounded-full bg-[var(--line-soft)] transition group-hover:bg-primary-400" />
              </button>
            </>
          ) : null}

          <div className="min-h-0 min-w-0 flex-1">
            <NoteEditorPane
              note={activeNote}
              saveState={saveState}
              onCreateNote={handleCreateNote}
              onDraftChange={updateActiveNoteDraft}
              onMoveToTrash={(id) => {
                void moveNoteToTrash(id);
              }}
              onSave={() => {
                void persistActiveNote();
              }}
              onToggleFavorite={(id) => {
                void toggleFavorite(id);
              }}
            />
          </div>

          {inspectorOpen ? (
            <div className="hidden min-h-0 w-[320px] shrink-0 xl:block">
              <NoteInspectorPanel
                folders={folders}
                note={activeNote}
                onDeletePermanently={handleDeletePermanently}
                onDraftChange={updateActiveNoteDraft}
                onMoveToTrash={(id) => {
                  void moveNoteToTrash(id);
                }}
                onRestoreNote={(id) => {
                  void handleRestoreNote(id);
                }}
              />
            </div>
          ) : null}
        </section>

        {isLoading ? (
          <div className="px-2 text-sm text-[var(--text-muted)]">
            {t('common.loading')}
          </div>
        ) : null}
      </div>
      <Dialog
        open={pendingDialog !== null}
        title={dialogTitle}
        description={dialogDescription}
        onClose={() => setPendingDialog(null)}
        footer={(
          <>
            <Button appearance="ghost" onClick={() => setPendingDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button appearance="danger" onClick={() => { void confirmPendingDialog(); }}>
              {pendingDialog?.kind === 'clearTrash'
                ? t('notes.dialogs.clearTrash.confirm')
                : pendingDialog?.kind === 'deleteFolder'
                  ? t('notes.dialogs.deleteFolder.confirm')
                  : t('notes.dialogs.deleteNote.confirm')}
            </Button>
          </>
        )}
      />
    </main>
  );
}
