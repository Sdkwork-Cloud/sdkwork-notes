import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import {
  buildSdkworkVitePrivateEnvDefine,
  stripForbiddenCredentialEnvEntries,
} from '@sdkwork/core-pc-react/vite';
import {
  isSharedSdkSourceMode,
  resolvePnpmPackageDistEntry,
} from '../../scripts/shared-sdk-mode';

function resolveAppMode(mode: string): 'development' | 'test' | 'production' {
  const normalizedMode = String(process.env.SDKWORK_NOTES_APP_MODE ?? mode).trim().toLowerCase();
  if (normalizedMode === 'test') {
    return 'test';
  }
  if (normalizedMode === 'production') {
    return 'production';
  }
  return 'development';
}

function createRuntimeEnv(
  env: Record<string, string>,
  appMode: 'development' | 'test' | 'production',
) {
  return {
    ...env,
    MODE: appMode,
    NODE_ENV: appMode === 'production' ? 'production' : 'development',
    VITE_APP_ENV: env.VITE_APP_ENV || appMode,
    VITE_APP_PLATFORM: env.VITE_APP_PLATFORM || 'desktop',
  };
}

export default defineConfig(({ command, mode }) => {
  const useSharedSdkSourceMode = isSharedSdkSourceMode(process.env);
  const workspaceRootDir = path.resolve(__dirname, '../..');
  const appMode = resolveAppMode(mode);
  const runtimeEnv = stripForbiddenCredentialEnvEntries(
    createRuntimeEnv(loadEnv(appMode, workspaceRootDir, ''), appMode),
  );
  const monorepoRoot = path.resolve(__dirname, '../../../../..');
  const sharedSdkCommonSourceEntry = path.resolve(
    __dirname,
    '../../../../sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts',
  );
  const sharedSdkCommonDistEntry =
    resolvePnpmPackageDistEntry('@sdkwork/sdk-common', workspaceRootDir)
    ?? path.resolve(
      __dirname,
      '../../../../sdkwork-sdk-commons/sdkwork-sdk-common-typescript/dist/index.js',
    );

  return {
    base: command === 'build' ? './' : '/',
    envDir: workspaceRootDir,
    plugins: [react(), tailwindcss()],
    define: {
      __SDKWORK_NOTES_ENV__: JSON.stringify(runtimeEnv),
      ...buildSdkworkVitePrivateEnvDefine(loadEnv(appMode, workspaceRootDir, '')),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'editor-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            if (id.includes('react-dom') || id.includes(`${'/react/'}`) || id.includes('\\react\\')) {
              return 'react-vendor';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n-vendor';
            }
            if (
              id.includes('lucide-react')
              || id.includes('sonner')
              || id.includes('@tanstack/react-query')
              || id.includes('zustand')
            ) {
              return 'app-vendor';
            }
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
        ...(useSharedSdkSourceMode
          ? [
              { find: '@sdkwork/sdk-common', replacement: sharedSdkCommonSourceEntry },
            ]
          : [
              { find: '@sdkwork/sdk-common', replacement: sharedSdkCommonDistEntry },
            ]),
      ],
      dedupe: ['react', 'react-dom', '@sdkwork/sdk-common'],
    },
    server: {
      host: '127.0.0.1',
      port: 1430,
      strictPort: true,
      fs: {
        allow: [monorepoRoot],
      },
    },
  };
});
