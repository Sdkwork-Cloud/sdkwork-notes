import type { SdkworkAuthMessagesOverrides, SdkworkAuthRuntimeConfig } from '@sdkwork/auth-pc-react';

type TranslateFn = (key: string) => string;

export const notesAuthRuntimeConfig: SdkworkAuthRuntimeConfig = {
  loginMethods: ['password', 'phoneCode', 'emailCode'],
  oauthLoginEnabled: true,
  oauthProviders: ['wechat', 'douyin', 'github', 'google'],
  qrLoginEnabled: true,
  recoveryMethods: ['email', 'phone'],
  registerMethods: ['email', 'phone'],
};

export function createNotesAuthMessages(t: TranslateFn): SdkworkAuthMessagesOverrides {
  return {
    callback: {
      backToLogin: t('auth.backToLogin'),
      badge: t('auth.oauth.badge'),
      failedTitle: t('auth.oauth.failedTitle'),
      invalidProvider: t('auth.oauth.invalidProvider'),
      missingCode: t('auth.oauth.missingCode'),
      processingDescription: t('auth.oauth.processingDesc'),
      processingHint: t('auth.oauth.processingHint'),
      processingTitle: t('auth.oauth.processingTitle'),
    },
    common: {
      backToLogin: t('auth.backToLogin'),
      emailLabel: t('auth.email'),
      passwordLabel: t('auth.password'),
    },
    forgot: {
      badge: 'SDKWork Notes',
      description: t('auth.resetDesc'),
      submit: t('auth.sendResetLink'),
      title: t('auth.resetPassword'),
    },
    login: {
      badge: 'SDKWork Notes',
      description: t('auth.loginDesc'),
      forgotPassword: t('auth.forgotPassword'),
      needAccount: t('auth.noAccount'),
      signIn: t('auth.signIn'),
      title: t('auth.welcomeBack'),
    },
    oauth: {
      dividerLabel: t('auth.continueWith'),
    },
    qr: {
      alt: t('auth.qrAlt'),
      defaultDescription: t('auth.qrDesc'),
      defaultTitle: t('auth.qrLogin'),
      generateFailed: t('auth.errors.qrGenerateFailed'),
      missingPayload: t('auth.errors.invalidQrPayload'),
      openAppHint: t('auth.openApp'),
      refresh: t('auth.qrRefresh'),
      scannedHint: t('auth.qrScannedHint'),
      status: {
        confirmed: t('auth.qrStatus.confirmed'),
        error: t('auth.qrStatus.error'),
        expired: t('auth.qrStatus.expired'),
        loading: t('auth.qrStatus.loading'),
        pending: t('auth.qrStatus.pending'),
        scanned: t('auth.qrStatus.scanned'),
      },
      unavailable: t('auth.errors.qrStatusFailed'),
    },
    register: {
      badge: 'SDKWork Notes',
      description: t('auth.registerDesc'),
      submit: t('auth.signUp'),
      title: t('auth.createAccount'),
    },
  };
}
