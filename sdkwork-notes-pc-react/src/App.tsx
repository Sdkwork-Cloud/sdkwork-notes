import { AppRoot } from '@sdkwork/notes-shell';
import { appNoteSyncService } from '@sdkwork/notes-core';

export default function App() {
  return (
    <AppRoot
      notesWorkspaceBootstrapOptions={{
        apply: (request) => appNoteSyncService.remoteApply(request),
      }}
    />
  );
}
