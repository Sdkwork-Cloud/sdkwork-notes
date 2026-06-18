import type { NotesCollectionView } from '../types/notesWorkspace';
import type { NoteWorkspacePendingDialog } from './noteWorkspacePageActions';

export interface NotesWorkspaceDialogRuntimeDependencies {
  setPendingDialog: (dialog: NoteWorkspacePendingDialog | null) => void;
  executeDialogCommand: (dialog: NoteWorkspacePendingDialog) => Promise<void>;
  restoreNoteFromTrash: (noteId: string) => Promise<boolean>;
  runTransition: (action: () => void) => void;
  setActiveView: (view: NotesCollectionView) => void;
  selectNote: (noteId: string) => Promise<void>;
}

export function createNotesWorkspaceDialogRuntime(
  dependencies: NotesWorkspaceDialogRuntimeDependencies,
) {
  const {
    setPendingDialog,
    executeDialogCommand,
    restoreNoteFromTrash,
    runTransition,
    setActiveView,
    selectNote,
  } = dependencies;

  return {
    openClearTrashDialog() {
      setPendingDialog({ kind: 'clearTrash' });
    },
    openDeleteNoteDialog(noteId: string) {
      setPendingDialog({ kind: 'deleteNote', noteId });
    },
    openDeleteFolderDialog(folderId: string) {
      setPendingDialog({ kind: 'deleteFolder', folderId });
    },
    closeDialog() {
      setPendingDialog(null);
    },
    async confirmDialog(dialog: NoteWorkspacePendingDialog | null) {
      setPendingDialog(null);

      if (!dialog) {
        return;
      }

      await executeDialogCommand(dialog);
    },
    async restoreNote(noteId: string) {
      const restored = await restoreNoteFromTrash(noteId);
      if (!restored) {
        return;
      }

      runTransition(() => {
        setActiveView('all');
      });
      await selectNote(noteId);
    },
  };
}
