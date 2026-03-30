import { Code2, FileText, Newspaper } from 'lucide-react';
import { Button, EmptyState } from '@sdkwork/notes-commons';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import type { Note } from '@sdkwork/notes-types';

interface NotesEmptyStateProps {
  onCreateNote: (type: Note['type']) => void;
}

export function NotesEmptyState({ onCreateNote }: NotesEmptyStateProps) {
  const { t } = useNotesTranslation();

  return (
    <div className="flex h-full items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl rounded-[32px] border border-[var(--line-soft)] bg-[var(--panel-bg)] p-8 shadow-[var(--shadow-md)]">
        <EmptyState
          eyebrow={t('notes.empty.eyebrow')}
          title={t('notes.empty.title')}
          description={t('notes.empty.description')}
          action={(
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button appearance="primary" onClick={() => onCreateNote('doc')}>
                <FileText className="h-4 w-4" />
                {t('notes.actions.newDoc')}
              </Button>
              <Button onClick={() => onCreateNote('article')}>
                <Newspaper className="h-4 w-4" />
                {t('notes.actions.newArticle')}
              </Button>
              <Button onClick={() => onCreateNote('code')}>
                <Code2 className="h-4 w-4" />
                {t('notes.actions.newCode')}
              </Button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
