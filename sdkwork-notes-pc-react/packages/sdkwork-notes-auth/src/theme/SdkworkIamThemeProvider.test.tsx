// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SdkworkIamThemeProvider } from './SdkworkIamThemeProvider';

const matchMediaState = vi.hoisted(() => ({
  listeners: new Set<(event: MediaQueryListEvent) => void>(),
  matches: false,
}));

vi.mock('@sdkwork/ui-pc-react/theme', () => ({
  SdkworkThemeProvider: ({
    children,
    className,
    defaultTheme,
  }: {
    children: React.ReactNode;
    className?: string;
    defaultTheme?: string;
  }) => (
    <div
      data-class-name={className}
      data-default-theme={defaultTheme}
      data-testid="sdkwork-theme-provider"
    >
      {children}
    </div>
  ),
}));

describe('SdkworkIamThemeProvider', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    matchMediaState.matches = false;
    matchMediaState.listeners.clear();

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          matchMediaState.listeners.add(listener);
        },
        matches: matchMediaState.matches,
        media: '(prefers-color-scheme: dark)',
        removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          matchMediaState.listeners.delete(listener);
        },
      })),
    });
  });

  afterEach(() => {
    cleanup();
    document.documentElement.className = '';
  });

  it('passes the host color mode and merged class name into the shared sdkwork theme provider', () => {
    render(
      <SdkworkIamThemeProvider className="custom-auth-shell">
        <div>auth content</div>
      </SdkworkIamThemeProvider>,
    );

    expect(screen.getByTestId('sdkwork-theme-provider')).toHaveAttribute(
      'data-class-name',
      'notes-iam-theme custom-auth-shell',
    );
    expect(screen.getByTestId('sdkwork-theme-provider')).toHaveAttribute(
      'data-default-theme',
      'light',
    );
  });

  it('tracks host theme changes from the root dark class and remounts the shared theme provider with dark mode', async () => {
    render(
      <SdkworkIamThemeProvider>
        <div>auth content</div>
      </SdkworkIamThemeProvider>,
    );

    expect(screen.getByTestId('sdkwork-theme-provider')).toHaveAttribute(
      'data-default-theme',
      'light',
    );

    await act(async () => {
      document.documentElement.classList.add('dark');
    });

    await waitFor(() => {
      expect(screen.getByTestId('sdkwork-theme-provider')).toHaveAttribute(
        'data-default-theme',
        'dark',
      );
    });
  });
});
