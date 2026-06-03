import { Button } from '@sdkwork/notes-commons';

interface NotesWorkspaceErrorBannerProps {
  message: string | null;
  dismissLabel: string;
  retryLabel?: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export function NotesWorkspaceErrorBanner({
  message,
  dismissLabel,
  retryLabel,
  onDismiss,
  onRetry,
}: NotesWorkspaceErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
      <span>{message}</span>
      <div className="flex items-center gap-2">
        {retryLabel && onRetry ? (
          <Button appearance="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        <Button appearance="ghost" onClick={onDismiss}>
          {dismissLabel}
        </Button>
      </div>
    </div>
  );
}
