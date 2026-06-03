import { type LucideIcon } from 'lucide-react';
import {
  resolveNotesWorkspaceChromeIcon,
  type NotesWorkspacePagePresentationModel,
} from '../services';

interface NotesWorkspaceInsightsPanelProps {
  focusTitle: string;
  pagePresentation: NotesWorkspacePagePresentationModel;
  onSyncAction?: (() => void) | undefined;
}

function WorkspaceMetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div
      data-slot="workspace-metric-card"
      className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--canvas-bg)] px-4 py-4 shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {label}
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-[var(--text-primary)]">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--panel-muted)] text-[var(--text-secondary)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function NotesWorkspaceInsightsPanel({
  focusTitle,
  pagePresentation,
  onSyncAction,
}: NotesWorkspaceInsightsPanelProps) {
  return (
    <div
      data-slot="workspace-insight-grid"
      className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.95fr)]"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pagePresentation.metricCards.map((metric) => {
          const Icon = resolveNotesWorkspaceChromeIcon(metric.iconKey);

          return (
            <WorkspaceMetricCard
              key={metric.id}
              icon={Icon}
              label={metric.label}
              value={metric.value}
            />
          );
        })}
      </div>

      <div className="grid gap-3">
        <div
          data-slot="workspace-focus-card"
          className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--canvas-bg)] px-5 py-5 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {focusTitle}
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--text-primary)]">
                {pagePresentation.focusCard.title}
              </h2>
            </div>
            <div className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {pagePresentation.focusCard.filterLabel}: {pagePresentation.focusCard.filterValue}
            </div>
          </div>

          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            {pagePresentation.focusCard.description}
          </p>

          {pagePresentation.focusCard.badges.length > 0 ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {pagePresentation.focusCard.badges.map((badge) => (
                  <span
                    key={badge.id}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pagePresentation.focusCard.details.map((detail) => {
                  const Icon = detail.iconKey ? resolveNotesWorkspaceChromeIcon(detail.iconKey) : null;

                  return (
                    <div
                      key={detail.id}
                      className="rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-bg)] px-4 py-3"
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {detail.label}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        {Icon ? <Icon className="h-4 w-4 text-[var(--text-secondary)]" /> : null}
                        {detail.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <div
          data-slot="workspace-sync-card"
          className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--canvas-bg)] px-5 py-5 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {pagePresentation.syncCard.title}
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--text-primary)]">
                {pagePresentation.syncCard.statusLabel}
              </h2>
            </div>
            {pagePresentation.syncCard.actionLabel && onSyncAction ? (
              <button
                type="button"
                onClick={onSyncAction}
                className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-primary-600"
              >
                {pagePresentation.syncCard.actionLabel}
              </button>
            ) : null}
          </div>

          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            {pagePresentation.syncCard.description}
          </p>

          {pagePresentation.syncCard.badges.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {pagePresentation.syncCard.badges.map((badge) => (
                <span
                  key={badge.id}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pagePresentation.syncCard.details.map((detail) => (
              <div
                key={detail.id}
                className="rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-bg)] px-4 py-3"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {detail.label}
                </div>
                <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  {detail.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
