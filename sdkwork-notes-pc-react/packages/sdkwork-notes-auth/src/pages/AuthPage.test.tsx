import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

function readAuthPageSource() {
  return fs.readFileSync(new URL('./AuthPage.tsx', import.meta.url), 'utf8');
}

describe('AuthPage direct integration contract', () => {
  it('wraps the shared sdkwork appbase auth page instead of owning a bespoke notes auth workflow', () => {
    const source = readAuthPageSource();

    expect(source).toMatch(/SdkworkAuthPage/);
    expect(source).toMatch(/basePath=\{?['"]\/auth['"]\}?/);
    expect(source).toMatch(/homePath=\{?['"]\/notes['"]\}?/);
    expect(source).toMatch(/SdkworkIamThemeProvider/);

    expect(source).not.toMatch(/QRCode|generateLoginQrCode|checkLoginQrCodeStatus/);
    expect(source).not.toMatch(/appAuthService|sendPasswordReset|signInWithOAuth|FieldInput|ProviderGlyph/);
    expect(source).not.toMatch(/useAuthStore/);
  });
});
