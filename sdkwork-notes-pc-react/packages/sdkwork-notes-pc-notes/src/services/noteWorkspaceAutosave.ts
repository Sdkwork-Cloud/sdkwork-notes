import type { NoteSaveState } from '../types/notesWorkspace';

export const NOTES_WORKSPACE_AUTOSAVE_DELAY_MS = 700;

export interface NotesWorkspaceAutosavePlan {
  shouldSchedule: boolean;
  shouldFlush: boolean;
  shouldFlushOnPageHide: boolean;
  delayMs: number | null;
}

export interface NotesWorkspaceAutosavePlanInput {
  activeNoteId?: string | null;
  activeNoteDeletedAt?: string | number | undefined;
  saveState: NoteSaveState;
}

function hasActiveLiveNote(input: NotesWorkspaceAutosavePlanInput) {
  return Boolean(input.activeNoteId) && !input.activeNoteDeletedAt;
}

function shouldScheduleAutosave(input: NotesWorkspaceAutosavePlanInput) {
  return hasActiveLiveNote(input) && input.saveState === 'dirty';
}

function shouldFlushAutosave(input: NotesWorkspaceAutosavePlanInput) {
  return hasActiveLiveNote(input) && (input.saveState === 'dirty' || input.saveState === 'error');
}

export function createNotesWorkspaceAutosavePlan(
  input: NotesWorkspaceAutosavePlanInput,
): NotesWorkspaceAutosavePlan {
  const shouldSchedule = shouldScheduleAutosave(input);
  const shouldFlush = shouldFlushAutosave(input);

  return {
    shouldSchedule,
    shouldFlush,
    shouldFlushOnPageHide: shouldFlush,
    delayMs: shouldSchedule ? NOTES_WORKSPACE_AUTOSAVE_DELAY_MS : null,
  };
}
