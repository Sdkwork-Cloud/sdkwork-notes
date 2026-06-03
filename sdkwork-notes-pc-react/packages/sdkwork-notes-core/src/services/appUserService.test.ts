import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initAppSdkClient, resetAppSdkClient } from '../sdk/useAppSdkClient';
import { appUserService } from './appUserService';

const fetchCalls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

beforeEach(() => {
  fetchCalls.length = 0;
  resetAppSdkClient();
  initAppSdkClient({ accessToken: 'configured-access-token' });

  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ input, init });
    const url = String(input);

    if (url.endsWith('/app/v3/api/user/profile') && init?.method === 'PUT') {
      const body = JSON.parse(String(init?.body || '{}')) as { nickname?: string };
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            email: 'notes-user@example.com',
            nickname: body.nickname,
            avatar: 'https://cdn.example.com/notes-user.png',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/user/profile')) {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            email: 'notes-user@example.com',
            nickname: 'Notes User',
            avatar: 'https://cdn.example.com/notes-user.png',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/user/settings') && init?.method === 'PUT') {
      const body = JSON.parse(String(init?.body || '{}')) as { theme?: string; language?: string };
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            theme: body.theme,
            language: body.language,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/user/settings')) {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            theme: 'dark',
            language: 'en-US',
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

describe('appUserService', () => {
  it('maps the backend user profile into the desktop account shape', async () => {
    const profile = await appUserService.getCurrentProfile();

    expect(profile).toEqual({
      displayName: 'Notes User',
      email: 'notes-user@example.com',
      avatarUrl: 'https://cdn.example.com/notes-user.png',
    });
  });

  it('persists display name updates through the generated app sdk user client', async () => {
    const profile = await appUserService.updateCurrentProfile({
      displayName: 'Night Operator',
    });

    const profileUpdateRequest = fetchCalls.find(
      ({ input, init }) =>
        String(input).endsWith('/app/v3/api/user/profile') && init?.method === 'PUT',
    );

    expect(profileUpdateRequest).toBeDefined();
    expect(JSON.parse(String(profileUpdateRequest?.init?.body ?? '{}'))).toEqual({
      nickname: 'Night Operator',
    });
    expect(profile).toEqual({
      displayName: 'Night Operator',
      email: 'notes-user@example.com',
      avatarUrl: 'https://cdn.example.com/notes-user.png',
    });
  });

  it('maps backend user settings into local theme and language preferences', async () => {
    const settings = await appUserService.getCurrentSettings();

    expect(settings).toEqual({
      themeMode: 'dark',
      languagePreference: 'en-US',
    });
  });

  it('persists theme and language preferences through the generated app sdk user client', async () => {
    const settings = await appUserService.updateCurrentSettings({
      themeMode: 'system',
      languagePreference: 'zh-CN',
    });

    const settingsUpdateRequest = fetchCalls.find(
      ({ input, init }) =>
        String(input).endsWith('/app/v3/api/user/settings') && init?.method === 'PUT',
    );

    expect(settingsUpdateRequest).toBeDefined();
    expect(JSON.parse(String(settingsUpdateRequest?.init?.body ?? '{}'))).toEqual({
      theme: 'system',
      language: 'zh-CN',
    });
    expect(settings).toEqual({
      themeMode: 'system',
      languagePreference: 'zh-CN',
    });
  });
});
