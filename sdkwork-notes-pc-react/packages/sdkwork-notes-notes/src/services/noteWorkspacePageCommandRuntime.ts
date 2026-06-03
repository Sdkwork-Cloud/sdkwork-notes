import type { NoteWorkspaceCommandPaletteAction } from './noteWorkspaceCommandPaletteModel';
import {
  resolveNotesWorkspaceCommandPaletteCommand,
  resolveNotesWorkspaceDialogConfirmCommand,
  type NotesWorkspacePageCommand,
  type NoteWorkspacePendingDialog,
} from './noteWorkspacePageActions';
import {
  createNotesWorkspacePageCommandDependencies,
  type NotesWorkspacePageCommandFactoryDependencies,
} from './noteWorkspacePageCommandDependencies';
import { executeNotesWorkspacePageCommand } from './noteWorkspacePageCommandExecutor';

export interface NotesWorkspacePageCommandRuntime {
  execute(command: NotesWorkspacePageCommand): Promise<void>;
  executeCommandPaletteAction(action: NoteWorkspaceCommandPaletteAction): Promise<void>;
  executeDialogConfirm(dialog: NoteWorkspacePendingDialog): Promise<void>;
}

export function createNotesWorkspacePageCommandRuntime(
  dependencies: NotesWorkspacePageCommandFactoryDependencies,
): NotesWorkspacePageCommandRuntime {
  const executorDependencies = createNotesWorkspacePageCommandDependencies(dependencies);

  const execute = async (command: NotesWorkspacePageCommand) => {
    await executeNotesWorkspacePageCommand(command, executorDependencies);
  };

  return {
    execute,
    async executeCommandPaletteAction(action) {
      await execute(resolveNotesWorkspaceCommandPaletteCommand(action));
    },
    async executeDialogConfirm(dialog) {
      await execute(resolveNotesWorkspaceDialogConfirmCommand(dialog));
    },
  };
}
