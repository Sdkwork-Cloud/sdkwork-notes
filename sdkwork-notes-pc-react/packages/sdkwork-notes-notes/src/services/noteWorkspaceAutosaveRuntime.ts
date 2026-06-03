import type { NotesWorkspaceAutosavePlan } from './noteWorkspaceAutosave';

export interface NotesWorkspaceAutosaveSchedulerDependencies {
  scheduleTimeout: (delayMs: number, callback: () => void) => () => void;
  flushDraft: () => void;
}

export interface NotesWorkspaceAutosavePageHideDependencies {
  bindPageHide: (callback: () => void) => () => void;
  captureRecoverySnapshot?: () => void;
  flushDraft: () => void;
}

export interface NotesWorkspaceAutosaveVisibilityDependencies {
  bindVisibilityChange: (callback: () => void) => () => void;
  isDocumentHidden: () => boolean;
  captureRecoverySnapshot?: () => void;
  flushDraft: () => void;
}

function createNoopCleanup() {
  return () => {};
}

export function scheduleNotesWorkspaceAutosave(
  plan: NotesWorkspaceAutosavePlan,
  dependencies: NotesWorkspaceAutosaveSchedulerDependencies,
) {
  if (!plan.shouldSchedule || plan.delayMs === null) {
    return createNoopCleanup();
  }

  return dependencies.scheduleTimeout(plan.delayMs, dependencies.flushDraft);
}

export function bindNotesWorkspacePageHideAutosave(
  plan: NotesWorkspaceAutosavePlan,
  dependencies: NotesWorkspaceAutosavePageHideDependencies,
) {
  if (!plan.shouldFlushOnPageHide) {
    return createNoopCleanup();
  }

  return dependencies.bindPageHide(() => {
    dependencies.captureRecoverySnapshot?.();
    dependencies.flushDraft();
  });
}

export function bindNotesWorkspaceVisibilityAutosave(
  plan: NotesWorkspaceAutosavePlan,
  dependencies: NotesWorkspaceAutosaveVisibilityDependencies,
) {
  if (!plan.shouldFlushOnPageHide) {
    return createNoopCleanup();
  }

  return dependencies.bindVisibilityChange(() => {
    if (!dependencies.isDocumentHidden()) {
      return;
    }

    dependencies.captureRecoverySnapshot?.();
    dependencies.flushDraft();
  });
}
