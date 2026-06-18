import type { NotesWorkspaceShortcutHint } from '../services';

interface NotesWorkspaceShortcutHintsProps {
  label: string;
  shortcutHints: NotesWorkspaceShortcutHint[];
}

export function NotesWorkspaceShortcutHints({
  label,
  shortcutHints,
}: NotesWorkspaceShortcutHintsProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
      <span>{label}</span>
      {shortcutHints.map((shortcut) => (
        <div key={shortcut.id} className="contents">
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1">
            {shortcut.keys}
          </span>
          <span>{shortcut.label}</span>
        </div>
      ))}
    </div>
  );
}
