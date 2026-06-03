import type { Note } from '@sdkwork/notes-types';
import type { NotesCollectionView } from '../types/notesWorkspace';

export interface NotesWorkspaceCreateNoteRuntimeDependencies {
  selectedFolderId: string | null;
  resolveDefaultTitle: (noteType: Note['type']) => string;
  createNote: (input: {
    type: Note['type'];
    title: string;
    parentId: string | null;
  }) => Promise<string>;
  runTransition: (action: () => void) => void;
  setActiveView: (view: NotesCollectionView) => void;
}

export function createNotesWorkspaceCreateNoteRuntime(
  dependencies: NotesWorkspaceCreateNoteRuntimeDependencies,
) {
  const {
    selectedFolderId,
    resolveDefaultTitle,
    createNote,
    runTransition,
    setActiveView,
  } = dependencies;

  return {
    async createNote(noteType: Note['type']) {
      const createdId = await createNote({
        type: noteType,
        title: resolveDefaultTitle(noteType),
        parentId: selectedFolderId,
      });

      if (!createdId) {
        return;
      }

      runTransition(() => {
        setActiveView('all');
      });
    },
  };
}
