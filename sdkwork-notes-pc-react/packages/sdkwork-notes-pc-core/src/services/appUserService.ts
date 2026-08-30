import type {
  UserProfileVO,
  UserSettingsVO,
} from '../sdk/appSdkPort';
import type { LanguagePreference, ThemeMode } from '@sdkwork/notes-pc-types-commons';
import { getAppSdkClientWithSession } from '../sdk/useAppSdkClient';
import { unwrapAppSdkResponse } from '../sdk/appSdkResult';

export interface AppUserProfile {
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export interface AppUserSettings {
  themeMode: ThemeMode;
  languagePreference: LanguagePreference;
}

export interface AppUserProfileUpdateInput {
  displayName: string;
}

export interface AppUserSettingsUpdateInput {
  themeMode: ThemeMode;
  languagePreference: LanguagePreference;
}

export interface IAppUserService {
  getCurrentProfile(): Promise<AppUserProfile>;
  updateCurrentProfile(input: AppUserProfileUpdateInput): Promise<AppUserProfile>;
  getCurrentSettings(): Promise<AppUserSettings>;
  updateCurrentSettings(input: AppUserSettingsUpdateInput): Promise<AppUserSettings>;
}

function readOptionalString(value?: string | null) {
  const normalized = (value || '').trim();
  return normalized || undefined;
}

function mapUserProfile(profile?: UserProfileVO | null): AppUserProfile {
  return {
    displayName:
      readOptionalString(profile?.nickname)
      || readOptionalString(profile?.email)
      || readOptionalString(profile?.phone)
      || 'Notes User',
    email: readOptionalString(profile?.email) || '',
    avatarUrl: readOptionalString(profile?.avatar),
  };
}

function mapThemeMode(theme?: string | null): ThemeMode {
  const normalized = (theme || '').trim().toLowerCase();
  if (normalized === 'dark') {
    return 'dark';
  }
  if (normalized === 'light') {
    return 'light';
  }
  return 'system';
}

function mapLanguagePreference(language?: string | null): LanguagePreference {
  return (language || '').trim() === 'en-US' ? 'en-US' : 'zh-CN';
}

function mapUserSettings(settings?: UserSettingsVO | null): AppUserSettings {
  return {
    themeMode: mapThemeMode(settings?.theme),
    languagePreference: mapLanguagePreference(settings?.language),
  };
}

export const appUserService: IAppUserService = {
  async getCurrentProfile() {
    const client = getAppSdkClientWithSession();
    const profile = unwrapAppSdkResponse<UserProfileVO>(
      await client.user.getUserProfile(),
      'Failed to load current user profile.',
    );
    return mapUserProfile(profile);
  },

  async updateCurrentProfile(input) {
    const client = getAppSdkClientWithSession();
    const profile = unwrapAppSdkResponse<UserProfileVO>(
      await client.user.updateUserProfile({
        nickname: input.displayName.trim(),
      }),
      'Failed to update current user profile.',
    );
    return mapUserProfile(profile);
  },

  async getCurrentSettings() {
    const client = getAppSdkClientWithSession();
    const settings = unwrapAppSdkResponse<UserSettingsVO>(
      await client.user.getUserSettings(),
      'Failed to load current user settings.',
    );
    return mapUserSettings(settings);
  },

  async updateCurrentSettings(input) {
    const client = getAppSdkClientWithSession();
    const settings = unwrapAppSdkResponse<UserSettingsVO>(
      await client.user.updateUserSettings({
        theme: input.themeMode,
        language: input.languagePreference,
      }),
      'Failed to update current user settings.',
    );
    return mapUserSettings(settings);
  },
};
