import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguagePreference } from '@sdkwork/notes-types';
import { enUS } from './resources/en-US';
import { zhCN } from './resources/zh-CN';

const resources = {
  'en-US': {
    translation: enUS,
  },
  'zh-CN': {
    translation: zhCN,
  },
} as const;

function detectLanguage(): LanguagePreference {
  if (typeof navigator === 'undefined') {
    return 'zh-CN';
  }

  return navigator.language?.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}

export async function ensureI18n() {
  if (i18n.isInitialized) {
    return i18n;
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
  });

  return i18n;
}

export { i18n, resources };
