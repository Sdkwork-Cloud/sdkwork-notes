import type { NoteRemoteApplyConflict } from './note-remote-apply-conflict';

export interface NoteRemoteApplyResult {
  outcome: string;
  taskId: string;
  remoteCursor?: string | null;
  appliedAt?: string;
  conflict?: NoteRemoteApplyConflict;
}
