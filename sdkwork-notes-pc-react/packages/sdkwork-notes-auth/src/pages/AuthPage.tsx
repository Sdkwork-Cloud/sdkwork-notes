import { useMemo } from 'react';
import { SdkworkAuthPage } from '@sdkwork/auth-pc-react';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import { createNotesAuthMessages, notesAuthRuntimeConfig } from '../authMessages';
import { useAuthController } from '../store';
import { SdkworkIamThemeProvider } from '../theme';

export function AuthPage() {
  const { t, i18n } = useNotesTranslation();
  const controller = useAuthController();
  const messages = useMemo(() => createNotesAuthMessages(t), [t]);

  return (
    <div data-notes-iam-screen="auth">
      <SdkworkIamThemeProvider>
        <SdkworkAuthPage
          basePath="/auth"
          controller={controller}
          homePath="/notes"
          locale={i18n.language}
          messages={messages}
          runtimeConfig={notesAuthRuntimeConfig}
        />
      </SdkworkIamThemeProvider>
    </div>
  );
}
