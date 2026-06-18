import type { Note, NoteFolder, NoteSummary } from '@sdkwork/notes-pc-types';

export type NotesCollectionView = 'all' | 'favorites' | 'recent' | 'trash';
export type NoteSaveState =
  | 'idle'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'error'
  | 'retrying'
  | 'recovered';
export type NoteWorkspaceReadStrategyKey =
  | 'workspace-snapshot'
  | 'read-through-cache'
  | 'replica-snapshot'
  | 'queued-sync-snapshot';

export interface NoteWorkspaceDataSourceCapabilities {
  localReplica: boolean;
  readThroughCache: boolean;
  offlineRead: boolean;
  offlineWrite: boolean;
  backgroundSync: boolean;
  incrementalSync: boolean;
  conflictResolution: boolean;
}

export interface NoteWorkspaceDataSource {
  driver: 'app-sdk';
  authority: 'remote';
  readStrategy: NoteWorkspaceReadStrategyKey;
  writeStrategy: 'direct-write';
  capabilities: NoteWorkspaceDataSourceCapabilities;
}

export interface NoteWorkspaceSnapshot {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
  dataSource: NoteWorkspaceDataSource;
}

export interface CreateNoteInput {
  title?: string;
  type?: Note['type'];
  parentId?: string | null;
  content?: string;
  tags?: string[];
}

export function createRemoteAppSdkNoteWorkspaceDataSource(): NoteWorkspaceDataSource {
  return {
    driver: 'app-sdk',
    authority: 'remote',
    readStrategy: 'workspace-snapshot',
    writeStrategy: 'direct-write',
    capabilities: {
      localReplica: false,
      readThroughCache: false,
      offlineRead: false,
      offlineWrite: false,
      backgroundSync: false,
      incrementalSync: false,
      conflictResolution: false,
    },
  };
}

export function createEmptyNoteWorkspaceSnapshot(
  overrides: Partial<NoteWorkspaceSnapshot> = {},
): NoteWorkspaceSnapshot {
  return {
    notes: [],
    trashedNotes: [],
    folders: [],
    dataSource: createRemoteAppSdkNoteWorkspaceDataSource(),
    ...overrides,
  };
}
