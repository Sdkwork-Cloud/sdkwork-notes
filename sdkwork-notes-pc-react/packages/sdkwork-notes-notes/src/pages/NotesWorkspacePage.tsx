import { startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@sdkwork/notes-commons';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import { useAppStore } from '@sdkwork/notes-core';
import {
  buildNoteWorkspaceCommandPaletteItems,
  buildNotesWorkspacePagePresentationModel,
  buildNotesWorkspaceSaveFeedbackModel,
  bindNotesWorkspacePageHideAutosave,
  bindNotesWorkspaceSyncConnectivityRuntime,
  bindNotesWorkspaceVisibilityAutosave,
  buildNotesWorkspaceViewModel,
  createNotesWorkspaceAutosavePlan,
  createNotesWorkspaceCreateNoteRuntime,
  createNotesWorkspaceDialogRuntime,
  createNotesWorkspacePageCommandRuntime,
  buildNotesWorkspaceDialogState,
  buildNotesWorkspacePageHeaderActions,
  bindNotesWorkspaceHotkeys,
  formatRelativeNoteTime,
  resolveNotesWorkspaceHotkeyCommand,
  scheduleNotesWorkspaceAutosave,
  startNotesWorkspaceSidebarResize,
  type NoteWorkspacePendingDialog,
  type NotesWorkspacePageCommand,
} from '../services';
import {
  NoteEditorPane,
  NoteInspectorPanel,
  NotesSidebar,
  NotesWorkspaceCommandPalette,
  NotesWorkspaceDialogFooter,
  NotesWorkspaceErrorBanner,
  NotesWorkspaceHeaderActions,
  NotesWorkspaceInsightsPanel,
  NotesWorkspaceRecoveryBanner,
  NotesWorkspaceShortcutHints,
} from '../components';
import { useNotesWorkspaceStore } from '../store/useNotesWorkspaceStore';

export function NotesWorkspacePage() {
  const { t, i18n } = useNotesTranslation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [pendingDialog, setPendingDialog] = useState<NoteWorkspacePendingDialog | null>(null);
  const isLoading = useNotesWorkspaceStore((state) => state.isLoading);
  const saveState = useNotesWorkspaceStore((state) => state.saveState);
  const errorMessage = useNotesWorkspaceStore((state) => state.errorMessage);
  const notes = useNotesWorkspaceStore((state) => state.notes);
  const trashedNotes = useNotesWorkspaceStore((state) => state.trashedNotes);
  const folders = useNotesWorkspaceStore((state) => state.folders);
  const syncQueueSnapshot = useNotesWorkspaceStore((state) => state.syncQueueSnapshot);
  const activeNoteId = useNotesWorkspaceStore((state) => state.activeNoteId);
  const activeNote = useNotesWorkspaceStore((state) => state.activeNote);
  const recoveredDrafts = useNotesWorkspaceStore((state) => state.recoveredDrafts);
  const activeRecoveredDraft = useNotesWorkspaceStore((state) => state.activeRecoveredDraft);
  const activeView = useNotesWorkspaceStore((state) => state.activeView);
  const searchQuery = useNotesWorkspaceStore((state) => state.searchQuery);
  const selectedFolderId = useNotesWorkspaceStore((state) => state.selectedFolderId);
  const sidebarWidth = useNotesWorkspaceStore((state) => state.sidebarWidth);
  const expandedFolderIds = useNotesWorkspaceStore((state) => state.expandedFolderIds);
  const initialize = useNotesWorkspaceStore((state) => state.initialize);
  const captureActiveNoteExitRecovery = useNotesWorkspaceStore((state) => state.captureActiveNoteExitRecovery);
  const createNote = useNotesWorkspaceStore((state) => state.createNote);
  const createFolder = useNotesWorkspaceStore((state) => state.createFolder);
  const renameFolder = useNotesWorkspaceStore((state) => state.renameFolder);
  const moveFolder = useNotesWorkspaceStore((state) => state.moveFolder);
  const deleteFolder = useNotesWorkspaceStore((state) => state.deleteFolder);
  const selectNote = useNotesWorkspaceStore((state) => state.selectNote);
  const updateActiveNoteDraft = useNotesWorkspaceStore((state) => state.updateActiveNoteDraft);
  const restoreRecoveredDraft = useNotesWorkspaceStore((state) => state.restoreRecoveredDraft);
  const dismissRecoveredDraft = useNotesWorkspaceStore((state) => state.dismissRecoveredDraft);
  const persistActiveNote = useNotesWorkspaceStore((state) => state.persistActiveNote);
  const moveNote = useNotesWorkspaceStore((state) => state.moveNote);
  const moveNoteToTrash = useNotesWorkspaceStore((state) => state.moveNoteToTrash);
  const restoreNoteFromTrash = useNotesWorkspaceStore((state) => state.restoreNoteFromTrash);
  const deleteNotePermanently = useNotesWorkspaceStore((state) => state.deleteNotePermanently);
  const clearTrash = useNotesWorkspaceStore((state) => state.clearTrash);
  const toggleFavorite = useNotesWorkspaceStore((state) => state.toggleFavorite);
  const requestSyncDrain = useNotesWorkspaceStore((state) => state.requestSyncDrain);
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

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const workspaceViewModel = useMemo(
    () => buildNotesWorkspaceViewModel({
      notes,
      trashedNotes,
      folders,
      activeView,
      searchQuery,
      selectedFolderId,
      activeNote,
      locale: i18n.language,
      syncTasks: syncQueueSnapshot.tasks,
    }),
    [
      activeNote,
      activeView,
      folders,
      i18n.language,
      notes,
      searchQuery,
      selectedFolderId,
      syncQueueSnapshot.tasks,
      trashedNotes,
    ],
  );
  const {
    visibleNotes,
    counts,
    activeOutline,
    activeTaskProgress,
    activeWordCount,
    activeNoteFolderName,
    activeNoteUpdatedLabel,
    syncSummary,
  } = workspaceViewModel;
  const pagePresentation = useMemo(
    () => buildNotesWorkspacePagePresentationModel({
      t,
      activeView,
      activeNote,
      saveState,
      counts,
      activeTaskProgress,
      activeOutline,
      activeWordCount,
      activeNoteFolderName,
      activeNoteUpdatedLabel,
      syncSummary,
      platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
    }),
    [
      activeNote,
      activeNoteFolderName,
      activeNoteUpdatedLabel,
      activeOutline,
      activeTaskProgress,
      activeView,
      activeWordCount,
      counts,
      saveState,
      syncSummary,
      t,
    ],
  );

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
  const autosavePlan = createNotesWorkspaceAutosavePlan({
    activeNoteId: activeNote?.id ?? null,
    activeNoteDeletedAt: activeNote?.deletedAt,
    saveState,
  });
  const saveFeedback = buildNotesWorkspaceSaveFeedbackModel({
    saveState,
    errorMessage,
  });
  const primaryRecoveredDraft = activeRecoveredDraft ?? recoveredDrafts[0] ?? null;
  const recoveryBanner = useMemo(() => {
    if (!primaryRecoveredDraft) {
      return null;
    }

    const capturedAtLabel = formatRelativeNoteTime(primaryRecoveredDraft.capturedAt, i18n.language)
      || primaryRecoveredDraft.capturedAt;
    const recoveredTitle = primaryRecoveredDraft.draft.title.trim() || primaryRecoveredDraft.remoteTitle;
    const remainingCount = recoveredDrafts.length - 1;

    return activeRecoveredDraft
      ? {
          title: t('notes.recovery.activeTitle'),
          description: t('notes.recovery.activeDescription', {
            capturedAt: capturedAtLabel,
          }),
          caption: remainingCount > 0 ? t('notes.recovery.morePending', { count: remainingCount }) : null,
          primaryLabel: t('notes.recovery.restore'),
          secondaryLabel: t('notes.recovery.discard'),
          onPrimaryAction: () => {
            void restoreRecoveredDraft(primaryRecoveredDraft.noteId);
          },
          onSecondaryAction: () => {
            void dismissRecoveredDraft(primaryRecoveredDraft.noteId);
          },
        }
      : {
          title: t('notes.recovery.pendingTitle'),
          description: t('notes.recovery.pendingDescription', {
            title: recoveredTitle,
            capturedAt: capturedAtLabel,
          }),
          caption: remainingCount > 0 ? t('notes.recovery.morePending', { count: remainingCount }) : null,
          primaryLabel: t('notes.recovery.open'),
          secondaryLabel: t('notes.recovery.discard'),
          onPrimaryAction: () => {
            void selectNote(primaryRecoveredDraft.noteId);
          },
          onSecondaryAction: () => {
            void dismissRecoveredDraft(primaryRecoveredDraft.noteId);
          },
        };
  }, [
    activeRecoveredDraft,
    dismissRecoveredDraft,
    i18n.language,
    primaryRecoveredDraft,
    recoveredDrafts.length,
    restoreRecoveredDraft,
    selectNote,
    t,
  ]);

  const flushDraft = useEffectEvent(() => {
    if (!autosavePlan.shouldFlush) {
      return;
    }
    void persistActiveNote();
  });

  const capturePageHideRecoverySnapshot = useEffectEvent(() => {
    void captureActiveNoteExitRecovery('pagehide');
  });

  const captureVisibilityHiddenRecoverySnapshot = useEffectEvent(() => {
    void captureActiveNoteExitRecovery('visibility-hidden');
  });

  useEffect(() => {
    return scheduleNotesWorkspaceAutosave(autosavePlan, {
      scheduleTimeout: (delayMs, callback) => {
        const timer = window.setTimeout(callback, delayMs);
        return () => {
          window.clearTimeout(timer);
        };
      },
      flushDraft,
    });
  }, [autosavePlan.delayMs, autosavePlan.shouldSchedule, deferredDraftKey, flushDraft]);

  useEffect(() => {
    return bindNotesWorkspacePageHideAutosave(autosavePlan, {
      bindPageHide: (callback) => {
        window.addEventListener('pagehide', callback);
        return () => {
          window.removeEventListener('pagehide', callback);
        };
      },
      captureRecoverySnapshot: capturePageHideRecoverySnapshot,
      flushDraft,
    });
  }, [autosavePlan.shouldFlushOnPageHide, capturePageHideRecoverySnapshot, flushDraft]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    return bindNotesWorkspaceVisibilityAutosave(autosavePlan, {
      bindVisibilityChange: (handler) => {
        document.addEventListener('visibilitychange', handler);
        return () => {
          document.removeEventListener('visibilitychange', handler);
        };
      },
      isDocumentHidden: () => document.visibilityState === 'hidden',
      captureRecoverySnapshot: captureVisibilityHiddenRecoverySnapshot,
      flushDraft,
    });
  }, [autosavePlan.shouldFlushOnPageHide, captureVisibilityHiddenRecoverySnapshot, flushDraft]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return undefined;
    }

    return bindNotesWorkspaceSyncConnectivityRuntime({
      bindOnline: (handler) => {
        window.addEventListener('online', handler);
        return () => {
          window.removeEventListener('online', handler);
        };
      },
      bindOffline: (handler) => {
        window.addEventListener('offline', handler);
        return () => {
          window.removeEventListener('offline', handler);
        };
      },
      isOnline: () => navigator.onLine,
      requestSyncDrain,
    });
  }, [requestSyncDrain]);

  const createNoteRuntime = createNotesWorkspaceCreateNoteRuntime({
    selectedFolderId,
    resolveDefaultTitle: (type) =>
      type === 'article'
        ? t('notes.defaults.articleTitle')
        : type === 'code'
          ? t('notes.defaults.codeTitle')
          : t('notes.defaults.docTitle'),
    createNote,
    runTransition: startTransition,
    setActiveView,
  });
  const handleCreateNote = createNoteRuntime.createNote;

  const focusWorkspaceSearch = () => {
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  };

  const pageCommandRuntime = createNotesWorkspacePageCommandRuntime({
    inspectorOpen,
    runTransition: startTransition,
    setCommandPaletteOpen,
    createNote: handleCreateNote,
    persistActiveNote: flushDraft,
    focusSearch: focusWorkspaceSearch,
    blurSearch: () => {
      searchInputRef.current?.blur();
    },
    setSearchQuery,
    toggleSidebar,
    setInspectorOpen,
    navigateAccount: () => {
      navigate('/account');
    },
    setActiveView,
    setSelectedFolderId,
    selectNote,
    clearTrash: async () => {
      await clearTrash();
    },
    deleteNotePermanently: async (noteId) => {
      await deleteNotePermanently(noteId);
    },
    deleteFolder: async (folderId) => {
      await deleteFolder(folderId);
    },
  });

  const handleWorkspacePageCommand = useEffectEvent(async (command: NotesWorkspacePageCommand) => {
    await pageCommandRuntime.execute(command);
  });

  const headerActions = useMemo(
    () => buildNotesWorkspacePageHeaderActions({
      t,
      inspectorOpen,
      sidebarCollapsed,
    }),
    [inspectorOpen, sidebarCollapsed, t],
  );

  const dialogRuntime = createNotesWorkspaceDialogRuntime({
    setPendingDialog,
    executeDialogCommand: async (dialog) => {
      await pageCommandRuntime.executeDialogConfirm(dialog);
    },
    restoreNoteFromTrash,
    runTransition: startTransition,
    setActiveView,
    selectNote,
  });

  useEffect(() => {
    return bindNotesWorkspaceHotkeys({
      isCommandPaletteOpen,
      isSearchFocused: () => typeof document !== 'undefined' && document.activeElement === searchInputRef.current,
      resolveCommand: resolveNotesWorkspaceHotkeyCommand,
      executeCommand: handleWorkspacePageCommand,
      bindKeydown: (handler) => {
        window.addEventListener('keydown', handler);
        return () => {
          window.removeEventListener('keydown', handler);
        };
      },
    });
  }, [handleWorkspacePageCommand, isCommandPaletteOpen]);

  const commandPaletteDescriptors = useMemo(
    () => buildNoteWorkspaceCommandPaletteItems({
      t,
      notes,
      trashedNotes,
      folders,
      searchQuery,
      sidebarCollapsed,
      inspectorOpen,
    }),
    [folders, inspectorOpen, notes, searchQuery, sidebarCollapsed, t, trashedNotes],
  );

  const handleCommandPaletteDescriptorSelect = useEffectEvent(async (
    descriptor: (typeof commandPaletteDescriptors)[number],
  ) => {
    await pageCommandRuntime.executeCommandPaletteAction(descriptor.action);
  });

  const dialogState = useMemo(
    () => buildNotesWorkspaceDialogState({
      pendingDialog,
      notes,
      trashedNotes,
      folders,
      t,
    }),
    [folders, notes, pendingDialog, t, trashedNotes],
  );

  const handleDialogConfirm = useEffectEvent(() => {
    void dialogRuntime.confirmDialog(pendingDialog);
  });

  const handleSidebarResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    startNotesWorkspaceSidebarResize({
      startX: event.clientX,
      startWidth: sidebarWidth,
      setSidebarWidth,
      bindPointerMove: (handler) => {
        window.addEventListener('pointermove', handler);
        return () => {
          window.removeEventListener('pointermove', handler);
        };
      },
      bindPointerUp: (handler) => {
        window.addEventListener('pointerup', handler);
        return () => {
          window.removeEventListener('pointerup', handler);
        };
      },
    });
  };

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-4 lg:px-6">
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

            <NotesWorkspaceHeaderActions
              actions={headerActions}
              onCommandAction={handleWorkspacePageCommand}
            />
          </div>
          <NotesWorkspaceShortcutHints
            label={t('notes.shortcuts.label')}
            shortcutHints={pagePresentation.shortcutHints}
          />

          <NotesWorkspaceErrorBanner
            message={saveFeedback.bannerMessage}
            dismissLabel={t('notes.actions.dismissError')}
            retryLabel={t('notes.actions.retrySave')}
            onDismiss={clearError}
            onRetry={saveFeedback.retryAvailable ? flushDraft : undefined}
          />
          {recoveryBanner ? (
            <NotesWorkspaceRecoveryBanner
              title={recoveryBanner.title}
              description={recoveryBanner.description}
              caption={recoveryBanner.caption}
              primaryLabel={recoveryBanner.primaryLabel}
              secondaryLabel={recoveryBanner.secondaryLabel}
              onPrimaryAction={recoveryBanner.onPrimaryAction}
              onSecondaryAction={recoveryBanner.onSecondaryAction}
            />
          ) : null}
          <NotesWorkspaceInsightsPanel
            focusTitle={t('notes.workspace.focusTitle')}
            pagePresentation={pagePresentation}
            onSyncAction={
              pagePresentation.syncCard.actionKind === 'retry-sync'
                ? () => {
                    void requestSyncDrain();
                  }
                : pagePresentation.syncCard.actionKind === 'review-note'
                  && pagePresentation.syncCard.actionTargetNoteId
                  ? () => {
                      void selectNote(pagePresentation.syncCard.actionTargetNoteId);
                    }
                : undefined
            }
          />
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
                  onClearTrash={dialogRuntime.openClearTrashDialog}
                  onCreateFolder={(name, parentId) => {
                    void createFolder(name, parentId);
                  }}
                  onCreateNote={handleCreateNote}
                  onDeleteFolder={dialogRuntime.openDeleteFolderDialog}
                  onMoveFolder={(folderId, newParentId) => {
                    void moveFolder(folderId, newParentId);
                  }}
                  onMoveNote={(noteId, newParentId) => {
                    void moveNote(noteId, newParentId);
                  }}
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
              onSave={flushDraft}
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
                onDeletePermanently={dialogRuntime.openDeleteNoteDialog}
                onDraftChange={updateActiveNoteDraft}
                onMoveToTrash={(id) => {
                  void moveNoteToTrash(id);
                }}
                onRestoreNote={(id) => {
                  void dialogRuntime.restoreNote(id);
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
        open={dialogState.open}
        title={dialogState.title}
        description={dialogState.description}
        onClose={dialogRuntime.closeDialog}
        footer={(
          <NotesWorkspaceDialogFooter
            cancelLabel={t('common.cancel')}
            confirmLabel={dialogState.confirmLabel}
            onCancel={dialogRuntime.closeDialog}
            onConfirm={handleDialogConfirm}
          />
        )}
      />
      <NotesWorkspaceCommandPalette
        open={isCommandPaletteOpen}
        descriptors={commandPaletteDescriptors}
        modifierKey={pagePresentation.modifierKey}
        onSelectDescriptor={handleCommandPaletteDescriptorSelect}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </main>
  );
}
