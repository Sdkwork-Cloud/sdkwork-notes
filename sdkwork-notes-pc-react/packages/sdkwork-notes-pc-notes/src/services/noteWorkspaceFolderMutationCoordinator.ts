import type { NoteFolder } from '@sdkwork/notes-pc-types-commons';
import { normalizeString } from '@sdkwork/notes-pc-commons';

export const INVALID_FOLDER_MOVE_MESSAGE = 'Cannot move a folder into itself or one of its descendants';

export interface NoteWorkspaceFolderDeletionPlan {
  status: 'missing' | 'apply';
  removedFolderIds: string[];
  selectedFolderId: string | null;
  expandedFolderIds: string[];
}

export interface NoteWorkspaceFolderMovePlan {
  status: 'missing' | 'noop' | 'invalid' | 'apply';
  nextParentId: string | null;
  expandedFolderIds: string[];
  errorMessage: string | null;
}

function normalizeParentId(parentId: string | null | undefined) {
  return normalizeString(parentId) || null;
}

function normalizeFolderIds(folderIds: string[] | undefined) {
  const seen = new Set<string>();
  const normalizedIds: string[] = [];

  for (const folderId of folderIds ?? []) {
    const normalizedFolderId = normalizeString(folderId);
    if (!normalizedFolderId || seen.has(normalizedFolderId)) {
      continue;
    }

    seen.add(normalizedFolderId);
    normalizedIds.push(normalizedFolderId);
  }

  return normalizedIds;
}

function withExpandedFolder(expandedFolderIds: string[], folderId: string | null | undefined) {
  const normalizedFolderId = normalizeString(folderId);
  if (!normalizedFolderId || expandedFolderIds.includes(normalizedFolderId)) {
    return expandedFolderIds;
  }

  return [...expandedFolderIds, normalizedFolderId];
}

function collectFolderTreeIds(folders: NoteFolder[], rootId: string) {
  const ids = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || ids.has(currentId)) {
      continue;
    }

    ids.add(currentId);
    folders.forEach((folder) => {
      if (folder.parentId === currentId) {
        queue.push(folder.id);
      }
    });
  }

  return ids;
}

export function planDeletedFolderState(options: {
  folders: NoteFolder[];
  deletedFolderId: string;
  selectedFolderId: string | null;
  expandedFolderIds: string[];
}): NoteWorkspaceFolderDeletionPlan {
  const { folders, deletedFolderId, selectedFolderId, expandedFolderIds } = options;
  const normalizedFolderId = normalizeString(deletedFolderId);
  const normalizedSelectedFolderId = normalizeString(selectedFolderId) || null;
  const normalizedExpandedFolderIds = normalizeFolderIds(expandedFolderIds);

  if (!normalizedFolderId || !folders.some((folder) => folder.id === normalizedFolderId)) {
    return {
      status: 'missing',
      removedFolderIds: [],
      selectedFolderId: normalizedSelectedFolderId,
      expandedFolderIds: normalizedExpandedFolderIds,
    };
  }

  const removedFolderIds = Array.from(collectFolderTreeIds(folders, normalizedFolderId));
  const removedFolderIdSet = new Set(removedFolderIds);

  return {
    status: 'apply',
    removedFolderIds,
    selectedFolderId:
      normalizedSelectedFolderId && removedFolderIdSet.has(normalizedSelectedFolderId)
        ? null
        : normalizedSelectedFolderId,
    expandedFolderIds: normalizedExpandedFolderIds.filter((folderId) => !removedFolderIdSet.has(folderId)),
  };
}

export function planMovedFolderState(options: {
  folders: NoteFolder[];
  movedFolderId: string;
  requestedParentId: string | null | undefined;
  expandedFolderIds: string[];
}): NoteWorkspaceFolderMovePlan {
  const { folders, movedFolderId, requestedParentId, expandedFolderIds } = options;
  const normalizedFolderId = normalizeString(movedFolderId);
  const normalizedExpandedFolderIds = normalizeFolderIds(expandedFolderIds);

  if (!normalizedFolderId) {
    return {
      status: 'missing',
      nextParentId: null,
      expandedFolderIds: normalizedExpandedFolderIds,
      errorMessage: null,
    };
  }

  const currentFolder = folders.find((folder) => folder.id === normalizedFolderId);
  if (!currentFolder) {
    return {
      status: 'missing',
      nextParentId: null,
      expandedFolderIds: normalizedExpandedFolderIds,
      errorMessage: null,
    };
  }

  const nextParentId = normalizeParentId(requestedParentId);
  if (normalizeParentId(currentFolder.parentId) === nextParentId) {
    return {
      status: 'noop',
      nextParentId,
      expandedFolderIds: normalizedExpandedFolderIds,
      errorMessage: null,
    };
  }

  if (nextParentId && collectFolderTreeIds(folders, normalizedFolderId).has(nextParentId)) {
    return {
      status: 'invalid',
      nextParentId,
      expandedFolderIds: normalizedExpandedFolderIds,
      errorMessage: INVALID_FOLDER_MOVE_MESSAGE,
    };
  }

  return {
    status: 'apply',
    nextParentId,
    expandedFolderIds: withExpandedFolder(normalizedExpandedFolderIds, nextParentId),
    errorMessage: null,
  };
}
