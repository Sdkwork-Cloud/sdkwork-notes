import type { Note } from '@sdkwork/notes-pc-types-commons';
import type { NotesCollectionView } from '../types/notesWorkspace';
import type { NotesWorkspacePageCommandExecutorDependencies } from './noteWorkspacePageCommandExecutor';

export interface NotesWorkspacePageCommandFactoryDependencies {
  inspectorOpen: boolean;
  runTransition(action: () => void): void;
  setCommandPaletteOpen(open: boolean): void;
  createNote(noteType: Note['type']): Promise<void>;
  persistActiveNote(): void | Promise<void>;
  focusSearch(): void;
  blurSearch(): void;
  setSearchQuery(query: string): void;
  toggleSidebar(): void;
  setInspectorOpen(nextValue: boolean): void;
  navigateAccount(): void;
  setActiveView(view: NotesCollectionView): void;
  setSelectedFolderId(folderId: string | null): void;
  selectNote(noteId: string): Promise<void>;
  clearTrash(): Promise<void>;
  deleteNotePermanently(noteId: string): Promise<void>;
  deleteFolder(folderId: string): Promise<void>;
}

export function createNotesWorkspacePageCommandDependencies(
  dependencies: NotesWorkspacePageCommandFactoryDependencies,
): NotesWorkspacePageCommandExecutorDependencies {
  return {
    inspectorOpen: dependencies.inspectorOpen,
    openCommandPalette: () => {
      dependencies.setCommandPaletteOpen(true);
    },
    createNote: dependencies.createNote,
    persistActiveNote: dependencies.persistActiveNote,
    focusSearch: dependencies.focusSearch,
    blurSearch: dependencies.blurSearch,
    clearSearch: () => {
      dependencies.setSearchQuery('');
    },
    toggleSidebar: dependencies.toggleSidebar,
    setInspectorOpen: dependencies.setInspectorOpen,
    navigateAccount: dependencies.navigateAccount,
    changeView: (view) => {
      dependencies.runTransition(() => {
        dependencies.setActiveView(view);
        dependencies.setSelectedFolderId(null);
      });
    },
    openFolder: (folderId) => {
      dependencies.runTransition(() => {
        dependencies.setActiveView('all');
        dependencies.setSelectedFolderId(folderId);
        dependencies.setSearchQuery('');
      });
    },
    openNote: async (noteId, isTrashed, folderId) => {
      dependencies.runTransition(() => {
        dependencies.setActiveView(isTrashed ? 'trash' : 'all');
        dependencies.setSelectedFolderId(isTrashed ? null : folderId);
        dependencies.setSearchQuery('');
      });
      await dependencies.selectNote(noteId);
    },
    clearTrash: dependencies.clearTrash,
    deleteNote: dependencies.deleteNotePermanently,
    deleteFolder: dependencies.deleteFolder,
  };
}
