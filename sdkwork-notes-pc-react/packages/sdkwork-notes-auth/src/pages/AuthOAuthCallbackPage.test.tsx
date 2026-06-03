import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

function readCallbackSource() {
  return fs.readFileSync(new URL('./AuthOAuthCallbackPage.tsx', import.meta.url), 'utf8');
}

describe('AuthOAuthCallbackPage direct integration contract', () => {
  it('wraps the shared sdkwork appbase oauth callback page instead of reimplementing the callback flow locally', () => {
    const source = readCallbackSource();

    expect(source).toMatch(/SdkworkAuthOAuthCallbackPage/);
    expect(source).toMatch(/basePath=\{?['"]\/auth['"]\}?/);
    expect(source).toMatch(/homePath=\{?['"]\/notes['"]\}?/);
    expect(source).toMatch(/SdkworkIamThemeProvider/);

    expect(source).not.toMatch(/signInWithOAuth|useAuthStore|toast\.error|deviceType:\s*['"]web['"]/);
    expect(source).not.toMatch(/__resetAuthOAuthCallbackBootstrapStateForTests|setTimeout|inFlight/);
  });
});
