// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDesktopApp } from './createDesktopApp';

const bootstrapMocks = vi.hoisted(() => {
  const render = vi.fn();
  return {
    applyStartupAppearanceHints: vi.fn(),
    configureDesktopPlatformBridge: vi.fn(),
    createRoot: vi.fn(() => ({
      render,
    })),
    ensureI18n: vi.fn(async () => {}),
    installDesktopSessionStoreBridge: vi.fn(async () => {}),
    readCurrentStartupAppearanceSnapshot: vi.fn(() => ({
      backgroundColor: '#f3f5f9',
      foregroundColor: '#122033',
      language: 'zh-CN',
      resolvedColorScheme: 'light',
      themeColor: 'default',
      themeMode: 'system',
    })),
    render,
    desktopBootstrapApp: vi.fn((_props: unknown) => null),
    waitForTauriRuntime: vi.fn(async () => true),
  };
});

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: bootstrapMocks.createRoot,
  },
}));

vi.mock('@sdkwork/notes-i18n', () => ({
  ensureI18n: bootstrapMocks.ensureI18n,
}));

vi.mock('../tauriBridge', () => ({
  configureDesktopPlatformBridge: bootstrapMocks.configureDesktopPlatformBridge,
}));

vi.mock('../runtime', () => ({
  waitForTauriRuntime: bootstrapMocks.waitForTauriRuntime,
}));

vi.mock('../sessionBridge', () => ({
  installDesktopSessionStoreBridge: bootstrapMocks.installDesktopSessionStoreBridge,
}));

vi.mock('./DesktopBootstrapApp', () => ({
  DesktopBootstrapApp: bootstrapMocks.desktopBootstrapApp,
}));

vi.mock('./startupAppearance', () => ({
  applyStartupAppearanceHints: bootstrapMocks.applyStartupAppearanceHints,
  readCurrentStartupAppearanceSnapshot: bootstrapMocks.readCurrentStartupAppearanceSnapshot,
}));

describe('createDesktopApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('hydrates the desktop session bridge before rendering the shell under the native runtime', async () => {
    await createDesktopApp();

    expect(bootstrapMocks.waitForTauriRuntime).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.configureDesktopPlatformBridge).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.installDesktopSessionStoreBridge).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.ensureI18n).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.render).toHaveBeenCalledTimes(1);
  });

  it('forwards optional app root props into the desktop bootstrap shell component', async () => {
    const appRootProps = {
      notesWorkspaceBootstrapOptions: {
        apply: vi.fn(async () => ({
          type: 'completed' as const,
          at: '2026-04-14T14:20:00.000Z',
        })),
      },
    };

    await createDesktopApp({ appRootProps });

    expect(bootstrapMocks.render).toHaveBeenCalledTimes(1);
    const renderedElement = bootstrapMocks.render.mock.calls[0]?.[0] as {
      props: {
        appRootProps: typeof appRootProps;
        hasNativeRuntime: boolean;
      };
    };
    expect(renderedElement.props).toMatchObject({
      appRootProps,
      hasNativeRuntime: true,
    });
  });
});
