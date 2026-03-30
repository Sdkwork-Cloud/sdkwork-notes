import type { Note, NoteFolder, NoteSummary } from '@sdkwork/notes-types';

export type NotesCollectionView = 'all' | 'favorites' | 'recent' | 'trash';
export type NoteSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface NoteWorkspaceSnapshot {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
}

export interface CreateNoteInput {
  title?: string;
  type?: Note['type'];
  parentId?: string | null;
  content?: string;
  tags?: string[];
}
