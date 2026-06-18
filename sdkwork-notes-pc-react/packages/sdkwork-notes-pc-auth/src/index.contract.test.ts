import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string) {
  return fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('notes auth public facade contract', () => {
  it('re-exports shared auth primitives and notes auth store types from the package facade', () => {
    const indexSource = readSource('./index.ts');
    const storeIndexSource = readSource('./store/index.ts');
    const authStoreSource = readSource('./store/authStore.tsx');

    expect(indexSource).toMatch(/export \{[^}]*AuthPage as default[^}]*\} from ['"]\.\/pages\/Auth['"]/s);
    expect(indexSource).toMatch(/export \{[^}]*AuthPage as LoginPage[^}]*\} from ['"]\.\/pages\/Auth['"]/s);
    expect(indexSource).toMatch(/export \{[^}]*AuthPage[^}]*\} from ['"]\.\/pages\/Auth['"]/s);
    expect(indexSource).toMatch(/export \* from ['"]@sdkwork\/auth-pc-react['"]/);
    expect(indexSource).toMatch(
      /export type \{[^}]*NotesAuthStoreState[^}]*NotesAuthUserProfileInput[^}]*\} from ['"]\.\/store['"]/s,
    );

    expect(storeIndexSource).toMatch(
      /export type \{[^}]*NotesAuthStoreState[^}]*NotesAuthUserProfileInput[^}]*\} from ['"]\.\/authStore['"]/s,
    );

    expect(authStoreSource).toMatch(/export interface NotesAuthUserProfileInput/);
    expect(authStoreSource).toMatch(/export interface NotesAuthStoreState/);
    expect(authStoreSource).not.toMatch(/restoreSession/);
  });
});
