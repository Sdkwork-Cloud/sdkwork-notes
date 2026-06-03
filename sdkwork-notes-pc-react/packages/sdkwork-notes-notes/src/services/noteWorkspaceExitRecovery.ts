import type { Note } from '@sdkwork/notes-types';
import type { LocalDraftSnapshot, NotesLocalDraftSaveState, NotesLocalStore } from '@sdkwork/notes-local';
import type { NoteSaveState } from '../types/notesWorkspace';

export type NotesWorkspaceExitRecoveryTrigger = 'draft-change' | 'pagehide' | 'visibility-hidden';

export interface NotesWorkspaceExitRecoveryInput {
  activeNote: Note | null;
  saveState: NoteSaveState;
  trigger: NotesWorkspaceExitRecoveryTrigger;
}

function normalizeNoteId(noteId: string | null | undefined) {
  return typeof noteId === 'string' ? noteId.trim() : '';
}

function resolveRecoveryRevision(note: Note) {
  const timestamp = Date.parse(String(note.updatedAt));
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
}

function canCaptureExitRecoverySnapshot(input: NotesWorkspaceExitRecoveryInput) {
  return Boolean(input.activeNote && !input.activeNote.deletedAt)
    && (
      input.saveState === 'dirty'
      || input.saveState === 'saving'
      || input.saveState === 'error'
      || input.saveState === 'retrying'
    );
}

function resolveRecoverySaveState(saveState: NoteSaveState): NotesLocalDraftSaveState | null {
  return saveState === 'dirty'
    || saveState === 'saving'
    || saveState === 'error'
    || saveState === 'retrying'
    ? saveState
    : null;
}

export function buildNotesWorkspaceExitRecoverySnapshot(
  input: NotesWorkspaceExitRecoveryInput,
): LocalDraftSnapshot | null {
  const recoverySaveState = resolveRecoverySaveState(input.saveState);
  if (!canCaptureExitRecoverySnapshot(input) || !input.activeNote || !recoverySaveState) {
    return null;
  }

  return {
    noteId: input.activeNote.id,
    capturedAt: new Date().toISOString(),
    revision: resolveRecoveryRevision(input.activeNote),
    trigger: input.trigger,
    saveState: recoverySaveState,
    draft: {
      title: input.activeNote.title,
      content: input.activeNote.content,
      type: input.activeNote.type,
      parentId: input.activeNote.parentId ?? null,
      tags: Array.isArray(input.activeNote.tags) ? input.activeNote.tags : [],
      isFavorite: Boolean(input.activeNote.isFavorite),
      publishStatus: input.activeNote.publishStatus === 'archived' ? 'archived' : 'draft',
    },
  };
}

export async function captureNotesWorkspaceExitRecoverySnapshot(
  localStore: NotesLocalStore,
  input: NotesWorkspaceExitRecoveryInput,
) {
  const snapshot = buildNotesWorkspaceExitRecoverySnapshot(input);
  if (!snapshot) {
    return false;
  }

  await localStore.saveDraft(snapshot);
  return true;
}

export async function clearNotesWorkspaceExitRecoverySnapshot(
  localStore: NotesLocalStore,
  noteId: string | null | undefined,
) {
  const normalizedNoteId = normalizeNoteId(noteId);
  if (!normalizedNoteId) {
    return;
  }

  await localStore.clearDraft(normalizedNoteId);
}
