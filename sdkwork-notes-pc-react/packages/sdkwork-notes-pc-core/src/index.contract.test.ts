import { describe, expect, it } from 'vitest';
import * as notesCore from './index';
import * as notesCoreServices from './services';
import * as notesCoreStores from './stores';

describe('notes-core public auth boundary', () => {
  it('does not expose legacy auth service and store APIs once notes-auth owns auth state', () => {
    expect(Object.keys(notesCore)).not.toContain('appAuthService');
    expect(Object.keys(notesCore)).not.toContain('useAuthStore');
    expect(Object.keys(notesCoreServices)).not.toContain('appAuthService');
    expect(Object.keys(notesCoreStores)).not.toContain('useAuthStore');
  });
});
