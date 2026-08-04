import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const packageJsonPath = path.resolve(workspaceRoot, 'package.json');
const desktopPackageJsonPath = path.resolve(
  workspaceRoot,
  'packages',
  'sdkwork-notes-pc-desktop',
  'package.json',
);

test('package scripts pin local desktop commands to source SDK mode and release builds to git SDK mode', () => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts ?? {};
  const desktopPackageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));
  const desktopScripts = desktopPackageJson.scripts ?? {};
  const nodeTestCommand = 'node --test --experimental-test-isolation=none';

  assert.equal(
    scripts['dev:browser:test-runner'],
    'node scripts/run-with-app-mode.mjs test -- pnpm exec vite --host 127.0.0.1 --port 4178 --strictPort',
  );
  assert.equal(
    scripts['build:test'],
    'node scripts/run-with-app-mode.mjs test -- pnpm install:shared-sdk && pnpm build:packages && pnpm exec vite build --mode standalone.test',
  );
  assert.equal(
    scripts['build:packages'],
    'node scripts/run-internal-packages-turbo.mjs build',
  );
  assert.equal(
    scripts.typecheck,
    'pnpm test:workspace:contracts && pnpm install:shared-sdk && node scripts/run-internal-packages-turbo.mjs typecheck && tsc -p tsconfig.json --noEmit',
  );
  assert.equal(
    scripts['test:workspace:contracts'],
    `${nodeTestCommand} scripts/workspace-boundary-contract.test.mjs && ${nodeTestCommand} scripts/env-config-contract.test.mjs && ${nodeTestCommand} scripts/session-store-behavior.test.mjs && ${nodeTestCommand} scripts/workspace-orchestrator.contract.test.mjs && ${nodeTestCommand} scripts/workspace-folder-mutation.contract.test.mjs && ${nodeTestCommand} scripts/workspace-write-path.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-actions.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-command-executor.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-command-dependencies.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-command-runtime.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-presentation-model.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-chrome.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-container-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-command-palette-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-header-actions-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-shortcut-hints-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-error-banner-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-page-dialog-footer-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-autosave.contract.test.mjs && ${nodeTestCommand} scripts/workspace-autosave-runtime.contract.test.mjs && ${nodeTestCommand} scripts/workspace-autosave-visibility-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-save-flush-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-save-feedback.contract.test.mjs && ${nodeTestCommand} scripts/workspace-save-queue.contract.test.mjs && ${nodeTestCommand} scripts/workspace-save-retry-policy.contract.test.mjs && ${nodeTestCommand} scripts/workspace-exit-recovery.contract.test.mjs && ${nodeTestCommand} scripts/workspace-local-schema.contract.test.mjs && ${nodeTestCommand} scripts/workspace-local-recovery.contract.test.mjs && ${nodeTestCommand} scripts/workspace-local-snapshot.contract.test.mjs && ${nodeTestCommand} scripts/workspace-startup-recovery-smoke.contract.test.mjs && ${nodeTestCommand} scripts/workspace-high-risk-flush-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-dialog-state.contract.test.mjs && ${nodeTestCommand} scripts/workspace-dialog-runtime.contract.test.mjs && ${nodeTestCommand} scripts/workspace-create-note-runtime.contract.test.mjs && ${nodeTestCommand} scripts/workspace-hotkey-runtime.contract.test.mjs && ${nodeTestCommand} scripts/workspace-sidebar-resize-runtime.contract.test.mjs && ${nodeTestCommand} scripts/workspace-read-strategy-registry.contract.test.mjs && ${nodeTestCommand} scripts/workspace-read-strategy.contract.test.mjs && ${nodeTestCommand} scripts/workspace-data-source.contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-state-machine.contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-remote-apply.contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-app-sdk-contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-app-sdk-target-contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-app-sdk-result-adapter-contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-app-sdk-service-contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-app-sdk-upstream-closure-contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-app-sdk-generated-output-contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-queue.contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-write-path.contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-worker.contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-worker-runtime.contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-runtime-boundary.contract.test.mjs && ${nodeTestCommand} scripts/workspace-sync-connectivity-runtime.contract.test.mjs && ${nodeTestCommand} scripts/workspace-store-bootstrap.contract.test.mjs && ${nodeTestCommand} scripts/workspace-view-model.contract.test.mjs && ${nodeTestCommand} scripts/workspace-command-palette.contract.test.mjs && ${nodeTestCommand} scripts/workspace-search-schema.contract.test.mjs && ${nodeTestCommand} scripts/workspace-search-query.contract.test.mjs && ${nodeTestCommand} scripts/workspace-search-performance.contract.test.mjs && node scripts/future-capability-packages.contract.check.mjs && ${nodeTestCommand} scripts/internal-packages-turbo-contract.test.mjs && ${nodeTestCommand} scripts/auth-tailwind-compilation.contract.test.mjs`,
  );
  assert.equal(
    scripts.test,
    'pnpm test:workspace:contracts && pnpm install:shared-sdk && node scripts/run-internal-packages-turbo.mjs test && pnpm test:app',
  );
  assert.equal(
    scripts['test:desktop:contracts'],
    `pnpm test:workspace:contracts && ${nodeTestCommand} scripts/desktop-session-bridge.contract.test.mjs && ${nodeTestCommand} scripts/desktop-toolchain-env.test.mjs && ${nodeTestCommand} scripts/shared-sdk-local-roots.test.mjs && ${nodeTestCommand} scripts/script-entry.test.mjs && ${nodeTestCommand} scripts/run-cargo-command.test.mjs && ${nodeTestCommand} scripts/release/desktop-targets.test.mjs && ${nodeTestCommand} scripts/run-desktop-release-build.test.mjs && ${nodeTestCommand} scripts/run-desktop-tauri-dev.test.mjs && ${nodeTestCommand} scripts/ensure-tauri-dev-port-free.test.mjs && ${nodeTestCommand} scripts/run-with-shared-sdk-mode.test.mjs && ${nodeTestCommand} scripts/run-with-app-mode.test.mjs && ${nodeTestCommand} scripts/package-scripts-contract.test.mjs && ${nodeTestCommand} scripts/prepare-shared-sdk-git-sources.test.mjs && ${nodeTestCommand} scripts/release-workflow-contract.test.mjs`,
  );
  assert.equal(
    scripts['dev:desktop'],
    'node scripts/run-desktop-tauri-dev.mjs',
  );
  assert.equal(
    scripts['dev:desktop:test-runner'],
    'node scripts/run-desktop-tauri-dev.mjs --mode test',
  );
  assert.equal(
    scripts['build:desktop'],
    'node scripts/run-with-shared-sdk-mode.mjs source -- pnpm --filter @sdkwork/notes-pc-desktop run build:desktop',
  );
  assert.equal(
    scripts['check:desktop:toolchain'],
    'node scripts/run-with-shared-sdk-mode.mjs source -- pnpm --filter @sdkwork/notes-pc-desktop run check:desktop:toolchain',
  );
  assert.equal(
    scripts['release:desktop'],
    'node scripts/run-with-shared-sdk-mode.mjs git -- node scripts/run-desktop-release-build.mjs --phase bundle',
  );
  assert.equal(
    scripts['test:desktop:rust'],
    'node scripts/ensure-desktop-frontend-dist.mjs && node scripts/run-cargo-command.mjs test --manifest-path packages/sdkwork-notes-pc-desktop/src-tauri/Cargo.toml',
  );
  assert.equal(
    desktopScripts['dev:desktop'],
    'vite --host 127.0.0.1 --port 1430 --strictPort',
  );
  assert.equal(
    desktopScripts['dev:desktop:test-runner'],
    'node ../../scripts/run-with-app-mode.mjs test -- pnpm exec vite --host 127.0.0.1 --port 1430 --strictPort --mode standalone.test',
  );
});
