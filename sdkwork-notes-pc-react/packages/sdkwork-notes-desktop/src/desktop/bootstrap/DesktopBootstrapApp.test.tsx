// @vitest-environment jsdom

import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopBootstrapApp } from './DesktopBootstrapApp';

const shellMocks = vi.hoisted(() => ({
  appRoot: vi.fn((_props: unknown) => <div data-testid="notes-app-root">notes-app-root</div>),
}));

const runtimeMocks = vi.hoisted(() => ({
  showWindow: vi.fn(async () => {}),
  focusWindow: vi.fn(async () => {}),
  getDesktopWindow: vi.fn(),
  isTauriRuntime: vi.fn(),
}));

vi.mock('@sdkwork/notes-shell', () => ({
  AppRoot: shellMocks.appRoot,
}));

vi.mock('../providers/DesktopProviders', () => ({
  DesktopProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="desktop-providers">{children}</div>
  ),
}));

vi.mock('./DesktopTrayRouteBridge', () => ({
  DesktopTrayRouteBridge: () => <div data-testid="desktop-tray-route-bridge" />,
}));

vi.mock('./DesktopStartupScreen', () => ({
  DesktopStartupScreen: ({
    isVisible,
    status,
  }: {
    isVisible: boolean;
    status: 'booting' | 'ready';
  }) => (
    <div
      data-testid="desktop-startup-screen"
      data-visible={String(isVisible)}
      data-status={status}
    />
  ),
}));

vi.mock('../runtime', () => ({
  getDesktopWindow: runtimeMocks.getDesktopWindow,
  isTauriRuntime: runtimeMocks.isTauriRuntime,
}));

describe('DesktopBootstrapApp', () => {
  const queuedAnimationFrames: FrameRequestCallback[] = [];

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.useFakeTimers();
    queuedAnimationFrames.length = 0;
    shellMocks.appRoot.mockClear();
    runtimeMocks.showWindow.mockClear();
    runtimeMocks.focusWindow.mockClear();
    runtimeMocks.getDesktopWindow.mockReset();
    runtimeMocks.isTauriRuntime.mockReset();
    runtimeMocks.isTauriRuntime.mockReturnValue(true);
    runtimeMocks.getDesktopWindow.mockReturnValue({
      show: runtimeMocks.showWindow,
      setFocus: runtimeMocks.focusWindow,
      setFullscreen: vi.fn(async () => {}),
      isMaximized: vi.fn(async () => false),
      unmaximize: vi.fn(async () => {}),
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      queuedAnimationFrames.push(callback);
      return queuedAnimationFrames.length;
    });
  });

  function flushAnimationFrames(rounds = 1) {
    for (let index = 0; index < rounds; index += 1) {
      const callbacks = queuedAnimationFrames.splice(0, queuedAnimationFrames.length);
      for (const callback of callbacks) {
        callback(performance.now());
      }
    }
  }

  async function settleAnimationFrames(cycles = 1) {
    for (let index = 0; index < cycles; index += 1) {
      await act(async () => {
        flushAnimationFrames(1);
        await Promise.resolve();
        flushAnimationFrames(1);
        await Promise.resolve();
      });
    }
  }

  it('keeps the shell hidden until the startup handoff finishes', async () => {
    render(
      <DesktopBootstrapApp
        initialAppearance={{
          language: 'zh-CN',
          themeMode: 'system',
          themeColor: 'default',
          resolvedColorScheme: 'light',
          backgroundColor: '#f3f5f9',
          foregroundColor: '#122033',
        }}
      />,
    );

    expect(screen.queryByTestId('notes-app-root')).toBeNull();
    expect(screen.getByTestId('desktop-startup-screen').getAttribute('data-visible')).toBe('true');
    expect(screen.getByTestId('desktop-startup-screen').getAttribute('data-status')).toBe('booting');

    await settleAnimationFrames(3);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await settleAnimationFrames(2);

    expect(screen.getByTestId('notes-app-root')).not.toBeNull();
    expect(runtimeMocks.showWindow).toHaveBeenCalledTimes(1);
    expect(runtimeMocks.focusWindow).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('desktop-startup-screen').getAttribute('data-visible')).toBe('false');
    expect(screen.getByTestId('desktop-startup-screen').getAttribute('data-status')).toBe('ready');
  });

  it('forwards optional app root props into the shell once the startup handoff finishes', async () => {
    const appRootProps = {
      notesWorkspaceBootstrapOptions: {
        apply: vi.fn(async () => ({
          type: 'completed' as const,
          at: '2026-04-14T14:10:00.000Z',
        })),
      },
    };

    render(
      <DesktopBootstrapApp
        initialAppearance={{
          language: 'zh-CN',
          themeMode: 'system',
          themeColor: 'default',
          resolvedColorScheme: 'light',
          backgroundColor: '#f3f5f9',
          foregroundColor: '#122033',
        }}
        appRootProps={appRootProps}
      />,
    );

    await settleAnimationFrames(3);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await settleAnimationFrames(2);

    expect(shellMocks.appRoot).toHaveBeenCalled();
    expect(shellMocks.appRoot.mock.calls.at(-1)?.[0]).toMatchObject(appRootProps);
  });
});
