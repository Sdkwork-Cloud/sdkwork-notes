import { Button } from '@sdkwork/notes-commons';

interface NotesWorkspaceDialogFooterProps {
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function NotesWorkspaceDialogFooter({
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: NotesWorkspaceDialogFooterProps) {
  return (
    <>
      <Button appearance="ghost" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button appearance="danger" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </>
  );
}
