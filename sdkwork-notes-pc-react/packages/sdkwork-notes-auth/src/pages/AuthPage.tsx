import { SdkworkAuthPage } from '@sdkwork/auth-pc-react';
import { resolveNotesAuthAppearance, resolveNotesAuthRuntimeConfig } from '../appAuthRuntime';
import { useAuthController } from '../store';
import { SdkworkIamThemeProvider } from '../theme';

export function AuthPage() {
  const controller = useAuthController();

  return (
    <div data-notes-iam-screen="auth">
      <SdkworkIamThemeProvider>
        <SdkworkAuthPage
          appearance={resolveNotesAuthAppearance()}
          basePath="/auth"
          controller={controller}
          homePath="/notes"
          runtimeConfig={resolveNotesAuthRuntimeConfig()}
        />
      </SdkworkIamThemeProvider>
    </div>
  );
}
