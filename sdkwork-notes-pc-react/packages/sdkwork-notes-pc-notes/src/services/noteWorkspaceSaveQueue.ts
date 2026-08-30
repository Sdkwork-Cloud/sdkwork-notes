import type { Note, NoteSummary } from '@sdkwork/notes-pc-types-commons';
import type { NoteSaveState } from '../types/notesWorkspace';

export interface NotesWorkspaceSaveQueue {
  hasActiveRequest(): boolean;
  waitForActiveRequest(): Promise<boolean>;
  requestReplay(): Promise<boolean>;
  run(save: () => Promise<boolean>): Promise<boolean>;
}

export interface NotesWorkspaceSaveCompletionInput {
  currentActiveNote: Note | null;
  requestedActiveNote: Note;
  savedSummary: NoteSummary;
  successSaveState: NoteSaveState;
  mergeSummaryIntoNote: (note: Note, summary: NoteSummary) => Note;
}

export interface NotesWorkspaceSaveCompletion {
  persistedActiveNote: Note;
  activeNote: Note | null;
  saveState: NoteSaveState;
}

function areStringArraysEqual(left: string[] | undefined, right: string[] | undefined) {
  const normalizedLeft = Array.isArray(left) ? left : [];
  const normalizedRight = Array.isArray(right) ? right : [];
  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function areNotesWorkspaceSaveSnapshotsEqual(left: Note | null, right: Note | null) {
  if (!left || !right) {
    return left === right;
  }

  return left.id === right.id
    && left.title === right.title
    && left.content === right.content
    && left.type === right.type
    && left.parentId === right.parentId
    && left.isFavorite === right.isFavorite
    && left.publishStatus === right.publishStatus
    && areStringArraysEqual(left.tags, right.tags);
}

export function createNotesWorkspaceSaveQueue(): NotesWorkspaceSaveQueue {
  let activeRequest: Promise<boolean> | null = null;
  let replayRequested = false;

  return {
    hasActiveRequest() {
      return activeRequest !== null;
    },
    waitForActiveRequest() {
      return activeRequest ?? Promise.resolve(true);
    },
    requestReplay() {
      if (!activeRequest) {
        return Promise.resolve(true);
      }

      replayRequested = true;
      return activeRequest;
    },
    run(save) {
      if (activeRequest) {
        replayRequested = true;
        return activeRequest;
      }

      activeRequest = (async () => {
        let lastResult = false;

        do {
          replayRequested = false;
          lastResult = await save();
        } while (lastResult && replayRequested);

        return lastResult;
      })().finally(() => {
        activeRequest = null;
        replayRequested = false;
      });

      return activeRequest;
    },
  };
}

export function resolveNotesWorkspaceSaveCompletion(
  input: NotesWorkspaceSaveCompletionInput,
): NotesWorkspaceSaveCompletion {
  const persistedActiveNote = input.mergeSummaryIntoNote(input.requestedActiveNote, input.savedSummary);
  const hasNewerDraftEdits =
    input.currentActiveNote?.id === input.requestedActiveNote.id
    && !areNotesWorkspaceSaveSnapshotsEqual(input.currentActiveNote, input.requestedActiveNote);

  if (hasNewerDraftEdits) {
    return {
      persistedActiveNote,
      activeNote: input.currentActiveNote,
      saveState: 'dirty',
    };
  }

  if (input.currentActiveNote?.id === input.requestedActiveNote.id) {
    return {
      persistedActiveNote,
      activeNote: persistedActiveNote,
      saveState: input.successSaveState,
    };
  }

  return {
    persistedActiveNote,
    activeNote: input.currentActiveNote,
    saveState: input.successSaveState,
  };
}
