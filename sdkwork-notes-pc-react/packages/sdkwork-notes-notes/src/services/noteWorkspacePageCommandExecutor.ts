import type { Note } from '@sdkwork/notes-types';
import type { NotesCollectionView } from '../types/notesWorkspace';
import type { NotesWorkspacePageCommand } from './noteWorkspacePageActions';

export interface NotesWorkspacePageCommandExecutorDependencies {
  inspectorOpen: boolean;
  openCommandPalette(): void;
  createNote(noteType: Note['type']): Promise<void>;
  persistActiveNote(): void | Promise<void>;
  focusSearch(): void;
  blurSearch(): void;
  clearSearch(): void;
  toggleSidebar(): void;
  setInspectorOpen(nextValue: boolean): void;
  navigateAccount(): void;
  changeView(view: NotesCollectionView): void;
  openFolder(folderId: string | null): void;
  openNote(noteId: string, isTrashed: boolean, folderId: string | null): Promise<void>;
  clearTrash(): Promise<void>;
  deleteNote(noteId: string): Promise<void>;
  deleteFolder(folderId: string): Promise<void>;
}

export async function executeNotesWorkspacePageCommand(
  command: NotesWorkspacePageCommand,
  dependencies: NotesWorkspacePageCommandExecutorDependencies,
) {
  if (command.type === 'open-command-palette') {
    dependencies.openCommandPalette();
    return;
  }

  if (command.type === 'create-note') {
    await dependencies.createNote(command.noteType);
    return;
  }

  if (command.type === 'persist-active-note') {
    await dependencies.persistActiveNote();
    return;
  }

  if (command.type === 'focus-search') {
    dependencies.focusSearch();
    return;
  }

  if (command.type === 'clear-search') {
    dependencies.clearSearch();
    if (command.focusSearch) {
      dependencies.focusSearch();
    } else {
      dependencies.blurSearch();
    }
    return;
  }

  if (command.type === 'toggle-sidebar') {
    dependencies.toggleSidebar();
    return;
  }

  if (command.type === 'toggle-inspector') {
    dependencies.setInspectorOpen(!dependencies.inspectorOpen);
    return;
  }

  if (command.type === 'navigate-account') {
    dependencies.navigateAccount();
    return;
  }

  if (command.type === 'change-view') {
    dependencies.changeView(command.view);
    return;
  }

  if (command.type === 'open-folder') {
    dependencies.openFolder(command.folderId);
    return;
  }

  if (command.type === 'open-note') {
    await dependencies.openNote(command.noteId, command.isTrashed, command.folderId);
    return;
  }

  if (command.type === 'clear-trash') {
    await dependencies.clearTrash();
    return;
  }

  if (command.type === 'delete-note') {
    await dependencies.deleteNote(command.noteId);
    return;
  }

  await dependencies.deleteFolder(command.folderId);
}
