import type { NotesTelemetryEvent, NotesTelemetrySink } from '@sdkwork/notes-observability';

export const DEFAULT_NOTES_WORKSPACE_SAVE_RETRY_DELAYS_MS = [500, 1500] as const;

export interface NotesWorkspaceSaveRetryScheduledInput {
  noteId: string;
  retryAttempt: number;
  retryDelayMs: number;
  maxRetryCount: number;
  errorMessage?: string;
}

export interface NotesWorkspaceSaveRetryRecoveredInput {
  noteId: string;
  retryAttempt: number;
  maxRetryCount: number;
}

export interface NotesWorkspaceSaveRetryExhaustedInput {
  noteId: string;
  retryAttempt: number;
  maxRetryCount: number;
  errorMessage?: string;
}

export interface NotesWorkspaceSaveRetryPolicy {
  retryDelaysMs: readonly number[];
  getMaximumRetryCount(): number;
  resolveNextRetryDelay(retryAttempt: number): number | null;
  recordRetryScheduled(input: NotesWorkspaceSaveRetryScheduledInput): Promise<void>;
  recordRetryRecovered(input: NotesWorkspaceSaveRetryRecoveredInput): Promise<void>;
  recordRetryExhausted(input: NotesWorkspaceSaveRetryExhaustedInput): Promise<void>;
}

export interface CreateNotesWorkspaceSaveRetryPolicyOptions {
  retryDelaysMs?: readonly number[];
  telemetrySink?: NotesTelemetrySink | null;
}

function normalizeRetryDelays(retryDelaysMs: readonly number[] | undefined) {
  const candidateDelays = retryDelaysMs ?? DEFAULT_NOTES_WORKSPACE_SAVE_RETRY_DELAYS_MS;

  return Object.freeze(
    candidateDelays
      .filter((delayMs) => Number.isFinite(delayMs) && delayMs > 0)
      .map((delayMs) => Math.trunc(delayMs)),
  );
}

function buildRetryTelemetryEvent(
  name: NotesTelemetryEvent['name'],
  level: NotesTelemetryEvent['level'],
  attributes: NotesTelemetryEvent['attributes'],
): NotesTelemetryEvent {
  return {
    name,
    level,
    attributes,
  };
}

async function recordRetryTelemetryEvent(
  telemetrySink: NotesTelemetrySink | null | undefined,
  event: NotesTelemetryEvent,
) {
  if (!telemetrySink) {
    return;
  }

  await telemetrySink.record(event);
}

export function createNotesWorkspaceSaveRetryPolicy(
  options: CreateNotesWorkspaceSaveRetryPolicyOptions = {},
): NotesWorkspaceSaveRetryPolicy {
  const retryDelaysMs = normalizeRetryDelays(options.retryDelaysMs);
  const telemetrySink = options.telemetrySink ?? null;

  return {
    retryDelaysMs,
    getMaximumRetryCount() {
      return retryDelaysMs.length;
    },
    resolveNextRetryDelay(retryAttempt) {
      if (!Number.isInteger(retryAttempt) || retryAttempt < 1) {
        return null;
      }

      return retryDelaysMs[retryAttempt - 1] ?? null;
    },
    async recordRetryScheduled(input) {
      await recordRetryTelemetryEvent(
        telemetrySink,
        buildRetryTelemetryEvent('notes.workspace.save.retry.scheduled', 'warn', {
          noteId: input.noteId,
          retryAttempt: input.retryAttempt,
          retryDelayMs: input.retryDelayMs,
          maxRetryCount: input.maxRetryCount,
          ...(input.errorMessage ? { errorMessage: input.errorMessage } : {}),
        }),
      );
    },
    async recordRetryRecovered(input) {
      await recordRetryTelemetryEvent(
        telemetrySink,
        buildRetryTelemetryEvent('notes.workspace.save.retry.recovered', 'info', {
          noteId: input.noteId,
          retryAttempt: input.retryAttempt,
          maxRetryCount: input.maxRetryCount,
        }),
      );
    },
    async recordRetryExhausted(input) {
      await recordRetryTelemetryEvent(
        telemetrySink,
        buildRetryTelemetryEvent('notes.workspace.save.retry.exhausted', 'error', {
          noteId: input.noteId,
          retryAttempt: input.retryAttempt,
          maxRetryCount: input.maxRetryCount,
          ...(input.errorMessage ? { errorMessage: input.errorMessage } : {}),
        }),
      );
    },
  };
}
