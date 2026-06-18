import { AppRoot } from '@sdkwork/notes-pc-shell';
import { appNoteSyncService } from '@sdkwork/notes-pc-core';

export default function App() {
  return (
    <AppRoot
      notesWorkspaceBootstrapOptions={{
        apply: (request) => appNoteSyncService.remoteApply(request),
      }}
    />
  );
}
