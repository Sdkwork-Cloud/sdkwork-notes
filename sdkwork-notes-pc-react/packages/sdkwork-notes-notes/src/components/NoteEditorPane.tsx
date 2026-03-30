import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import {
  Bold,
  Code,
  CheckSquare2,
  Code2,
  Heading2,
  Heading1,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Star,
  Strikethrough,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import CharacterCount from '@tiptap/extension-character-count';
import Gapcursor from '@tiptap/extension-gapcursor';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import { Button, Dialog } from '@sdkwork/notes-commons';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import type { Note } from '@sdkwork/notes-types';
import { countNoteWords, formatRelativeNoteTime } from '../services';
import type { NoteSaveState } from '../types/notesWorkspace';
import { NotesEmptyState } from './NotesEmptyState';

interface NoteEditorPaneProps {
  note: Note | null;
  saveState: NoteSaveState;
  onCreateNote: (type: Note['type']) => void;
  onDraftChange: (patch: Partial<Note>) => void;
  onMoveToTrash: (id: string) => void;
  onSave: () => void;
  onToggleFavorite: (id: string) => void;
}

function ToolbarButton({
  active,
  disabled,
  icon: Icon,
  label,
  shortcut,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: typeof Bold;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
        active
          ? 'border-primary-400 bg-primary-50 text-primary-700'
          : 'border-[var(--line-soft)] bg-[var(--panel-muted)] text-[var(--text-secondary)] hover:bg-[var(--panel-bg)]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function resolveSaveCopy(t: (key: string) => string, saveState: NoteSaveState) {
  if (saveState === 'saving') {
    return t('notes.editor.status.saving');
  }
  if (saveState === 'dirty') {
    return t('notes.editor.status.dirty');
  }
  if (saveState === 'saved') {
    return t('notes.editor.status.saved');
  }
  if (saveState === 'error') {
    return t('notes.editor.status.error');
  }
  return t('notes.editor.status.idle');
}

export function NoteEditorPane({
  note,
  saveState,
  onCreateNote,
  onDraftChange,
  onMoveToTrash,
  onSave,
  onToggleFavorite,
}: NoteEditorPaneProps) {
  const { t, i18n } = useNotesTranslation();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const syncEditorDraft = useEffectEvent((html: string) => {
    if (!note || note.deletedAt) {
      return;
    }
    onDraftChange({ content: html });
  });
  const modifierKey = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd' : 'Ctrl';

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder: t('notes.editor.placeholder'),
        }),
        Underline,
        Highlight.configure({
          multicolor: true,
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Typography,
        Gapcursor,
        CharacterCount,
      ],
      immediatelyRender: false,
      content: note?.content ?? '',
      editable: Boolean(note && !note.deletedAt),
      editorProps: {
        attributes: {
          class:
            'prose prose-slate max-w-none min-h-[420px] px-8 py-6 font-[var(--font-editor)] text-[1.02rem] leading-8 text-[var(--text-primary)] outline-none',
        },
      },
      onUpdate: ({ editor: nextEditor }) => {
        syncEditorDraft(nextEditor.getHTML());
      },
    },
    [note?.id, note?.deletedAt, t],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(Boolean(note && !note.deletedAt));
    const nextContent = note?.content ?? '';
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, {
        emitUpdate: false,
      });
    }
  }, [editor, note?.content, note?.deletedAt, note?.id]);

  const wordCount = useMemo(() => {
    if (editor?.storage.characterCount) {
      return editor.storage.characterCount.words();
    }
    return countNoteWords(note);
  }, [editor, note]);

  const updatedAtLabel = note
    ? formatRelativeNoteTime(note.updatedAt, i18n.language)
    : '';
  const canSaveNow = saveState === 'dirty' || saveState === 'error';
  const canUndo = Boolean(editor?.can().chain().focus().undo().run());
  const canRedo = Boolean(editor?.can().chain().focus().redo().run());

  const handleLinkAction = () => {
    if (!editor) {
      return;
    }

    const previousUrl = String(editor.getAttributes('link').href ?? '');
    setLinkDraft(previousUrl || 'https://');
    setIsLinkDialogOpen(true);
  };

  const closeLinkDialog = () => {
    setIsLinkDialogOpen(false);
  };

  const submitLinkDialog = () => {
    if (!editor) {
      return;
    }

    const normalizedUrl = linkDraft.trim();
    const command = editor.chain().focus().extendMarkRange('link');

    if (!normalizedUrl) {
      command.unsetLink().run();
      closeLinkDialog();
      return;
    }

    command.setLink({ href: normalizedUrl }).run();
    closeLinkDialog();
  };

  const removeLink = () => {
    if (!editor) {
      return;
    }

    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkDraft('');
    closeLinkDialog();
  };

  if (!note) {
    return <NotesEmptyState onCreateNote={onCreateNote} />;
  }

  if (note.deletedAt) {
    return (
      <div className="flex h-full flex-col rounded-[32px] border border-[var(--line-soft)] bg-[var(--canvas-bg)] shadow-[var(--shadow-lg)]">
        <div className="border-b border-[var(--line-soft)] px-8 py-6">
          <div className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
            {t('notes.editor.trashBadge')}
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)]">
            {note.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            {t('notes.editor.trashDescription')}
          </p>
        </div>
        <div className="flex flex-1 flex-col justify-between px-8 py-8">
          <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {t('notes.editor.previewLabel')}
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              {note.content || note.snippet || t('notes.editor.emptyPreview')}
            </p>
          </div>

          <div className="mt-6 text-sm leading-7 text-[var(--text-muted)]">
            {t('notes.editor.trashDescription')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-[32px] border border-[var(--line-soft)] bg-[var(--canvas-bg)] shadow-[var(--shadow-lg)]">
      <div className="border-b border-[var(--line-soft)] px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-[var(--panel-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {resolveSaveCopy(t, saveState)}
            </div>
            <div className="rounded-full bg-[var(--panel-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {t(`notes.types.${note.type}`)}
            </div>
            <div className="rounded-full bg-[var(--panel-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {wordCount} {t('notes.editor.words')}
            </div>
            {updatedAtLabel ? (
              <div className="rounded-full bg-[var(--panel-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {t('notes.editor.editedAt', { value: updatedAtLabel })}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              appearance={canSaveNow ? 'primary' : 'secondary'}
              disabled={!canSaveNow}
              onClick={onSave}
            >
              {saveState === 'saving' ? t('common.loading') : t('common.save')}
            </Button>
            <Button onClick={() => onToggleFavorite(note.id)}>
              <Star className={`h-4 w-4 ${note.isFavorite ? 'fill-current text-amber-500' : ''}`} />
              {note.isFavorite ? t('notes.actions.unfavorite') : t('notes.actions.favorite')}
            </Button>
            <Button onClick={() => onMoveToTrash(note.id)}>
              <Trash2 className="h-4 w-4" />
              {t('notes.actions.moveToTrash')}
            </Button>
          </div>
        </div>

        <input
          type="text"
          value={note.title}
          onChange={(event) => onDraftChange({ title: event.target.value })}
          placeholder={t('notes.editor.titlePlaceholder')}
          className="mt-5 w-full border-none bg-transparent px-0 text-4xl font-black tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div className="border-b border-[var(--line-soft)] px-8 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton
            icon={Undo2}
            label={t('notes.editor.toolbar.undo')}
            active={false}
            disabled={!canUndo}
            shortcut={`${modifierKey}+Z`}
            onClick={() => {
              editor?.chain().focus().undo().run();
            }}
          />
          <ToolbarButton
            icon={Redo2}
            label={t('notes.editor.toolbar.redo')}
            active={false}
            disabled={!canRedo}
            shortcut={`${modifierKey}+Shift+Z`}
            onClick={() => {
              editor?.chain().focus().redo().run();
            }}
          />
          <ToolbarButton
            icon={Heading1}
            label={t('notes.editor.toolbar.headingOne')}
            active={editor?.isActive('heading', { level: 1 })}
            disabled={!editor}
            shortcut={`${modifierKey}+Alt+1`}
            onClick={() => {
              editor?.chain().focus().toggleHeading({ level: 1 }).run();
            }}
          />
          <ToolbarButton
            icon={Heading2}
            label={t('notes.editor.toolbar.headingTwo')}
            active={editor?.isActive('heading', { level: 2 })}
            disabled={!editor}
            shortcut={`${modifierKey}+Alt+2`}
            onClick={() => {
              editor?.chain().focus().toggleHeading({ level: 2 }).run();
            }}
          />
          <ToolbarButton
            icon={Bold}
            label={t('notes.editor.toolbar.bold')}
            active={editor?.isActive('bold')}
            disabled={!editor}
            shortcut={`${modifierKey}+B`}
            onClick={() => {
              editor?.chain().focus().toggleBold().run();
            }}
          />
          <ToolbarButton
            icon={Italic}
            label={t('notes.editor.toolbar.italic')}
            active={editor?.isActive('italic')}
            disabled={!editor}
            shortcut={`${modifierKey}+I`}
            onClick={() => {
              editor?.chain().focus().toggleItalic().run();
            }}
          />
          <ToolbarButton
            icon={UnderlineIcon}
            label={t('notes.editor.toolbar.underline')}
            active={editor?.isActive('underline')}
            disabled={!editor}
            shortcut={`${modifierKey}+U`}
            onClick={() => {
              editor?.chain().focus().toggleUnderline().run();
            }}
          />
          <ToolbarButton
            icon={Strikethrough}
            label={t('notes.editor.toolbar.strike')}
            active={editor?.isActive('strike')}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleStrike().run();
            }}
          />
          <ToolbarButton
            icon={Highlighter}
            label={t('notes.editor.toolbar.highlight')}
            active={editor?.isActive('highlight')}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleHighlight({ color: '#fef3a5' }).run();
            }}
          />
          <ToolbarButton
            icon={Code}
            label={t('notes.editor.toolbar.inlineCode')}
            active={editor?.isActive('code')}
            disabled={!editor}
            shortcut={`${modifierKey}+E`}
            onClick={() => {
              editor?.chain().focus().toggleCode().run();
            }}
          />
          <ToolbarButton
            icon={Code2}
            label={t('notes.editor.toolbar.codeBlock')}
            active={editor?.isActive('codeBlock')}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleCodeBlock().run();
            }}
          />
          <ToolbarButton
            icon={List}
            label={t('notes.editor.toolbar.bullets')}
            active={editor?.isActive('bulletList')}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleBulletList().run();
            }}
          />
          <ToolbarButton
            icon={ListOrdered}
            label={t('notes.editor.toolbar.numbered')}
            active={editor?.isActive('orderedList')}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleOrderedList().run();
            }}
          />
          <ToolbarButton
            icon={CheckSquare2}
            label={t('notes.editor.toolbar.tasks')}
            active={editor?.isActive('taskList')}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleTaskList().run();
            }}
          />
          <ToolbarButton
            icon={Quote}
            label={t('notes.editor.toolbar.quote')}
            active={editor?.isActive('blockquote')}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleBlockquote().run();
            }}
          />
          <ToolbarButton
            icon={Link2}
            label={t('notes.editor.toolbar.link')}
            active={editor?.isActive('link')}
            disabled={!editor}
            shortcut={`${modifierKey}+K`}
            onClick={handleLinkAction}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{t('notes.editor.toolbarTip')}</span>
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-2.5 py-1">
            {modifierKey}+Enter
          </span>
          <span>{t('notes.editor.saveShortcut')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <Dialog
        open={isLinkDialogOpen}
        title={t('notes.editor.linkDialog.title')}
        description={t('notes.editor.linkDialog.description')}
        onClose={closeLinkDialog}
        footer={(
          <>
            <Button appearance="ghost" onClick={closeLinkDialog}>
              {t('common.cancel')}
            </Button>
            <Button appearance="secondary" onClick={removeLink}>
              {t('notes.editor.linkDialog.remove')}
            </Button>
            <Button appearance="primary" onClick={submitLinkDialog}>
              {t('notes.editor.linkDialog.save')}
            </Button>
          </>
        )}
      >
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {t('notes.editor.toolbar.link')}
          </span>
          <input
            autoFocus
            type="url"
            value={linkDraft}
            onChange={(event) => setLinkDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitLinkDialog();
              }
            }}
            placeholder={t('notes.editor.linkDialog.placeholder')}
            className="w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-primary-400"
          />
        </label>
      </Dialog>
    </div>
  );
}
