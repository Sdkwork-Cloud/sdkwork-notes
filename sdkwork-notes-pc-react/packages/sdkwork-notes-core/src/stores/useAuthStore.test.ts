import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appAuthService } from '../services/appAuthService';
import { createAuthStore } from './useAuthStore';

function createMemoryStorage() {
  const store = new Map<string, string>();

  return {
    getItem(name: string) {
      return store.get(name) ?? null;
    },
    setItem(name: string, value: string) {
      store.set(name, value);
    },
    removeItem(name: string) {
      store.delete(name);
    },
  };
}

const fetchCalls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

beforeEach(() => {
  fetchCalls.length = 0;
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
    configurable: true,
  });

  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ input, init });
    const url = String(input);

    if (url.endsWith('/app/v3/api/auth/login')) {
      const body = JSON.parse(String(init?.body || '{}')) as { username?: string };
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            authToken: 'jwt-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresIn: 3600,
            userInfo: {
              username: body.username,
              email: body.username,
              nickname: 'Night Operator',
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/auth/register')) {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {},
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/auth/logout')) {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: null,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/auth/password/reset/request')) {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: null,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/auth/oauth/login')) {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            authToken: 'oauth-auth-token',
            refreshToken: 'oauth-refresh-token',
            tokenType: 'Bearer',
            expiresIn: 3600,
            userInfo: {
              username: 'github-user',
              email: 'octocat@example.com',
              nickname: 'Octo Cat',
              avatar: 'https://cdn.example.com/octocat.png',
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/auth/qr/status/qr-login-1')) {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            status: 'confirmed',
            userInfo: {
              username: 'wechat-user',
              email: 'wechat-user@example.com',
              nickname: 'WeChat User',
              avatar: 'https://cdn.example.com/wechat-user.png',
            },
            token: {
              authToken: 'qr-auth-token',
              refreshToken: 'qr-refresh-token',
              tokenType: 'Bearer',
              expiresIn: 3600,
              userInfo: {
                username: 'wechat-user',
                email: 'wechat-user@example.com',
                nickname: 'WeChat User',
                avatar: 'https://cdn.example.com/wechat-user.png',
              },
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ code: 404, msg: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAuthStore', () => {
  it('signs in and persists the entered email', async () => {
    const storage = createMemoryStorage();
    const store = createAuthStore(storage);

    expect(store.getState().isAuthenticated).toBe(false);
    expect(store.getState().user).toBeNull();

    await store.getState().signIn({
      email: 'night-operator@example.com',
      password: 'secret',
    });

    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().user?.email).toBe('night-operator@example.com');
    expect(store.getState().user?.displayName).toBe('Night Operator');
    expect(storage.getItem('sdkwork-notes-auth-storage')).toBeTruthy();
  });

  it('registers and signs out cleanly', async () => {
    const storage = createMemoryStorage();
    const store = createAuthStore(storage);

    await store.getState().register({
      name: 'Night Operator',
      email: 'night-operator@example.com',
      password: 'secret',
    });

    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().user?.displayName).toBe('Night Operator');

    await store.getState().signOut();

    expect(store.getState().isAuthenticated).toBe(false);
    expect(store.getState().user).toBeNull();
  });

  it('sends password reset requests through the backend auth client', async () => {
    const storage = createMemoryStorage();
    const store = createAuthStore(storage);

    await store.getState().sendPasswordReset(' night-operator@example.com ');

    const resetRequest = fetchCalls.find(({ input }) =>
      String(input).endsWith('/app/v3/api/auth/password/reset/request'),
    );

    expect(resetRequest).toBeDefined();
    expect(resetRequest?.init?.method).toBe('POST');
    expect(JSON.parse(String(resetRequest?.init?.body ?? '{}'))).toEqual({
      account: 'night-operator@example.com',
      channel: 'EMAIL',
    });
  });

  it('signs in with OAuth providers and persists the returned identity', async () => {
    const storage = createMemoryStorage();
    const store = createAuthStore(storage);

    const user = await store.getState().signInWithOAuth({
      provider: 'github',
      code: 'oauth-code',
      state: 'oauth-state',
      deviceType: 'web',
    });

    expect(store.getState().isAuthenticated).toBe(true);
    expect(user.email).toBe('octocat@example.com');
    expect(user.displayName).toBe('Octo Cat');
  });

  it('applies confirmed qr login sessions into auth state', async () => {
    const storage = createMemoryStorage();
    const store = createAuthStore(storage);
    const qrStatus = await appAuthService.checkLoginQrCodeStatus('qr-login-1');

    expect(qrStatus.status).toBe('confirmed');
    expect(qrStatus.session).toBeDefined();

    const user = store.getState().applySession(qrStatus.session!);

    expect(store.getState().isAuthenticated).toBe(true);
    expect(user.email).toBe('wechat-user@example.com');
    expect(user.displayName).toBe('WeChat User');
  });
});
