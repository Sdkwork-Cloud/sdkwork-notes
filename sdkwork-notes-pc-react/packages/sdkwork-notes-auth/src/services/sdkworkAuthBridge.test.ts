import { beforeEach, describe, expect, it, vi } from 'vitest';

const authBridgeMocks = vi.hoisted(() => {
  const sharedServiceFactoryCalls: Array<Record<string, unknown>> = [];
  const controllerFactoryCalls: Array<Record<string, unknown>> = [];
  const fallbackControllerState = {
    isAuthenticated: false,
    isBootstrapped: true,
    isBusy: false,
    session: null,
    status: 'anonymous',
    user: null,
  };

  const createSharedService = vi.fn((options: Record<string, any> = {}) => {
    sharedServiceFactoryCalls.push(options);

    return {
      checkLoginQrCodeStatus: vi.fn(async () => ({ status: 'pending' })),
      generateLoginQrCode: vi.fn(async () => ({ qrKey: 'qr-key' })),
      getCurrentSession: vi.fn(async () => options.readSession?.() ?? null),
      getCurrentUser: vi.fn(async () => {
        const client = options.getClient?.();
        return client?.user?.getUserProfile ? client.user.getUserProfile() : null;
      }),
      getOAuthAuthorizationUrl: vi.fn(async () => 'https://sdkwork.test/oauth'),
      register: vi.fn(async () => ({
        accessToken: options.resolveAccessToken?.() ?? '',
        authToken: 'registered-auth-token',
      })),
      requestPasswordReset: vi.fn(async () => {}),
      resetPassword: vi.fn(async () => {}),
      sendVerifyCode: vi.fn(async () => {}),
      signIn: vi.fn(async (payload: Record<string, unknown>) => {
        const client = options.getClient?.();
        const login = client?.auth?.login;
        const session = await login?.(payload);
        options.commitSession?.(session);
        return {
          accessToken: options.resolveAccessToken?.() ?? session?.accessToken ?? '',
          authToken: session?.authToken ?? '',
          refreshToken: session?.refreshToken,
        };
      }),
      signInWithEmailCode: vi.fn(async () => ({
        accessToken: options.resolveAccessToken?.() ?? '',
        authToken: 'email-auth-token',
      })),
      signInWithOAuth: vi.fn(async (payload: Record<string, unknown>) => {
        const client = options.getClient?.();
        const oauthLogin = client?.auth?.oauthLogin;
        const session = await oauthLogin?.(payload);
        options.commitSession?.(session);
        return {
          accessToken: options.resolveAccessToken?.() ?? session?.accessToken ?? '',
          authToken: session?.authToken ?? '',
          refreshToken: session?.refreshToken,
        };
      }),
      signInWithPhoneCode: vi.fn(async () => ({
        accessToken: options.resolveAccessToken?.() ?? '',
        authToken: 'phone-auth-token',
      })),
      signOut: vi.fn(async () => {
        await options.clearSession?.();
      }),
      verifyCode: vi.fn(async () => true),
    };
  });

  const createSharedController = vi.fn((options: Record<string, any> = {}) => {
    controllerFactoryCalls.push(options);

    return {
      bootstrap: vi.fn(async () => fallbackControllerState),
      getState: vi.fn(() => fallbackControllerState),
      service: options.service,
      signIn: options.service?.signIn ?? vi.fn(async () => null),
      signOut: options.service?.signOut ?? vi.fn(async () => undefined),
      subscribe: vi.fn(() => () => {}),
    };
  });

  return {
    controllerFactoryCalls,
    createSharedController,
    createSharedService,
    fallbackControllerState,
    sharedServiceFactoryCalls,
  };
});

const notesCoreMocks = vi.hoisted(() => ({
  clearAppSdkSessionTokens: vi.fn(),
  getAppSdkClientWithSession: vi.fn(),
  persistAppSdkSessionTokens: vi.fn(),
  readAppSdkSessionTokens: vi.fn(),
  resolveAppSdkAccessToken: vi.fn(),
}));

vi.mock('@sdkwork/auth-pc-react', () => ({
  createSdkworkAuthController: authBridgeMocks.createSharedController,
  createSdkworkAuthService: authBridgeMocks.createSharedService,
  useSdkworkAuthControllerState: vi.fn(),
}));

vi.mock('@sdkwork/notes-core', () => ({
  clearAppSdkSessionTokens: notesCoreMocks.clearAppSdkSessionTokens,
  getAppSdkClientWithSession: notesCoreMocks.getAppSdkClientWithSession,
  persistAppSdkSessionTokens: notesCoreMocks.persistAppSdkSessionTokens,
  readAppSdkSessionTokens: notesCoreMocks.readAppSdkSessionTokens,
  resolveAppSdkAccessToken: notesCoreMocks.resolveAppSdkAccessToken,
}));

import {
  bindNotesAuthClient,
  createNotesAuthController,
  createNotesAuthService,
} from './sdkworkAuthBridge';

type NotesAuthControllerOptions = NonNullable<Parameters<typeof createNotesAuthController>[0]>;
type TestNotesAuthClient = {
  auth: AuthModule;
  user: UserModule;
};

class AuthModule {
  client = { id: 'auth-client' };

  async login(payload: Record<string, unknown>) {
    return {
      authToken: String(payload.username ?? ''),
      refreshToken: this.client.id,
    };
  }

  async oauthLogin(payload: Record<string, unknown>) {
    return {
      authToken: String(payload.provider ?? ''),
      refreshToken: this.client.id,
    };
  }
}

class UserModule {
  client = { id: 'user-client' };

  async getUserProfile() {
    return {
      id: this.client.id,
    };
  }
}

describe('notes auth bridge runtime contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authBridgeMocks.sharedServiceFactoryCalls.length = 0;
    authBridgeMocks.controllerFactoryCalls.length = 0;

    notesCoreMocks.getAppSdkClientWithSession.mockReturnValue({
      auth: new AuthModule(),
      user: new UserModule(),
    });
    notesCoreMocks.readAppSdkSessionTokens.mockReturnValue({
      accessToken: 'stored-access-token',
      authToken: 'stored-auth-token',
      refreshToken: 'stored-refresh-token',
    });
    notesCoreMocks.resolveAppSdkAccessToken.mockReturnValue('notes-access-token');
  });

  it('binds generated sdk auth and user methods so detached calls keep their module context', async () => {
    const client: TestNotesAuthClient = {
      auth: new AuthModule(),
      user: new UserModule(),
    };

    const rawLogin = client.auth.login;
    await expect(rawLogin({ username: 'demo-user' })).rejects.toThrow();

    const boundClient = bindNotesAuthClient(client as never);
    const login = (boundClient as TestNotesAuthClient).auth.login;
    const getUserProfile = (boundClient as TestNotesAuthClient).user?.getUserProfile;

    await expect(login({ username: 'demo-user' })).resolves.toEqual({
      authToken: 'demo-user',
      refreshToken: 'auth-client',
    });
    await expect(getUserProfile?.()).resolves.toEqual({
      id: 'user-client',
    });
  });

  it('wires shared auth service session lifecycle to notes core by default', async () => {
    const service = createNotesAuthService();

    await expect(service.getCurrentSession()).resolves.toEqual({
      accessToken: 'stored-access-token',
      authToken: 'stored-auth-token',
      refreshToken: 'stored-refresh-token',
    });

    await expect(
      service.signIn({
        password: 'secret',
        username: 'demo-user',
      }),
    ).resolves.toEqual({
      accessToken: 'notes-access-token',
      authToken: 'demo-user',
      refreshToken: 'auth-client',
    });

    await expect(
      service.signInWithOAuth({
        code: 'oauth-code',
        provider: 'github',
      }),
    ).resolves.toEqual({
      accessToken: 'notes-access-token',
      authToken: 'github',
      refreshToken: 'auth-client',
    });

    await service.signOut();

    expect(notesCoreMocks.getAppSdkClientWithSession).toHaveBeenCalledTimes(2);
    expect(notesCoreMocks.readAppSdkSessionTokens).toHaveBeenCalledTimes(1);
    expect(notesCoreMocks.persistAppSdkSessionTokens).toHaveBeenNthCalledWith(1, {
      authToken: 'demo-user',
      refreshToken: 'auth-client',
    });
    expect(notesCoreMocks.persistAppSdkSessionTokens).toHaveBeenNthCalledWith(2, {
      authToken: 'github',
      refreshToken: 'auth-client',
    });
    expect(notesCoreMocks.resolveAppSdkAccessToken).toHaveBeenCalledTimes(2);
    expect(notesCoreMocks.clearAppSdkSessionTokens).toHaveBeenCalledTimes(1);
  });

  it('creates controllers from the notes auth service and forwards service overrides', async () => {
    const signOutOverride = vi.fn(async () => undefined);

    const controller = createNotesAuthController({
      service: {
        signOut: signOutOverride,
      },
    });

    expect(authBridgeMocks.sharedServiceFactoryCalls).toHaveLength(1);
    expect(authBridgeMocks.sharedServiceFactoryCalls[0]).toMatchObject({
      clearSession: expect.any(Function),
      commitSession: expect.any(Function),
      getClient: expect.any(Function),
      readSession: expect.any(Function),
      resolveAccessToken: expect.any(Function),
    });
    expect(authBridgeMocks.controllerFactoryCalls).toHaveLength(1);
    expect(authBridgeMocks.controllerFactoryCalls[0]?.service).toMatchObject({
      getCurrentSession: expect.any(Function),
      signIn: expect.any(Function),
      signOut: signOutOverride,
    });

    await controller.signOut();

    expect(signOutOverride).toHaveBeenCalledTimes(1);
  });
});
