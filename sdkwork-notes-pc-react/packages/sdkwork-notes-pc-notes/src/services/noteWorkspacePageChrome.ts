import {
  BookOpenText,
  Clock3,
  Columns3Cog,
  FileCode2,
  FileText,
  FolderTree,
  Newspaper,
  NotebookText,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Star,
  Trash2,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import type { NoteWorkspaceCommandPaletteIconKey } from './noteWorkspaceCommandPaletteModel';
import type { NoteWorkspacePagePresentationIconKey } from './noteWorkspacePagePresentationModel';
import type { NotesWorkspacePageCommand } from './noteWorkspacePageActions';

type Translate = (key: string, values?: Record<string, unknown>) => string;

export type NotesWorkspaceChromeIconKey =
  | NoteWorkspaceCommandPaletteIconKey
  | NoteWorkspacePagePresentationIconKey;

export interface NotesWorkspacePageHeaderCommandAction {
  id:
    | 'new-doc'
    | 'new-article'
    | 'new-code'
    | 'quick-switcher'
    | 'toggle-inspector'
    | 'toggle-sidebar';
  kind: 'command';
  label: string;
  iconKey: NotesWorkspaceChromeIconKey | null;
  command: NotesWorkspacePageCommand;
}

export interface NotesWorkspacePageHeaderLinkAction {
  id: 'account';
  kind: 'link';
  label: string;
  iconKey: NotesWorkspaceChromeIconKey;
  to: string;
}

export type NotesWorkspacePageHeaderAction =
  | NotesWorkspacePageHeaderCommandAction
  | NotesWorkspacePageHeaderLinkAction;

export interface BuildNotesWorkspacePageHeaderActionsOptions {
  t: Translate;
  inspectorOpen: boolean;
  sidebarCollapsed: boolean;
}

const CHROME_ICONS: Record<NotesWorkspaceChromeIconKey, LucideIcon> = {
  account: UserCircle2,
  'book-open-text': BookOpenText,
  clock: Clock3,
  columns: Columns3Cog,
  'file-code': FileCode2,
  'file-text': FileText,
  'folder-tree': FolderTree,
  newspaper: Newspaper,
  notebook: NotebookText,
  'panel-left-close': PanelLeftClose,
  'panel-left-open': PanelLeftOpen,
  search: Search,
  star: Star,
  trash: Trash2,
};

export function resolveNotesWorkspaceChromeIcon(iconKey: NotesWorkspaceChromeIconKey): LucideIcon {
  return CHROME_ICONS[iconKey];
}

export function buildNotesWorkspacePageHeaderActions(
  options: BuildNotesWorkspacePageHeaderActionsOptions,
): NotesWorkspacePageHeaderAction[] {
  const { t, inspectorOpen, sidebarCollapsed } = options;

  return [
    {
      id: 'new-doc',
      kind: 'command',
      label: t('notes.actions.newDoc'),
      iconKey: null,
      command: { type: 'create-note', noteType: 'doc' },
    },
    {
      id: 'new-article',
      kind: 'command',
      label: t('notes.actions.newArticle'),
      iconKey: null,
      command: { type: 'create-note', noteType: 'article' },
    },
    {
      id: 'new-code',
      kind: 'command',
      label: t('notes.actions.newCode'),
      iconKey: null,
      command: { type: 'create-note', noteType: 'code' },
    },
    {
      id: 'quick-switcher',
      kind: 'command',
      label: t('notes.actions.quickSwitcher'),
      iconKey: 'search',
      command: { type: 'open-command-palette' },
    },
    {
      id: 'toggle-inspector',
      kind: 'command',
      label: inspectorOpen
        ? t('notes.actions.hideInspector')
        : t('notes.actions.showInspector'),
      iconKey: 'columns',
      command: { type: 'toggle-inspector' },
    },
    {
      id: 'toggle-sidebar',
      kind: 'command',
      label: sidebarCollapsed
        ? t('notes.actions.showSidebar')
        : t('notes.actions.hideSidebar'),
      iconKey: sidebarCollapsed ? 'panel-left-open' : 'panel-left-close',
      command: { type: 'toggle-sidebar' },
    },
    {
      id: 'account',
      kind: 'link',
      label: t('notes.actions.account'),
      iconKey: 'account',
      to: '/account',
    },
  ];
}
