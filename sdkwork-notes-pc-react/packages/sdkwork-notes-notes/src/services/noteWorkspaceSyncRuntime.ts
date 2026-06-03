import {
  createNotesSyncRemoteApplyExecutor,
  createNotesSyncWorkerRuntime,
  type NotesSyncQueueStore,
  type NotesSyncRemoteApplyRequest,
  type NotesSyncRetryPolicy,
  type NotesSyncTask,
  type NotesSyncTaskExecutionResult,
  type NotesSyncWorkerScheduler,
} from '@sdkwork/notes-sync';

export interface NotesWorkspaceSyncRuntime {
  requestDrain(): Promise<void>;
  dispose(): void;
}

interface CreateNotesWorkspaceSyncRuntimeOptionsBase {
  queueStore: NotesSyncQueueStore;
  retryPolicy?: NotesSyncRetryPolicy;
  now?: () => string;
  scheduler?: NotesSyncWorkerScheduler;
}

interface CreateNotesWorkspaceSyncRuntimeWithExecuteOptions
  extends CreateNotesWorkspaceSyncRuntimeOptionsBase {
  execute(
    task: NotesSyncTask,
  ): Promise<NotesSyncTaskExecutionResult> | NotesSyncTaskExecutionResult;
}

interface CreateNotesWorkspaceSyncRuntimeWithApplyOptions
  extends CreateNotesWorkspaceSyncRuntimeOptionsBase {
  apply(
    request: NotesSyncRemoteApplyRequest,
  ): Promise<NotesSyncTaskExecutionResult> | NotesSyncTaskExecutionResult;
}

export type CreateNotesWorkspaceSyncRuntimeOptions =
  | CreateNotesWorkspaceSyncRuntimeWithExecuteOptions
  | CreateNotesWorkspaceSyncRuntimeWithApplyOptions;

function resolveNotesWorkspaceSyncExecute(
  options: CreateNotesWorkspaceSyncRuntimeOptions,
) {
  if ('execute' in options) {
    return options.execute;
  }

  return createNotesSyncRemoteApplyExecutor({
    apply: options.apply,
  });
}

export function createNotesWorkspaceSyncRuntime(
  options: CreateNotesWorkspaceSyncRuntimeOptions,
): NotesWorkspaceSyncRuntime {
  return createNotesSyncWorkerRuntime({
    queueStore: options.queueStore,
    execute: resolveNotesWorkspaceSyncExecute(options),
    retryPolicy: options.retryPolicy,
    now: options.now,
    scheduler: options.scheduler,
  });
}
