import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useAuthStore } from '@sdkwork/notes-core';
import { AppRoutes } from './AppRoutes';

vi.mock('@sdkwork/notes-i18n', () => ({
  ensureI18n: vi.fn(async () => undefined),
  useNotesTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn(async () => undefined),
    },
  }),
}));

vi.mock('@sdkwork/notes-auth', () => ({
  AuthPage: () => <div>Mock Auth Page</div>,
  AuthOAuthCallbackPage: () => <div>Mock OAuth Callback Page</div>,
}));

vi.mock('@sdkwork/notes-notes', () => ({
  NotesWorkspacePage: () => <div>Mock Notes Workspace</div>,
}));

vi.mock('@sdkwork/notes-user', () => ({
  AccountPage: () => <div>Mock Account Page</div>,
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>;
}

function renderRoutes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppRoutes />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('AppRoutes', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    useAuthStore.getState().reset();
  });

  it('renders the translated suspense fallback while lazy routes are resolving', () => {
    renderRoutes('/login');

    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('redirects unauthenticated notes routes to login and preserves redirect target', async () => {
    renderRoutes('/notes?view=favorites');

    await screen.findByText('Mock Auth Page');

    await waitFor(() => {
      expect(screen.getByTestId('location-probe')).toHaveTextContent(
        '/login?redirect=%2Fnotes%3Fview%3Dfavorites',
      );
    });
  });

  it('redirects the index route to notes for authenticated users', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        firstName: 'Notes',
        lastName: 'User',
        email: 'notes@example.com',
        displayName: 'Notes User',
        initials: 'NU',
      },
    });

    renderRoutes('/');

    await screen.findByText('Mock Notes Workspace');

    await waitFor(() => {
      expect(screen.getByTestId('location-probe')).toHaveTextContent('/notes');
    });
  });

  it('redirects authenticated login requests back to the notes workspace', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        firstName: 'Notes',
        lastName: 'User',
        email: 'notes@example.com',
        displayName: 'Notes User',
        initials: 'NU',
      },
    });

    renderRoutes('/login');

    await screen.findByText('Mock Notes Workspace');

    await waitFor(() => {
      expect(screen.getByTestId('location-probe')).toHaveTextContent('/notes');
    });
  });
});
