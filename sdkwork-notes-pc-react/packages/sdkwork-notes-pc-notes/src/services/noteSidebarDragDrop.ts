import type { NoteFolder } from '@sdkwork/notes-pc-types';
import { normalizeString } from '@sdkwork/notes-pc-commons';

export const SIDEBAR_DRAG_MIME_TYPE = 'application/x-sdkwork-notes-sidebar-item';

export interface SidebarDragItem {
  kind: 'note' | 'folder';
  id: string;
}

function collectFolderDescendantIds(folders: NoteFolder[], rootId: string) {
  const descendants = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || descendants.has(currentId)) {
      continue;
    }

    descendants.add(currentId);
    folders.forEach((folder) => {
      if (folder.parentId === currentId) {
        queue.push(folder.id);
      }
    });
  }

  return descendants;
}

export function encodeSidebarDragPayload(item: SidebarDragItem) {
  return JSON.stringify({
    kind: item.kind,
    id: normalizeString(item.id),
  });
}

export function decodeSidebarDragPayload(raw: string): SidebarDragItem | null {
  const normalized = normalizeString(raw);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalized) as Partial<SidebarDragItem>;
    const id = normalizeString(parsed.id);
    if (!id) {
      return null;
    }
    if (parsed.kind !== 'note' && parsed.kind !== 'folder') {
      return null;
    }
    return {
      kind: parsed.kind,
      id,
    };
  } catch {
    return null;
  }
}

export function isValidSidebarDropTarget(options: {
  dragItem: SidebarDragItem;
  targetFolderId: string | null;
  folders: NoteFolder[];
}) {
  const targetFolderId = normalizeString(options.targetFolderId) || null;

  if (options.dragItem.kind === 'note') {
    return true;
  }

  const folderId = normalizeString(options.dragItem.id);
  if (!folderId) {
    return false;
  }

  if (!targetFolderId) {
    return true;
  }

  if (targetFolderId === folderId) {
    return false;
  }

  return !collectFolderDescendantIds(options.folders, folderId).has(targetFolderId);
}
