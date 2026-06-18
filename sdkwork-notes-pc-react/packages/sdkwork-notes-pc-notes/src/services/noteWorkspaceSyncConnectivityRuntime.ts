export interface NotesWorkspaceSyncConnectivityRuntimeDependencies {
  bindOnline: (handler: () => void) => () => void;
  bindOffline: (handler: () => void) => () => void;
  isOnline: () => boolean;
  requestSyncDrain: () => Promise<boolean> | boolean;
}

export function bindNotesWorkspaceSyncConnectivityRuntime(
  dependencies: NotesWorkspaceSyncConnectivityRuntimeDependencies,
) {
  let lastKnownOnline = dependencies.isOnline();

  const cleanupOnline = dependencies.bindOnline(() => {
    const currentlyOnline = dependencies.isOnline();
    if (!currentlyOnline) {
      lastKnownOnline = false;
      return;
    }

    if (lastKnownOnline) {
      return;
    }

    lastKnownOnline = true;
    void dependencies.requestSyncDrain();
  });

  const cleanupOffline = dependencies.bindOffline(() => {
    lastKnownOnline = false;
  });

  return () => {
    cleanupOnline();
    cleanupOffline();
  };
}
