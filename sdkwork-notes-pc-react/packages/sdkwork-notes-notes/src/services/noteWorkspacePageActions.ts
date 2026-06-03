import type { Note } from '@sdkwork/notes-types';
import type { NotesCollectionView } from '../types/notesWorkspace';
import type { NoteWorkspaceCommandPaletteAction } from './noteWorkspaceCommandPaletteModel';

export type NoteWorkspacePendingDialog =
  | { kind: 'clearTrash' }
  | { kind: 'deleteNote'; noteId: string }
  | { kind: 'deleteFolder'; folderId: string };

export type NotesWorkspacePageCommand =
  | { type: 'open-command-palette' }
  | { type: 'create-note'; noteType: Note['type'] }
  | { type: 'persist-active-note' }
  | { type: 'focus-search' }
  | { type: 'clear-search'; focusSearch: boolean }
  | { type: 'toggle-sidebar' }
  | { type: 'toggle-inspector' }
  | { type: 'navigate-account' }
  | { type: 'change-view'; view: NotesCollectionView }
  | { type: 'open-folder'; folderId: string | null }
  | { type: 'open-note'; noteId: string; isTrashed: boolean; folderId: string | null }
  | { type: 'clear-trash' }
  | { type: 'delete-note'; noteId: string }
  | { type: 'delete-folder'; folderId: string };

function normalizeKey(key: string) {
  return key.toLowerCase();
}

export function resolveNotesWorkspaceHotkeyCommand(options: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  isCommandPaletteOpen: boolean;
  isSearchFocused: boolean;
}): NotesWorkspacePageCommand | null {
  const {
    key,
    metaKey,
    ctrlKey,
    shiftKey,
    altKey,
    isCommandPaletteOpen,
    isSearchFocused,
  } = options;
  const normalizedKey = normalizeKey(key);
  const hasModifier = metaKey || ctrlKey;

  if (hasModifier && !altKey && !shiftKey && normalizedKey === 'k') {
    return { type: 'open-command-palette' };
  }

  if (isCommandPaletteOpen) {
    return null;
  }

  if (hasModifier && !altKey && !shiftKey && normalizedKey === 'n') {
    return { type: 'create-note', noteType: 'doc' };
  }

  if (hasModifier && !altKey && !shiftKey && normalizedKey === 'enter') {
    return { type: 'persist-active-note' };
  }

  if (hasModifier && shiftKey && !altKey && normalizedKey === 'f') {
    return { type: 'focus-search' };
  }

  if (hasModifier && shiftKey && !altKey && normalizedKey === 's') {
    return { type: 'toggle-sidebar' };
  }

  if (hasModifier && shiftKey && !altKey && normalizedKey === 'i') {
    return { type: 'toggle-inspector' };
  }

  if (normalizedKey === 'escape' && isSearchFocused) {
    return { type: 'clear-search', focusSearch: false };
  }

  return null;
}

export function resolveNotesWorkspaceCommandPaletteCommand(
  action: NoteWorkspaceCommandPaletteAction,
): NotesWorkspacePageCommand {
  if (action.type === 'clear-search') {
    return {
      type: 'clear-search',
      focusSearch: true,
    };
  }

  return action;
}

export function resolveNotesWorkspaceDialogConfirmCommand(
  dialog: NoteWorkspacePendingDialog,
): NotesWorkspacePageCommand {
  if (dialog.kind === 'clearTrash') {
    return { type: 'clear-trash' };
  }

  if (dialog.kind === 'deleteNote') {
    return { type: 'delete-note', noteId: dialog.noteId };
  }

  return { type: 'delete-folder', folderId: dialog.folderId };
}
