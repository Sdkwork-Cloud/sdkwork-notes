import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configureAppSdkClientFactory,
  initAppSdkClient,
  resetAppSdkClient,
} from '../sdk/useAppSdkClient';
import { appUserService } from './appUserService';

const sdkCalls: Array<{ method: string; body?: unknown }> = [];

beforeEach(() => {
  sdkCalls.length = 0;
  resetAppSdkClient();
  configureAppSdkClientFactory(() => ({
    setAccessToken: vi.fn(),
    setAuthToken: vi.fn(),
    user: {
      async getUserProfile() {
        sdkCalls.push({ method: 'user.getUserProfile' });
        return {
          code: '2000',
          msg: 'success',
          data: {
            email: 'notes-user@example.com',
            nickname: 'Notes User',
            avatar: 'https://cdn.example.com/notes-user.png',
          },
        };
      },
      async updateUserProfile(body) {
        sdkCalls.push({ method: 'user.updateUserProfile', body });
        return {
          code: '2000',
          msg: 'success',
          data: {
            email: 'notes-user@example.com',
            nickname: body.nickname,
            avatar: 'https://cdn.example.com/notes-user.png',
          },
        };
      },
      async getUserSettings() {
        sdkCalls.push({ method: 'user.getUserSettings' });
        return {
          code: '2000',
          msg: 'success',
          data: {
            theme: 'dark',
            language: 'en-US',
          },
        };
      },
      async updateUserSettings(body) {
        sdkCalls.push({ method: 'user.updateUserSettings', body });
        return {
          code: '2000',
          msg: 'success',
          data: {
            theme: body.theme,
            language: body.language,
          },
        };
      },
    },
    note: {} as never,
    filesystem: {} as never,
  }));
  initAppSdkClient({ accessToken: 'configured-access-token' });
});

afterEach(() => {
  configureAppSdkClientFactory(null);
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

    const profileUpdateRequest = sdkCalls.find(({ method }) => method === 'user.updateUserProfile');

    expect(profileUpdateRequest).toBeDefined();
    expect(profileUpdateRequest?.body).toEqual({
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

    const settingsUpdateRequest = sdkCalls.find(({ method }) => method === 'user.updateUserSettings');

    expect(settingsUpdateRequest).toBeDefined();
    expect(settingsUpdateRequest?.body).toEqual({
      theme: 'system',
      language: 'zh-CN',
    });
    expect(settings).toEqual({
      themeMode: 'system',
      languagePreference: 'zh-CN',
    });
  });
});
