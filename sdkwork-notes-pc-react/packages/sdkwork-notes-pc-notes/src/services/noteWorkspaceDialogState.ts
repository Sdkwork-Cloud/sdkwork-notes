import type { Note } from '@sdkwork/notes-pc-types-commons';
import type { NoteWorkspacePendingDialog } from './noteWorkspacePageActions';

type DialogNoteSummary = Pick<Note, 'id' | 'title'>;
type DialogFolderSummary = {
  id: string;
  name: string;
};

type NotesWorkspaceDialogTranslator = (
  key: string,
  options?: Record<string, unknown>,
) => string;

export interface NotesWorkspaceDialogState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
}

export interface NotesWorkspaceDialogStateInput {
  pendingDialog: NoteWorkspacePendingDialog | null;
  notes: DialogNoteSummary[];
  trashedNotes: DialogNoteSummary[];
  folders: DialogFolderSummary[];
  t: NotesWorkspaceDialogTranslator;
}

function createClosedDialogState(): NotesWorkspaceDialogState {
  return {
    open: false,
    title: '',
    description: '',
    confirmLabel: '',
  };
}

function resolveDialogNoteTitle(
  pendingDialog: Extract<NoteWorkspacePendingDialog, { kind: 'deleteNote' }>,
  notes: DialogNoteSummary[],
  trashedNotes: DialogNoteSummary[],
  t: NotesWorkspaceDialogTranslator,
) {
  return (
    [...notes, ...trashedNotes].find((note) => note.id === pendingDialog.noteId)?.title
    ?? t('notes.defaults.docTitle')
  );
}

function resolveDialogFolderName(
  pendingDialog: Extract<NoteWorkspacePendingDialog, { kind: 'deleteFolder' }>,
  folders: DialogFolderSummary[],
  t: NotesWorkspaceDialogTranslator,
) {
  return (
    folders.find((folder) => folder.id === pendingDialog.folderId)?.name
    ?? t('notes.defaults.folderTitle')
  );
}

export function buildNotesWorkspaceDialogState(
  input: NotesWorkspaceDialogStateInput,
): NotesWorkspaceDialogState {
  const { pendingDialog, notes, trashedNotes, folders, t } = input;

  if (!pendingDialog) {
    return createClosedDialogState();
  }

  if (pendingDialog.kind === 'clearTrash') {
    return {
      open: true,
      title: t('notes.dialogs.clearTrash.title'),
      description: t('notes.dialogs.clearTrash.description'),
      confirmLabel: t('notes.dialogs.clearTrash.confirm'),
    };
  }

  if (pendingDialog.kind === 'deleteNote') {
    return {
      open: true,
      title: t('notes.dialogs.deleteNote.title'),
      description: t('notes.dialogs.deleteNote.description', {
        title: resolveDialogNoteTitle(pendingDialog, notes, trashedNotes, t),
      }),
      confirmLabel: t('notes.dialogs.deleteNote.confirm'),
    };
  }

  return {
    open: true,
    title: t('notes.dialogs.deleteFolder.title'),
    description: t('notes.dialogs.deleteFolder.description', {
      name: resolveDialogFolderName(pendingDialog, folders, t),
    }),
    confirmLabel: t('notes.dialogs.deleteFolder.confirm'),
  };
}
