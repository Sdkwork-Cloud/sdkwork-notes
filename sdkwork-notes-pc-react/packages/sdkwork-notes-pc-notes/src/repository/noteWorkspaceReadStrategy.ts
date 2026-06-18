import type {
  NoteFolder,
  NoteSummary,
  PageRequest,
  ServiceResult,
} from '@sdkwork/notes-pc-types';
import type {
  NoteWorkspaceDataSource,
  NoteWorkspaceSnapshot,
} from '../types/notesWorkspace';

export interface NoteWorkspaceReadStrategyDependencies {
  listActiveNoteSummaries(): Promise<NoteSummary[]>;
  listDeletedNoteSummaries(keyword?: string): Promise<NoteSummary[]>;
  getFolders(): Promise<ServiceResult<NoteFolder[]>>;
  createDataSource?(): NoteWorkspaceDataSource;
}

export interface NoteWorkspaceReadStrategy {
  key: NoteWorkspaceDataSource['readStrategy'];
  loadWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>>;
}

function normalizeString(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}

function resultSuccess<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
  };
}

function resultError<T>(message: string): ServiceResult<T> {
  return {
    success: false,
    message,
  };
}

function createRemoteWorkspaceDataSourceFallback(): NoteWorkspaceDataSource {
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

class WorkspaceSnapshotReadStrategy implements NoteWorkspaceReadStrategy {
  readonly key = 'workspace-snapshot' as const;

  constructor(private readonly dependencies: NoteWorkspaceReadStrategyDependencies) {}

  async loadWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>> {
    try {
      const keyword = normalizeString(pageRequest?.keyword) || undefined;
      const [notes, trashedNotes, foldersResult] = await Promise.all([
        this.dependencies.listActiveNoteSummaries(),
        this.dependencies.listDeletedNoteSummaries(keyword),
        this.dependencies.getFolders(),
      ]);

      if (!foldersResult.success) {
        return resultError(foldersResult.message || 'Failed to query folders');
      }

      return resultSuccess({
        notes,
        trashedNotes,
        folders: foldersResult.data || [],
        dataSource: this.dependencies.createDataSource?.() ?? createRemoteWorkspaceDataSourceFallback(),
      });
    } catch (error) {
      return resultError(toErrorMessage(error, 'Failed to query workspace snapshot'));
    }
  }
}

export function createWorkspaceSnapshotReadStrategy(
  dependencies: NoteWorkspaceReadStrategyDependencies,
): NoteWorkspaceReadStrategy {
  return new WorkspaceSnapshotReadStrategy(dependencies);
}
