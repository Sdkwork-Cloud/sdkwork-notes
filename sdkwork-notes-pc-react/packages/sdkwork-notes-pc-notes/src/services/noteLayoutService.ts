const SIDEBAR_WIDTH_STORAGE_KEY = 'sdkwork-notes-sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = 300;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 420;

function normalizeSidebarWidth(value: number) {
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, value));
}

export const noteLayoutService = {
  getSidebarWidth(fallback = DEFAULT_SIDEBAR_WIDTH) {
    if (typeof window === 'undefined') {
      return normalizeSidebarWidth(fallback);
    }

    try {
      const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        return normalizeSidebarWidth(fallback);
      }
      return normalizeSidebarWidth(parsed);
    } catch {
      return normalizeSidebarWidth(fallback);
    }
  },
  saveSidebarWidth(value: number) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(normalizeSidebarWidth(value)));
    } catch {
      // ignore storage failures
    }
  },
};
