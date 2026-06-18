import type { NotesWorkspacePageCommand } from './noteWorkspacePageActions';

export interface NotesWorkspaceHotkeyRuntimeResolveOptions {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  isCommandPaletteOpen: boolean;
  isSearchFocused: boolean;
}

export interface NotesWorkspaceHotkeyRuntimeDependencies {
  isCommandPaletteOpen: boolean;
  isSearchFocused: () => boolean;
  resolveCommand: (
    options: NotesWorkspaceHotkeyRuntimeResolveOptions,
  ) => NotesWorkspacePageCommand | null;
  executeCommand: (command: NotesWorkspacePageCommand) => Promise<void>;
  bindKeydown: (handler: (event: KeyboardEvent) => void) => () => void;
}

export function bindNotesWorkspaceHotkeys(
  dependencies: NotesWorkspaceHotkeyRuntimeDependencies,
) {
  return dependencies.bindKeydown((event) => {
    const command = dependencies.resolveCommand({
      key: event.key,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      isCommandPaletteOpen: dependencies.isCommandPaletteOpen,
      isSearchFocused: dependencies.isSearchFocused(),
    });

    if (!command) {
      return;
    }

    event.preventDefault();
    void dependencies.executeCommand(command);
  });
}
