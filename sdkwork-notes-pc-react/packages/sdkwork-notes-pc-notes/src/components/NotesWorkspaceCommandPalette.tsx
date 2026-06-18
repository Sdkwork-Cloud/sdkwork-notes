import { useMemo } from 'react';
import {
  resolveNotesWorkspaceChromeIcon,
  type NoteWorkspaceCommandPaletteItem as NotesWorkspaceCommandPaletteDescriptor,
} from '../services';
import { NoteCommandPalette, type NoteCommandPaletteItem } from './NoteCommandPalette';

interface NotesWorkspaceCommandPaletteProps {
  open: boolean;
  descriptors: NotesWorkspaceCommandPaletteDescriptor[];
  modifierKey: string;
  onClose: () => void;
  onSelectDescriptor: (descriptor: NotesWorkspaceCommandPaletteDescriptor) => void | Promise<void>;
}

export function NotesWorkspaceCommandPalette({
  open,
  descriptors,
  modifierKey,
  onClose,
  onSelectDescriptor,
}: NotesWorkspaceCommandPaletteProps) {
  const items: NoteCommandPaletteItem[] = useMemo(
    () => descriptors.map((descriptor) => ({
      ...descriptor,
      icon: resolveNotesWorkspaceChromeIcon(descriptor.iconKey),
      onSelect: () => onSelectDescriptor(descriptor),
    })),
    [descriptors, onSelectDescriptor],
  );

  return (
    <NoteCommandPalette
      open={open}
      items={items}
      modifierKey={modifierKey}
      onClose={onClose}
    />
  );
}
