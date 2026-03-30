// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '@sdkwork/notes-core';
import { ShellLayout } from './ShellLayout';

vi.mock('@sdkwork/notes-i18n', () => ({
  useNotesTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./DesktopWindowControls', () => ({
  DesktopWindowControls: () => <div data-testid="desktop-window-controls" />,
}));

describe('ShellLayout', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
    useAuthStore.getState().reset();
  });

  it('uses a fixed-height desktop shell with shared background chrome and a custom header', () => {
    const { container } = render(
      <MemoryRouter>
        <ShellLayout>
          <div data-testid="shell-content">content</div>
        </ShellLayout>
      </MemoryRouter>,
    );

    const root = container.firstElementChild as HTMLElement | null;
    const content = screen.getByTestId('shell-content');
    const headerControls = screen.getByTestId('desktop-window-controls');

    expect(root).toHaveClass('relative', 'flex', 'h-screen', 'flex-col', 'overflow-hidden');
    expect(content).toBeInTheDocument();
    expect(headerControls).toBeInTheDocument();
  });

  it('passes auth mode through to the shared shell without owning the page viewport', () => {
    const { container } = render(
      <MemoryRouter>
        <ShellLayout mode="auth">
          <div data-testid="auth-content">auth</div>
        </ShellLayout>
      </MemoryRouter>,
    );

    const root = container.firstElementChild as HTMLElement | null;
    const content = screen.getByTestId('auth-content');

    expect(root).toHaveClass('relative', 'flex', 'h-screen', 'flex-col', 'overflow-hidden');
    expect(content).toBeInTheDocument();
  });
});
