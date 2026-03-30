import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import {
  isSharedSdkSourceMode,
  resolvePnpmPackageDistEntry,
} from './scripts/shared-sdk-mode';

export default defineConfig(() => {
  const useSharedSdkSourceMode = isSharedSdkSourceMode(process.env);
  const workspaceRootDir = path.resolve(__dirname);
  const monorepoRoot = path.resolve(__dirname, '../../..');
  const sharedAppSdkSourceEntry = path.resolve(
    __dirname,
    '../../../spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/index.ts',
  );
  const sharedSdkCommonSourceEntry = path.resolve(
    __dirname,
    '../../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts',
  );
  const sharedAppSdkDistEntry =
    resolvePnpmPackageDistEntry('@sdkwork/app-sdk', workspaceRootDir)
    ?? path.resolve(
      __dirname,
      '../../../spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/dist/index.js',
    );
  const sharedSdkCommonDistEntry =
    resolvePnpmPackageDistEntry('@sdkwork/sdk-common', workspaceRootDir)
    ?? path.resolve(
      __dirname,
      '../../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript/dist/index.js',
    );

  return {
    plugins: [react(), tailwindcss()],
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
              { find: '@sdkwork/app-sdk', replacement: sharedAppSdkSourceEntry },
              { find: '@sdkwork/sdk-common', replacement: sharedSdkCommonSourceEntry },
            ]
          : [
              { find: '@sdkwork/app-sdk', replacement: sharedAppSdkDistEntry },
              { find: '@sdkwork/sdk-common', replacement: sharedSdkCommonDistEntry },
            ]),
      ],
      dedupe: ['react', 'react-dom', '@sdkwork/sdk-common'],
    },
    server: {
      port: 4178,
      host: '127.0.0.1',
      fs: {
        allow: [monorepoRoot],
      },
    },
  };
});
