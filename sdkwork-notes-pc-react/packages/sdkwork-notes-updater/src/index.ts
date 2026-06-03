export const NOTES_UPDATER_PACKAGE = '@sdkwork/notes-updater';

export type NotesUpdateChannel = 'stable' | 'beta' | 'internal';

export interface NotesUpdateManifest {
  version: string;
  channel: NotesUpdateChannel;
  publishedAt: string;
  notes?: string;
}

export interface NotesUpdaterService {
  checkForUpdates(channel: NotesUpdateChannel): Promise<NotesUpdateManifest | null>;
  applyUpdate(version: string): Promise<void>;
}
