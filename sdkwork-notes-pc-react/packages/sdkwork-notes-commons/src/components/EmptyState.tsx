import type { ReactNode } from 'react';

export interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ eyebrow, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col gap-4 text-left">
      {eyebrow ? (
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          {eyebrow}
        </div>
      ) : null}
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        <p className="max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
