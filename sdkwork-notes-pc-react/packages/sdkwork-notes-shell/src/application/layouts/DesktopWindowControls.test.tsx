// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopWindowControls } from './DesktopWindowControls';

vi.mock('@sdkwork/notes-i18n', () => ({
  useNotesTranslation: () => ({
    t: (key: string) => key,
  }),
}));

interface MockDesktopWindowApi {
  minimizeWindow: ReturnType<typeof vi.fn>;
  maximizeWindow: ReturnType<typeof vi.fn>;
  restoreWindow: ReturnType<typeof vi.fn>;
  closeWindow: ReturnType<typeof vi.fn>;
  isWindowMaximized: ReturnType<typeof vi.fn>;
  subscribeWindowMaximized: ReturnType<typeof vi.fn>;
  emitMaximized: (value: boolean) => void;
}

function installDesktopWindowApi(initiallyMaximized = false): MockDesktopWindowApi {
  let listener: ((isMaximized: boolean) => void) | null = null;
  const api: MockDesktopWindowApi = {
    minimizeWindow: vi.fn(async () => undefined),
    maximizeWindow: vi.fn(async () => undefined),
    restoreWindow: vi.fn(async () => undefined),
    closeWindow: vi.fn(async () => undefined),
    isWindowMaximized: vi.fn(async () => initiallyMaximized),
    subscribeWindowMaximized: vi.fn(async (nextListener: (isMaximized: boolean) => void) => {
      listener = nextListener;
      return () => {
        listener = null;
      };
    }),
    emitMaximized(value: boolean) {
      listener?.(value);
    },
  };

  Object.defineProperty(window, '__NOTES_DESKTOP_API__', {
    configurable: true,
    value: {
      window: api,
    },
  });

  return api;
}

describe('DesktopWindowControls', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en-US';
    Object.defineProperty(window, '__NOTES_DESKTOP_API__', {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, '__NOTES_DESKTOP_API__', {
      configurable: true,
      value: undefined,
    });
  });

  it('stays hidden when the desktop bridge is unavailable', () => {
    const { container } = render(<DesktopWindowControls />);

    expect(container).toBeEmptyDOMElement();
  });

  it('routes custom title-bar buttons through the desktop bridge', async () => {
    const desktopWindowApi = installDesktopWindowApi(false);

    render(<DesktopWindowControls />);

    await waitFor(() => {
      expect(desktopWindowApi.isWindowMaximized).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Minimize window' }));
    fireEvent.click(screen.getByRole('button', { name: 'Maximize window' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hide to tray' }));

    expect(desktopWindowApi.minimizeWindow).toHaveBeenCalledTimes(1);
    expect(desktopWindowApi.maximizeWindow).toHaveBeenCalledTimes(1);
    expect(desktopWindowApi.closeWindow).toHaveBeenCalledTimes(1);

    await act(async () => {
      desktopWindowApi.emitMaximized(true);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Restore window' }));

    expect(desktopWindowApi.restoreWindow).toHaveBeenCalledTimes(1);
    expect(desktopWindowApi.subscribeWindowMaximized).toHaveBeenCalledTimes(1);
  });
});
