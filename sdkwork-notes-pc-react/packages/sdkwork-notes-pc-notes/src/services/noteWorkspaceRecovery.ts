import type { LocalDraftSnapshot } from '@sdkwork/notes-pc-local';
import type { Note, NoteSummary } from '@sdkwork/notes-pc-types';
import { normalizeString } from '@sdkwork/notes-pc-commons';

export interface NotesWorkspaceRecoveredDraft extends LocalDraftSnapshot {
  remoteTitle: string;
  remoteUpdatedAt: string;
}

function toTimestamp(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = normalizeString(value);
  if (!normalized) {
    return 0;
  }
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDraftTitle(draft: LocalDraftSnapshot, note: NoteSummary) {
  return normalizeString(draft.draft.title) || normalizeString(note.title);
}

export function resolveNotesWorkspaceRecoveredDrafts(input: {
  drafts: LocalDraftSnapshot[];
  notes: NoteSummary[];
  trashedNotes?: NoteSummary[];
}): NotesWorkspaceRecoveredDraft[] {
  const noteMap = new Map(
    input.notes.map((note) => [note.id, note] as const),
  );
  const trashedNoteIds = new Set(
    (input.trashedNotes ?? []).map((note) => note.id),
  );

  return input.drafts
    .filter((draft) => noteMap.has(draft.noteId) && !trashedNoteIds.has(draft.noteId))
    .map((draft) => {
      const note = noteMap.get(draft.noteId)!;
      return {
        ...draft,
        remoteTitle: note.title,
        remoteUpdatedAt: normalizeString(note.updatedAt),
        draft: {
          ...draft.draft,
          title: normalizeDraftTitle(draft, note),
        },
      };
    })
    .sort((left, right) => {
      const revisionDelta = right.revision - left.revision;
      if (revisionDelta !== 0) {
        return revisionDelta;
      }
      return toTimestamp(right.capturedAt) - toTimestamp(left.capturedAt);
    });
}

export function resolveActiveNotesWorkspaceRecoveredDraft(
  recoveredDrafts: NotesWorkspaceRecoveredDraft[],
  activeNoteId: string | null | undefined,
) {
  const normalizedNoteId = normalizeString(activeNoteId);
  if (!normalizedNoteId) {
    return null;
  }

  return recoveredDrafts.find((draft) => draft.noteId === normalizedNoteId) ?? null;
}

export function removeNotesWorkspaceRecoveredDraft(
  recoveredDrafts: NotesWorkspaceRecoveredDraft[],
  noteId: string | null | undefined,
) {
  const normalizedNoteId = normalizeString(noteId);
  if (!normalizedNoteId) {
    return recoveredDrafts;
  }

  return recoveredDrafts.filter((draft) => draft.noteId !== normalizedNoteId);
}

export function restoreNotesWorkspaceRecoveredDraft(
  activeNote: Note,
  recoveredDraft: NotesWorkspaceRecoveredDraft,
  restoredAt: string,
): Note {
  return {
    ...activeNote,
    title: recoveredDraft.draft.title,
    content: recoveredDraft.draft.content,
    type: recoveredDraft.draft.type,
    parentId: recoveredDraft.draft.parentId,
    tags: [...recoveredDraft.draft.tags],
    isFavorite: recoveredDraft.draft.isFavorite,
    publishStatus: recoveredDraft.draft.publishStatus,
    updatedAt: restoredAt,
  };
}
