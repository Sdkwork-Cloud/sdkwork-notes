import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { ArrowDownUp, CornerDownLeft, Search, type LucideIcon } from 'lucide-react';
import { Dialog } from '@sdkwork/notes-pc-commons';
import { useNotesTranslation } from '@sdkwork/notes-pc-i18n';
import { getCommandPaletteMatches, type CommandPaletteSearchItem } from '../services';

export interface NoteCommandPaletteItem extends CommandPaletteSearchItem {
  badge?: string;
  icon: LucideIcon;
  onSelect: () => void | Promise<void>;
}

export interface NoteCommandPaletteProps {
  open: boolean;
  items: NoteCommandPaletteItem[];
  modifierKey: string;
  onClose: () => void;
}

export function NoteCommandPalette({
  open,
  items,
  modifierKey,
  onClose,
}: NoteCommandPaletteProps) {
  const { t } = useNotesTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const visibleItems = useMemo(
    () => getCommandPaletteMatches(items, query, 14),
    [items, query],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    setSelectedIndex(0);
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useEffectEvent((item: NoteCommandPaletteItem | undefined) => {
    if (!item) {
      return;
    }

    onClose();
    void item.onSelect();
  });

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((currentValue) => Math.min(currentValue + 1, Math.max(visibleItems.length - 1, 0)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((currentValue) => Math.max(currentValue - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleSelect(visibleItems[selectedIndex]);
    }
  };

  const sectionLabels: Record<string, string> = {
    actions: t('notes.commandPalette.sections.actions'),
    views: t('notes.commandPalette.sections.views'),
    notes: t('notes.commandPalette.sections.notes'),
    folders: t('notes.commandPalette.sections.folders'),
  };

  const groupedItems = useMemo(() => {
    const groups: Array<{ key: string; label: string; items: Array<NoteCommandPaletteItem & { globalIndex: number }> }> = [];
    const groupMap = new Map<string, { key: string; label: string; items: Array<NoteCommandPaletteItem & { globalIndex: number }> }>();

    visibleItems.forEach((item, index) => {
      const key = item.section;
      if (!groupMap.has(key)) {
        const nextGroup = {
          key,
          label: sectionLabels[key] ?? key,
          items: [] as Array<NoteCommandPaletteItem & { globalIndex: number }>,
        };
        groupMap.set(key, nextGroup);
        groups.push(nextGroup);
      }

      groupMap.get(key)?.items.push({
        ...item,
        globalIndex: index,
      });
    });

    return groups;
  }, [sectionLabels, visibleItems]);

  return (
    <Dialog
      open={open}
      title={t('notes.commandPalette.title')}
      description={t('notes.commandPalette.description')}
      onClose={onClose}
    >
      <div data-slot="command-palette" className="space-y-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t('notes.commandPalette.placeholder')}
            className="w-full rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-primary-400"
          />
        </label>

        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1 font-semibold">
            {modifierKey}+K
          </span>
          <span>{t('notes.commandPalette.hints.reopen')}</span>
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1 font-semibold">
            <ArrowDownUp className="inline h-3.5 w-3.5" />
          </span>
          <span>{t('notes.commandPalette.hints.navigate')}</span>
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1 font-semibold">
            <CornerDownLeft className="inline h-3.5 w-3.5" />
          </span>
          <span>{t('notes.commandPalette.hints.execute')}</span>
        </div>

        {groupedItems.length > 0 ? (
          <div data-slot="command-palette-list" className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {groupedItems.map((group) => (
              <section key={group.key} className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {group.label}
                </div>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.globalIndex === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-slot="command-palette-item"
                        data-active={active ? 'true' : 'false'}
                        aria-selected={active}
                        className={`flex w-full items-start gap-3 rounded-[22px] border px-4 py-3 text-left transition ${
                          active
                            ? 'border-[var(--accent-soft-border)] bg-[var(--accent-soft-bg)] shadow-[0_16px_32px_rgba(51,103,246,0.12)]'
                            : 'border-[var(--line-soft)] bg-[var(--panel-muted)] hover:bg-[var(--panel-bg)]'
                        }`}
                        onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                        onClick={() => handleSelect(item)}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          active
                            ? 'bg-primary-600 text-white'
                            : 'bg-[var(--surface-raised)] text-[var(--text-secondary)]'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {item.title}
                            </div>
                            {item.badge ? (
                              <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                                {item.badge}
                              </span>
                            ) : null}
                          </div>
                          {item.subtitle ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                              {item.subtitle}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-8 text-center">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {t('notes.commandPalette.emptyTitle')}
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              {t('notes.commandPalette.emptyDescription')}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
