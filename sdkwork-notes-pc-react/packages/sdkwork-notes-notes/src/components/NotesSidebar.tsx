import type { RefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Clock3,
  FileCode2,
  FileText,
  Folder,
  FolderPlus,
  NotebookPen,
  PencilLine,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@sdkwork/notes-commons';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import type { Note, NoteFolder, NoteSummary } from '@sdkwork/notes-types';
import { buildFlatFolderTree, formatRelativeNoteTime } from '../services';
import type { NotesCollectionView } from '../types/notesWorkspace';

interface NotesSidebarProps {
  activeNoteId: string | null;
  activeView: NotesCollectionView;
  counts: Record<NotesCollectionView, number>;
  expandedFolderIds: string[];
  folders: NoteFolder[];
  notes: NoteSummary[];
  searchQuery: string;
  selectedFolderId: string | null;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onClearTrash: () => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onCreateNote: (type: Note['type']) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onSearchChange: (value: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onSelectNote: (noteId: string) => void;
  onToggleFolderExpanded: (folderId: string) => void;
  onViewChange: (view: NotesCollectionView) => void;
}

function noteIcon(type: NoteSummary['type']) {
  if (type === 'code') {
    return FileCode2;
  }
  return FileText;
}

function QuickViewButton({
  active,
  count,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  icon: typeof FileText;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition ${
        active
          ? 'border-[var(--accent-soft-border)] bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]'
          : 'border-[var(--line-soft)] bg-[var(--panel-muted)] text-[var(--text-secondary)] hover:bg-[var(--panel-bg)]'
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="rounded-full bg-[var(--surface-scrim)] px-2 py-0.5 text-xs font-bold text-[var(--text-secondary)]">
        {count}
      </span>
    </button>
  );
}

function FolderActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof PencilLine;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--line-soft)] bg-[var(--panel-bg)] text-[var(--text-secondary)] transition hover:border-[var(--accent-soft-border)] hover:bg-[var(--accent-soft-bg)] hover:text-[var(--accent-soft-text)]"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function NotesSidebar({
  activeNoteId,
  activeView,
  counts,
  expandedFolderIds,
  folders,
  notes,
  searchQuery,
  selectedFolderId,
  searchInputRef,
  onClearTrash,
  onCreateFolder,
  onCreateNote,
  onDeleteFolder,
  onRenameFolder,
  onSearchChange,
  onSelectFolder,
  onSelectNote,
  onToggleFolderExpanded,
  onViewChange,
}: NotesSidebarProps) {
  const { t, i18n } = useNotesTranslation();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const folderTree = useMemo(
    () => buildFlatFolderTree(folders, expandedFolderIds),
    [expandedFolderIds, folders],
  );

  const handleCreateFolder = () => {
    const nextName = folderDraft.trim();
    if (!nextName) {
      return;
    }
    onCreateFolder(nextName, selectedFolderId);
    setFolderDraft('');
    setIsCreatingFolder(false);
  };

  const startFolderRename = (folder: NoteFolder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const cancelFolderRename = () => {
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  useEffect(() => {
    if (!editingFolderId) {
      return;
    }

    const editingFolderStillExists = folders.some((folder) => folder.id === editingFolderId);
    if (!editingFolderStillExists || selectedFolderId !== editingFolderId) {
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  }, [editingFolderId, folders, selectedFolderId]);

  const submitFolderRename = () => {
    const folderId = editingFolderId;
    const nextName = editingFolderName.trim();
    if (!folderId || !nextName) {
      return;
    }
    onRenameFolder(folderId, nextName);
    cancelFolderRename();
  };

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--panel-bg)] shadow-[var(--shadow-md)]">
      <div className="border-b border-[var(--line-soft)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-[0_18px_32px_rgba(51,103,246,0.25)]">
            <NotebookPen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {t('notes.sidebar.library')}
            </div>
            <div className="mt-1 text-lg font-black text-[var(--text-primary)]">
              {t('notes.brand')}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button appearance="primary" className="justify-center" onClick={() => onCreateNote('doc')}>
            <Sparkles className="h-4 w-4" />
            {t('notes.actions.newDoc')}
          </Button>
          <Button className="justify-center" onClick={() => setIsCreatingFolder((value) => !value)}>
            <FolderPlus className="h-4 w-4" />
            {t('notes.actions.newFolder')}
          </Button>
        </div>

        {isCreatingFolder ? (
          <div className="mt-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3">
            <input
              type="text"
              value={folderDraft}
              onChange={(event) => setFolderDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleCreateFolder();
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  setFolderDraft('');
                  setIsCreatingFolder(false);
                }
              }}
              placeholder={t('notes.sidebar.createFolderPlaceholder')}
              className="w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-primary-400"
            />
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span>{selectedFolderId ? t('notes.sidebar.createInCurrentFolder') : t('notes.sidebar.createTopLevelFolder')}</span>
              <div className="flex items-center gap-2">
                <Button appearance="ghost" onClick={() => setIsCreatingFolder(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateFolder}>{t('notes.actions.confirmCreateFolder')}</Button>
              </div>
            </div>
          </div>
        ) : null}

        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('notes.searchPlaceholder')}
            className="w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary-400"
          />
        </label>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {t('notes.sidebar.searchHint')}
        </p>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          <QuickViewButton
            active={activeView === 'all'}
            count={counts.all}
            icon={FileText}
            label={t('notes.views.all')}
            onClick={() => onViewChange('all')}
          />
          <QuickViewButton
            active={activeView === 'favorites'}
            count={counts.favorites}
            icon={Star}
            label={t('notes.views.favorites')}
            onClick={() => onViewChange('favorites')}
          />
          <QuickViewButton
            active={activeView === 'recent'}
            count={counts.recent}
            icon={Clock3}
            label={t('notes.views.recent')}
            onClick={() => onViewChange('recent')}
          />
          <QuickViewButton
            active={activeView === 'trash'}
            count={counts.trash}
            icon={Trash2}
            label={t('notes.views.trash')}
            onClick={() => onViewChange('trash')}
          />
        </div>

        {activeView === 'trash' && counts.trash > 0 ? (
          <Button className="mt-3 w-full justify-center" onClick={onClearTrash}>
            <Trash2 className="h-4 w-4" />
            {t('notes.actions.clearTrash')}
          </Button>
        ) : null}

        {activeView !== 'trash' ? (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {t('notes.sidebar.folders')}
              </div>
              <button
                type="button"
                onClick={() => onSelectFolder(null)}
                className={`text-xs font-semibold transition ${
                  selectedFolderId === null
                    ? 'text-[var(--accent-soft-text)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t('notes.sidebar.allFolders')}
              </button>
            </div>

            {folderTree.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line-soft)] px-3 py-4 text-sm text-[var(--text-muted)]">
                {t('notes.sidebar.noFolders')}
              </div>
            ) : (
              <div className="space-y-1">
                {folderTree.map(({ folder, depth, hasChildren, isExpanded }) => {
                  const isSelected = selectedFolderId === folder.id;
                  const isEditing = editingFolderId === folder.id;

                  return (
                    <div key={folder.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => onSelectFolder(folder.id)}
                        onDoubleClick={() => startFolderRename(folder)}
                        className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition ${
                          isSelected
                            ? 'bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--panel-muted)]'
                        }`}
                        style={{ paddingLeft: `${12 + (depth * 16)}px` }}
                      >
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-[var(--surface-scrim)]"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (hasChildren) {
                              onToggleFolderExpanded(folder.id);
                            }
                          }}
                        >
                          {hasChildren ? (
                            <ChevronRight className={`h-4 w-4 transition ${isExpanded ? 'rotate-90' : ''}`} />
                          ) : (
                            <span className="h-4 w-4" />
                          )}
                        </span>
                        <Folder className="h-4 w-4 shrink-0" />
                        <span className="truncate text-sm font-medium">{folder.name}</span>
                      </button>

                      {isSelected ? (
                        <div
                          className="space-y-2"
                          style={{ paddingLeft: `${44 + (depth * 16)}px` }}
                        >
                          {isEditing ? (
                            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] p-2">
                              <input
                                type="text"
                                autoFocus
                                value={editingFolderName}
                                onChange={(event) => setEditingFolderName(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    submitFolderRename();
                                  }

                                  if (event.key === 'Escape') {
                                    event.preventDefault();
                                    cancelFolderRename();
                                  }
                                }}
                                placeholder={t('notes.sidebar.renameFolderPlaceholder')}
                                className="w-full rounded-xl border border-[var(--line-soft)] bg-[var(--panel-bg)] px-3 py-2 text-sm outline-none focus:border-primary-400"
                              />
                              <div className="mt-2 flex items-center justify-end gap-2">
                                <FolderActionButton
                                  icon={X}
                                  label={t('common.cancel')}
                                  onClick={cancelFolderRename}
                                />
                                <FolderActionButton
                                  icon={Check}
                                  label={t('notes.sidebar.saveFolderRename')}
                                  onClick={submitFolderRename}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <FolderActionButton
                                icon={PencilLine}
                                label={t('notes.sidebar.renameFolder')}
                                onClick={() => startFolderRename(folder)}
                              />
                              <FolderActionButton
                                icon={Trash2}
                                label={t('notes.sidebar.deleteFolder')}
                                onClick={() => onDeleteFolder(folder.id)}
                              />
                              <span>{t('notes.sidebar.folderActionHint')}</span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {activeView === 'trash' ? t('notes.sidebar.trashList') : t('notes.sidebar.noteList')}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {notes.length}
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line-soft)] px-3 py-4 text-sm text-[var(--text-muted)]">
              {t('notes.sidebar.noNotes')}
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => {
                const Icon = noteIcon(note.type);
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => onSelectNote(note.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      activeNoteId === note.id
                        ? 'border-[var(--accent-soft-border)] bg-[var(--accent-soft-bg)] shadow-[0_10px_24px_rgba(51,103,246,0.12)]'
                        : 'border-[var(--line-soft)] bg-[var(--panel-muted)] hover:bg-[var(--panel-bg)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl ${
                        activeNoteId === note.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-[var(--surface-raised)] text-[var(--text-secondary)]'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {note.title}
                          </div>
                          {note.isFavorite ? (
                            <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                          {note.snippet || t('notes.editor.emptyPreview')}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[var(--text-muted)]">
                          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] px-2 py-1">
                            {t(`notes.types.${note.type}`)}
                          </span>
                          {formatRelativeNoteTime(note.updatedAt, i18n.language) ? (
                            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] px-2 py-1">
                              {formatRelativeNoteTime(note.updatedAt, i18n.language)}
                            </span>
                          ) : null}
                          {note.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-bg)] px-2 py-1"
                            >
                              #{tag}
                            </span>
                          ))}
                          {note.tags.length > 2 ? (
                            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-bg)] px-2 py-1">
                              +{note.tags.length - 2}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
