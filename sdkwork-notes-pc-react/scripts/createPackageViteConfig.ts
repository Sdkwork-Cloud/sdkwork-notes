import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function readPackageJson(): PackageJsonShape {
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJsonShape;
}

export function createPackageViteConfig() {
  const packageJson = readPackageJson();
  const external = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {}),
  ];

  return defineConfig({
    plugins: [
      dts({
        include: ['src'],
      }),
    ],
    build: {
      lib: {
        entry: resolve(process.cwd(), 'src/index.ts'),
        formats: ['es'],
        fileName: () => 'index.js',
      },
      rollupOptions: {
        external,
      },
      sourcemap: true,
      emptyOutDir: true,
    },
  });
}
