export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'default' | 'forest' | 'amber' | 'ink';
export type LanguagePreference = 'zh-CN' | 'en-US';

export interface AuthUserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  displayName: string;
  initials: string;
}
