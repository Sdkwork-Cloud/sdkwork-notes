import { Button } from '@sdkwork/notes-commons';
import { Link } from 'react-router-dom';
import {
  resolveNotesWorkspaceChromeIcon,
  type NotesWorkspacePageCommand,
  type NotesWorkspacePageHeaderAction,
} from '../services';

interface NotesWorkspaceHeaderActionsProps {
  actions: NotesWorkspacePageHeaderAction[];
  onCommandAction: (command: NotesWorkspacePageCommand) => void | Promise<void>;
}

export function NotesWorkspaceHeaderActions({
  actions,
  onCommandAction,
}: NotesWorkspaceHeaderActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const Icon = action.iconKey ? resolveNotesWorkspaceChromeIcon(action.iconKey) : null;

        if (action.kind === 'link') {
          return (
            <Link
              key={action.id}
              to={action.to}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--panel-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--panel-muted)]"
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              {action.label}
            </Link>
          );
        }

        return (
          <Button
            key={action.id}
            onClick={() => {
              void onCommandAction(action.command);
            }}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
