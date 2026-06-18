export const NOTES_OBSERVABILITY_PACKAGE = '@sdkwork/notes-pc-observability';

export type NotesTelemetryLevel = 'info' | 'warn' | 'error';
export type NotesTelemetryValue = string | number | boolean;

export interface NotesTelemetryEvent {
  name: string;
  level: NotesTelemetryLevel;
  attributes?: Record<string, NotesTelemetryValue>;
}

export interface NotesTelemetrySink {
  record(event: NotesTelemetryEvent): void | Promise<void>;
}

export interface NotesLogger {
  info(message: string, attributes?: Record<string, NotesTelemetryValue>): void;
  warn(message: string, attributes?: Record<string, NotesTelemetryValue>): void;
  error(message: string, attributes?: Record<string, NotesTelemetryValue>): void;
}
