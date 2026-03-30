import { describe, expect, it } from 'vitest';
import type { Note } from '@sdkwork/notes-types';
import {
  countNoteCharacters,
  countNoteWords,
  estimateReadingMinutes,
  formatRelativeNoteTime,
  getVisibleNotes,
} from './noteWorkspaceSelectors';

function createNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    uuid: 'uuid-note-1',
    title: 'Roadmap',
    type: 'doc',
    parentId: null,
    tags: ['planning'],
    isFavorite: false,
    snippet: 'Roadmap summary',
    content: '<p>Hello <strong>world</strong> from Notes Studio.</p>',
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T12:00:00Z',
    ...overrides,
  };
}

describe('noteWorkspaceSelectors', () => {
  it('filters notes by favorites and text query', () => {
    const result = getVisibleNotes({
      notes: [
        {
          id: '1',
          uuid: 'uuid-1',
          title: 'Weekly plan',
          type: 'doc',
          parentId: null,
          tags: ['plan'],
          isFavorite: true,
          snippet: 'Sprint planning',
          createdAt: '2026-03-30T00:00:00Z',
          updatedAt: '2026-03-30T12:00:00Z',
        },
        {
          id: '2',
          uuid: 'uuid-2',
          title: 'Backend notes',
          type: 'code',
          parentId: null,
          tags: ['java'],
          isFavorite: false,
          snippet: 'API adapter',
          createdAt: '2026-03-30T00:00:00Z',
          updatedAt: '2026-03-30T12:00:00Z',
        },
      ],
      trashedNotes: [],
      folders: [],
      activeView: 'favorites',
      searchQuery: 'sprint',
      selectedFolderId: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('1');
  });

  it('applies folder filtering before trimming the recent view to the latest 12 notes', () => {
    const notes = Array.from({ length: 13 }, (_, index) => ({
      id: String(index + 1),
      uuid: `uuid-${index + 1}`,
      title: `Note ${index + 1}`,
      type: 'doc' as const,
      parentId: index === 12 ? 'folder-a' : null,
      tags: [],
      isFavorite: false,
      snippet: `Snippet ${index + 1}`,
      createdAt: '2026-03-30T00:00:00Z',
      updatedAt: `2026-03-${String(30 - index).padStart(2, '0')}T12:00:00Z`,
    }));

    const result = getVisibleNotes({
      notes,
      trashedNotes: [],
      folders: [
        {
          id: 'folder-a',
          uuid: 'folder-a',
          name: 'Projects',
          parentId: null,
          createdAt: '2026-03-30T00:00:00Z',
          updatedAt: '2026-03-30T00:00:00Z',
        },
      ],
      activeView: 'recent',
      searchQuery: '',
      selectedFolderId: 'folder-a',
    });

    expect(result.map((note) => note.id)).toEqual(['13']);
  });

  it('counts words and characters from rendered HTML content', () => {
    const note = createNote();

    expect(countNoteWords(note)).toBe(5);
    expect(countNoteCharacters(note)).toBe('Hello world from Notes Studio.'.length);
  });

  it('estimates reading time using note content length', () => {
    const longNote = createNote({
      content: `<p>${new Array(441).fill('word').join(' ')}</p>`,
    });

    expect(estimateReadingMinutes(longNote)).toBe(3);
  });

  it('formats relative timestamps without depending on local timezone formatting', () => {
    const now = Date.parse('2026-03-30T12:00:00Z');

    expect(formatRelativeNoteTime('2026-03-30T11:30:00Z', 'en-US', now)).toBe('30 minutes ago');
    expect(formatRelativeNoteTime('2026-03-30T12:00:30Z', 'en-US', now)).toBe('in 30 seconds');
  });
});
