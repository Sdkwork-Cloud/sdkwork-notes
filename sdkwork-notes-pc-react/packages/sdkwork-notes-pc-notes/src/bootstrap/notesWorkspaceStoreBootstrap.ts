import {
  createBrowserNotesSyncQueueStore,
  type NotesSyncQueueStore,
  type NotesSyncRemoteApplyRequest,
  type NotesSyncTask,
  type NotesSyncTaskExecutionResult,
} from '@sdkwork/notes-pc-sync';
import {
  createNotesWorkspaceSyncRuntime,
  type NotesWorkspaceSyncRuntime,
} from '../services';
import {
  configureNotesWorkspaceStore,
  resetNotesWorkspaceStore,
  type NotesWorkspaceStore,
} from '../store';

export interface NotesWorkspaceStoreBootstrapOptions {
  syncQueueStore?: NotesSyncQueueStore;
  syncRuntime?: NotesWorkspaceSyncRuntime;
  apply?(
    request: NotesSyncRemoteApplyRequest,
  ): Promise<NotesSyncTaskExecutionResult> | NotesSyncTaskExecutionResult;
  execute?(
    task: NotesSyncTask,
  ): Promise<NotesSyncTaskExecutionResult> | NotesSyncTaskExecutionResult;
}

const bootstrapState = {
  syncQueueStore: null as NotesSyncQueueStore | null,
  syncRuntime: null as NotesWorkspaceSyncRuntime | null,
};

function disposeActiveSyncRuntime(nextRuntime: NotesWorkspaceSyncRuntime | null = null) {
  const activeRuntime = bootstrapState.syncRuntime;
  if (activeRuntime && activeRuntime !== nextRuntime) {
    activeRuntime.dispose();
  }
}

function resolveSyncQueueStore(options: NotesWorkspaceStoreBootstrapOptions) {
  return options.syncQueueStore ?? bootstrapState.syncQueueStore ?? createBrowserNotesSyncQueueStore();
}

function resolveSyncRuntime(
  options: NotesWorkspaceStoreBootstrapOptions,
  syncQueueStore: NotesSyncQueueStore,
) {
  if (options.syncRuntime) {
    return options.syncRuntime;
  }

  if (options.execute) {
    return createNotesWorkspaceSyncRuntime({
      queueStore: syncQueueStore,
      execute: options.execute,
    });
  }

  if (options.apply) {
    return createNotesWorkspaceSyncRuntime({
      queueStore: syncQueueStore,
      apply: options.apply,
    });
  }

  if (
    options.syncQueueStore === undefined
    || options.syncQueueStore === bootstrapState.syncQueueStore
  ) {
    return bootstrapState.syncRuntime;
  }

  return null;
}

export function bootstrapNotesWorkspaceStore(
  options: NotesWorkspaceStoreBootstrapOptions = {},
): NotesWorkspaceStore {
  const syncQueueStore = resolveSyncQueueStore(options);
  const syncRuntime = resolveSyncRuntime(options, syncQueueStore);

  disposeActiveSyncRuntime(syncRuntime);
  bootstrapState.syncQueueStore = syncQueueStore;
  bootstrapState.syncRuntime = syncRuntime;

  return configureNotesWorkspaceStore({
    syncQueueStore,
    ...(syncRuntime ? { syncRuntime } : {}),
  });
}

export function resetNotesWorkspaceStoreBootstrap(): NotesWorkspaceStore {
  disposeActiveSyncRuntime();
  bootstrapState.syncQueueStore = null;
  bootstrapState.syncRuntime = null;
  return resetNotesWorkspaceStore();
}
