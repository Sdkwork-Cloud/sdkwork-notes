import { describe, expect, it } from 'vitest';
import { isTauriRuntime } from './runtime';

describe('desktop runtime', () => {
  it('treats injected Tauri internals as a desktop runtime signal', () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        __TAURI_INTERNALS__: {
          invoke() {
            return Promise.resolve(undefined);
          },
        },
      },
    });

    try {
      expect(isTauriRuntime()).toBe(true);
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }
  });
});
