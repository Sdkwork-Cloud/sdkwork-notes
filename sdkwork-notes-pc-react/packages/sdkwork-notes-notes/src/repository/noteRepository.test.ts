import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAppSdkSessionTokens, initAppSdkClient, resetAppSdkClient } from '@sdkwork/notes-core';
import { noteRepository } from './noteRepository';

const fetchCalls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
let noteDeleted = false;
let notesPages: Array<Array<Record<string, unknown>>> = [];
let deletedPages: Array<Array<Record<string, unknown>>> = [];

beforeEach(() => {
  fetchCalls.length = 0;
  noteDeleted = false;
  notesPages = [[
    {
      id: '1',
      uuid: 'note-1',
      title: 'Roadmap',
      folderId: null,
      favorited: true,
      tags: ['alpha', '__note_type__:article'],
      summary: 'Product roadmap',
      content: 'Body',
      status: 'ACTIVE',
      createdAt: '2026-03-30T00:00:00Z',
      updatedAt: '2026-03-30T12:00:00Z',
    },
  ]];
  deletedPages = [[
    {
      id: '42',
      uuid: 'note-42',
      title: 'Archived draft',
      folderId: null,
      favorited: false,
      tags: ['__note_type__:code'],
      summary: 'Deleted summary',
      content: 'deleted body',
      status: 'DELETED',
      createdAt: '2026-03-30T00:00:00Z',
      updatedAt: '2026-03-30T12:00:00Z',
    },
  ]];
  resetAppSdkClient();
  clearAppSdkSessionTokens();
  initAppSdkClient({ baseUrl: 'https://notes.example.com', accessToken: 'configured-access-token' });

  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ input, init });
    const url = String(input);

    if (/\/app\/v3\/api\/notes(?:\?.*)?$/.test(url) && init?.method !== 'POST') {
      const includeDeleted = url.includes('includeDeleted=true');
      const pageNum = Number(new URL(url).searchParams.get('pageNum') || '1');
      const currentPage = includeDeleted ? deletedPages : notesPages;
      const pageContent = includeDeleted
        ? (currentPage[pageNum - 1] ?? [])
        : noteDeleted
          ? []
          : (currentPage[pageNum - 1] ?? []);
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            content: pageContent,
            totalElements: currentPage.reduce((count, page) => count + page.length, 0),
            totalPages: currentPage.length,
            size: 20,
            number: pageNum - 1,
            numberOfElements: pageContent.length,
            first: pageNum === 1,
            last: pageNum >= currentPage.length,
            empty: pageContent.length === 0,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/notes/folders')) {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/notes') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            noteId: '42',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/notes/42/content')) {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            text: 'console.log(1);',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/notes/42') && init?.method !== 'DELETE') {
      if (noteDeleted) {
        return new Response(
          JSON.stringify({
            code: '2000',
            msg: 'success',
            data: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            id: '42',
            uuid: 'note-42',
            title: 'Untitled',
            folderId: null,
            favorited: false,
            tags: ['snippet', '__note_type__:code'],
            summary: 'Snippet',
            content: 'console.log(1);',
            status: 'ACTIVE',
            createdAt: '2026-03-30T00:00:00Z',
            updatedAt: '2026-03-30T12:00:00Z',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/notes/42') && init?.method === 'DELETE') {
      noteDeleted = true;
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: null,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ code: 404, msg: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

describe('noteRepository', () => {
  it('maps notes list and strips system note type tags', async () => {
    const result = await noteRepository.findAll({ page: 0, size: 20 });

    expect(result.success).toBe(true);
    expect(result.data?.content).toHaveLength(1);
    expect(result.data?.content[0]).toMatchObject({
      id: '1',
      title: 'Roadmap',
      type: 'article',
      tags: ['alpha'],
      isFavorite: true,
      snippet: 'Product roadmap',
    });
  });

  it('creates a note through the generated app sdk and persists the system note type tag', async () => {
    const result = await noteRepository.save({
      title: 'Untitled',
      type: 'code',
      content: 'console.log(1);',
      tags: ['snippet'],
      isFavorite: false,
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: '42',
      type: 'code',
      tags: ['snippet'],
      title: 'Untitled',
    });

    const createRequest = fetchCalls.find(({ input, init }) =>
      String(input).endsWith('/app/v3/api/notes') && init?.method === 'POST',
    );

    expect(createRequest).toBeDefined();
    expect(JSON.parse(String(createRequest?.init?.body ?? '{}'))).toMatchObject({
      title: 'Untitled',
      content: 'console.log(1);',
      tags: ['snippet', '__note_type__:code'],
    });
  });

  it('moves a note to trash and returns the mapped trashed summary', async () => {
    const result = await noteRepository.moveToTrash('42');

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: '42',
      type: 'code',
      deletedAt: '2026-03-30T12:00:00Z',
    });
  });

  it('aggregates every note page when building the workspace snapshot', async () => {
    notesPages = [
      [
        {
          id: '1',
          uuid: 'note-1',
          title: 'Roadmap',
          folderId: null,
          favorited: false,
          tags: ['__note_type__:doc'],
          summary: 'Page one',
          content: 'Body one',
          status: 'ACTIVE',
          createdAt: '2026-03-30T00:00:00Z',
          updatedAt: '2026-03-30T12:00:00Z',
        },
      ],
      [
        {
          id: '2',
          uuid: 'note-2',
          title: 'Spec',
          folderId: null,
          favorited: false,
          tags: ['__note_type__:doc'],
          summary: 'Page two',
          content: 'Body two',
          status: 'ACTIVE',
          createdAt: '2026-03-30T00:00:00Z',
          updatedAt: '2026-03-29T12:00:00Z',
        },
      ],
    ];
    deletedPages = [];

    const result = await noteRepository.queryWorkspaceSnapshot();

    expect(result.success).toBe(true);
    expect(result.data?.notes.map((note) => note.id)).toEqual(['1', '2']);
  });
});
