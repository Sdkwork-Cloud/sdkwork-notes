import { describe, expect, it } from 'vitest';
import { createNotesAuthMessages, notesAuthRuntimeConfig } from './authMessages';

describe('notes auth runtime configuration contract', () => {
  it('keeps all shared auth entry points enabled for the notes app', () => {
    expect(notesAuthRuntimeConfig).toEqual({
      loginMethods: ['password', 'phoneCode', 'emailCode'],
      oauthLoginEnabled: true,
      oauthProviders: ['wechat', 'douyin', 'github', 'google'],
      qrLoginEnabled: true,
      recoveryMethods: ['email', 'phone'],
      registerMethods: ['email', 'phone'],
    });
  });
});

describe('notes auth message overrides contract', () => {
  it('maps shared auth copy to the notes translation keys and product badge', () => {
    const translate = (key: string) => `translated:${key}`;
    const messages = createNotesAuthMessages(translate);

    expect(messages.login).toEqual({
      badge: 'SDKWork Notes',
      description: 'translated:auth.loginDesc',
      forgotPassword: 'translated:auth.forgotPassword',
      needAccount: 'translated:auth.noAccount',
      signIn: 'translated:auth.signIn',
      title: 'translated:auth.welcomeBack',
    });

    expect(messages.register).toEqual({
      badge: 'SDKWork Notes',
      description: 'translated:auth.registerDesc',
      submit: 'translated:auth.signUp',
      title: 'translated:auth.createAccount',
    });

    expect(messages.forgot).toEqual({
      badge: 'SDKWork Notes',
      description: 'translated:auth.resetDesc',
      submit: 'translated:auth.sendResetLink',
      title: 'translated:auth.resetPassword',
    });

    expect(messages.callback).toEqual({
      backToLogin: 'translated:auth.backToLogin',
      badge: 'translated:auth.oauth.badge',
      failedTitle: 'translated:auth.oauth.failedTitle',
      invalidProvider: 'translated:auth.oauth.invalidProvider',
      missingCode: 'translated:auth.oauth.missingCode',
      processingDescription: 'translated:auth.oauth.processingDesc',
      processingHint: 'translated:auth.oauth.processingHint',
      processingTitle: 'translated:auth.oauth.processingTitle',
    });

    expect(messages.common).toEqual({
      backToLogin: 'translated:auth.backToLogin',
      emailLabel: 'translated:auth.email',
      passwordLabel: 'translated:auth.password',
    });

    expect(messages.oauth).toEqual({
      dividerLabel: 'translated:auth.continueWith',
    });

    expect(messages.qr).toEqual({
      alt: 'translated:auth.qrAlt',
      defaultDescription: 'translated:auth.qrDesc',
      defaultTitle: 'translated:auth.qrLogin',
      generateFailed: 'translated:auth.errors.qrGenerateFailed',
      missingPayload: 'translated:auth.errors.invalidQrPayload',
      openAppHint: 'translated:auth.openApp',
      refresh: 'translated:auth.qrRefresh',
      scannedHint: 'translated:auth.qrScannedHint',
      status: {
        confirmed: 'translated:auth.qrStatus.confirmed',
        error: 'translated:auth.qrStatus.error',
        expired: 'translated:auth.qrStatus.expired',
        loading: 'translated:auth.qrStatus.loading',
        pending: 'translated:auth.qrStatus.pending',
        scanned: 'translated:auth.qrStatus.scanned',
      },
      unavailable: 'translated:auth.errors.qrStatusFailed',
    });
  });
});
