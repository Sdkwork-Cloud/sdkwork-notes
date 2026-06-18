// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ShellLayout } from './ShellLayout';

vi.mock('@sdkwork/notes-pc-i18n', () => ({
  useNotesTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./AppHeader', () => ({
  AppHeader: ({ mode }: { mode?: 'default' | 'auth' }) => (
    <div data-mode={mode ?? 'default'} data-testid="app-header" />
  ),
}));

describe('ShellLayout', () => {
  afterEach(() => {
    cleanup();
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
    const header = screen.getByTestId('app-header');

    expect(root).toHaveClass('relative', 'flex', 'h-screen', 'flex-col', 'overflow-hidden');
    expect(content).toBeInTheDocument();
    expect(header).toHaveAttribute('data-mode', 'default');
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
    const header = screen.getByTestId('app-header');

    expect(root).toHaveClass('relative', 'flex', 'h-screen', 'flex-col', 'overflow-hidden');
    expect(content).toBeInTheDocument();
    expect(header).toHaveAttribute('data-mode', 'auth');
  });
});
