import { Button } from '@sdkwork/notes-commons';

interface NotesWorkspaceRecoveryBannerProps {
  title: string;
  description: string;
  caption?: string | null;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
}

export function NotesWorkspaceRecoveryBanner({
  title,
  description,
  caption,
  primaryLabel,
  secondaryLabel,
  onPrimaryAction,
  onSecondaryAction,
}: NotesWorkspaceRecoveryBannerProps) {
  return (
    <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-4 text-sm text-amber-900 dark:text-amber-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
            {title}
          </div>
          <p className="max-w-3xl leading-6 text-amber-900 dark:text-amber-50">
            {description}
          </p>
          {caption ? (
            <p className="text-xs text-amber-700/90 dark:text-amber-100/80">
              {caption}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button appearance="secondary" onClick={onPrimaryAction}>
            {primaryLabel}
          </Button>
          <Button appearance="ghost" onClick={onSecondaryAction}>
            {secondaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
