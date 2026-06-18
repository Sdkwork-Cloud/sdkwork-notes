export interface NotesWorkspaceSidebarResizeRuntimeDependencies {
  startX: number;
  startWidth: number;
  setSidebarWidth: (width: number) => void;
  bindPointerMove: (handler: (event: { clientX: number }) => void) => () => void;
  bindPointerUp: (handler: () => void) => () => void;
}

function clampSidebarWidth(value: number) {
  return Math.max(220, Math.min(420, value));
}

export function startNotesWorkspaceSidebarResize(
  dependencies: NotesWorkspaceSidebarResizeRuntimeDependencies,
) {
  const { startX, startWidth, setSidebarWidth, bindPointerMove, bindPointerUp } = dependencies;
  let cleaned = false;
  let cleanupPointerMove = () => {};
  let cleanupPointerUp = () => {};

  const cleanup = () => {
    if (cleaned) {
      return;
    }

    cleaned = true;
    cleanupPointerMove();
    cleanupPointerUp();
  };

  cleanupPointerMove = bindPointerMove((event) => {
    const nextWidth = clampSidebarWidth(startWidth + (event.clientX - startX));
    setSidebarWidth(nextWidth);
  });
  cleanupPointerUp = bindPointerUp(() => {
    cleanup();
  });

  return cleanup;
}
