import type { NoteSaveState } from '../types/notesWorkspace';

export interface NotesWorkspaceSaveFeedbackInput {
  saveState: NoteSaveState;
  errorMessage: string | null;
}

export interface NotesWorkspaceSaveFeedbackModel {
  statusKey: `notes.editor.status.${NoteSaveState}`;
  canManualSave: boolean;
  isBusy: boolean;
  bannerMessage: string | null;
  retryAvailable: boolean;
}

export function resolveNotesWorkspaceSaveRequestState(saveState: NoteSaveState): NoteSaveState {
  return saveState === 'error' ? 'retrying' : 'saving';
}

export function resolveNotesWorkspaceSaveSuccessState(saveState: NoteSaveState): NoteSaveState {
  return saveState === 'retrying' || saveState === 'error' ? 'recovered' : 'saved';
}

export function buildNotesWorkspaceSaveFeedbackModel(
  input: NotesWorkspaceSaveFeedbackInput,
): NotesWorkspaceSaveFeedbackModel {
  const retryAvailable = input.saveState === 'error';

  return {
    statusKey: `notes.editor.status.${input.saveState}`,
    canManualSave: input.saveState === 'dirty' || retryAvailable,
    isBusy: input.saveState === 'saving' || input.saveState === 'retrying',
    bannerMessage: input.errorMessage,
    retryAvailable,
  };
}
