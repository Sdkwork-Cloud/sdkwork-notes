import { describe, expect, it } from 'vitest';
import type { NoteFolder } from '@sdkwork/notes-pc-types';
import {
  decodeSidebarDragPayload,
  encodeSidebarDragPayload,
  isValidSidebarDropTarget,
} from './noteSidebarDragDrop';

function createFolder(id: string, name: string, parentId: string | null = null): NoteFolder {
  return {
    id,
    uuid: `folder-${id}`,
    name,
    parentId,
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T12:00:00Z',
  };
}

describe('noteSidebarDragDrop', () => {
  it('encodes and decodes drag payloads for notes and folders', () => {
    const encoded = encodeSidebarDragPayload({
      kind: 'note',
      id: 'note-7',
    });

    expect(decodeSidebarDragPayload(encoded)).toEqual({
      kind: 'note',
      id: 'note-7',
    });
  });

  it('rejects invalid sidebar drag payloads', () => {
    expect(decodeSidebarDragPayload('')).toBeNull();
    expect(decodeSidebarDragPayload('{bad json')).toBeNull();
    expect(decodeSidebarDragPayload(JSON.stringify({ kind: 'folder' }))).toBeNull();
    expect(decodeSidebarDragPayload(JSON.stringify({ kind: 'user', id: 'x' }))).toBeNull();
  });

  it('prevents moving folders into themselves or their descendants', () => {
    const folders = [
      createFolder('folder-a', 'Projects'),
      createFolder('folder-b', 'Roadmap', 'folder-a'),
      createFolder('folder-c', 'Research', 'folder-b'),
    ];

    expect(isValidSidebarDropTarget({
      dragItem: { kind: 'folder', id: 'folder-a' },
      targetFolderId: 'folder-a',
      folders,
    })).toBe(false);
    expect(isValidSidebarDropTarget({
      dragItem: { kind: 'folder', id: 'folder-a' },
      targetFolderId: 'folder-c',
      folders,
    })).toBe(false);
    expect(isValidSidebarDropTarget({
      dragItem: { kind: 'folder', id: 'folder-b' },
      targetFolderId: null,
      folders,
    })).toBe(true);
  });

  it('allows moving notes to folders or back to the root level', () => {
    const folders = [createFolder('folder-a', 'Projects')];

    expect(isValidSidebarDropTarget({
      dragItem: { kind: 'note', id: 'note-2' },
      targetFolderId: 'folder-a',
      folders,
    })).toBe(true);
    expect(isValidSidebarDropTarget({
      dragItem: { kind: 'note', id: 'note-2' },
      targetFolderId: null,
      folders,
    })).toBe(true);
  });
});
