import type { NoteSummary } from '@sdkwork/notes-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAppSdkSessionTokens, initAppSdkClient, resetAppSdkClient } from '@sdkwork/notes-core';
import { createNoteRepository, noteRepository } from './noteRepository';
import type { NoteWorkspaceDataSource } from '../types/notesWorkspace';

const fetchCalls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
let noteDeleted = false;
let note42Status = 'ACTIVE';
let note42ContentText = 'console.log(1);';
let notesPages: Array<Array<Record<string, unknown>>> = [];
let deletedPages: Array<Array<Record<string, unknown>>> = [];

beforeEach(() => {
  fetchCalls.length = 0;
  noteDeleted = false;
  note42Status = 'ACTIVE';
  note42ContentText = 'console.log(1);';
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

    if (url.endsWith('/app/v3/api/filesystem/nodes/folder-7/move') && init?.method === 'PUT') {
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            id: 'folder-7',
            uuid: 'folder-uuid-7',
            name: 'Projects',
            parentId: 'folder-2',
            createdAt: '2026-03-30T00:00:00Z',
            updatedAt: '2026-03-30T12:00:00Z',
          },
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
            text: note42ContentText,
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
            content: 'legacy summary content',
            status: note42Status,
            createdAt: '2026-03-30T00:00:00Z',
            updatedAt: '2026-03-30T12:00:00Z',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/notes/42/archive') && init?.method === 'PUT') {
      note42Status = 'ARCHIVED';
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            noteId: '42',
            operationType: 'ARCHIVE',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.endsWith('/app/v3/api/notes/42/restore') && init?.method === 'PUT') {
      note42Status = 'ACTIVE';
      noteDeleted = false;
      return new Response(
        JSON.stringify({
          code: '2000',
          msg: 'success',
          data: {
            noteId: '42',
            operationType: 'RESTORE',
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

  it('falls back to deleted note listings when loading a trashed note detail', async () => {
    noteDeleted = true;

    const result = await noteRepository.findById('42');

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: '42',
      title: 'Archived draft',
      type: 'code',
      content: 'deleted body',
      deletedAt: '2026-03-30T12:00:00Z',
    });
  });

  it('accepts an empty remote note content payload instead of keeping stale detail content', async () => {
    note42ContentText = '';

    const result = await noteRepository.findById('42');

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: '42',
      content: '',
    });
  });

  it('archives an existing note when the document status changes to archived', async () => {
    const result = await noteRepository.save({
      id: '42',
      publishStatus: 'archived',
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: '42',
      publishStatus: 'archived',
    });

    expect(fetchCalls.some(({ input, init }) =>
      String(input).endsWith('/app/v3/api/notes/42/archive') && init?.method === 'PUT',
    )).toBe(true);
  });

  it('restores an archived note back to draft when the document status changes to draft', async () => {
    note42Status = 'ARCHIVED';

    const result = await noteRepository.save({
      id: '42',
      publishStatus: 'draft',
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: '42',
      publishStatus: 'draft',
    });

    expect(fetchCalls.some(({ input, init }) =>
      String(input).endsWith('/app/v3/api/notes/42/restore') && init?.method === 'PUT',
    )).toBe(true);
  });

  it('moves a folder through the shared app sdk filesystem endpoint', async () => {
    const result = await noteRepository.moveFolder('folder-7', 'folder-2');

    expect(result.success).toBe(true);
    expect(fetchCalls.some(({ input, init }) =>
      String(input).endsWith('/app/v3/api/filesystem/nodes/folder-7/move') && init?.method === 'PUT',
    )).toBe(true);

    const moveRequest = fetchCalls.find(({ input, init }) =>
      String(input).endsWith('/app/v3/api/filesystem/nodes/folder-7/move') && init?.method === 'PUT',
    );

    expect(JSON.parse(String(moveRequest?.init?.body ?? '{}'))).toEqual({
      targetParentId: 'folder-2',
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
    expect(fetchCalls.some(({ input }) =>
      String(input).includes('/app/v3/api/notes?') && String(input).includes('includeArchived=true'),
    )).toBe(true);
  });

  it('delegates workspace snapshot reads through the injected read strategy boundary', async () => {
    const replicaNote: NoteSummary = {
      id: 'note-9',
      uuid: 'note-9',
      title: 'Replica snapshot',
      type: 'doc',
      parentId: null,
      tags: [],
      isFavorite: false,
      snippet: 'Replica snapshot',
      publishStatus: 'draft',
      createdAt: '2026-04-07T00:00:00Z',
      updatedAt: '2026-04-07T00:00:00Z',
    };
    const replicaDataSource: NoteWorkspaceDataSource = {
      driver: 'app-sdk',
      authority: 'remote',
      readStrategy: 'workspace-snapshot',
      writeStrategy: 'direct-write',
      capabilities: {
        localReplica: false,
        readThroughCache: false,
        offlineRead: false,
        offlineWrite: false,
        backgroundSync: false,
        incrementalSync: false,
        conflictResolution: false,
      },
    };

    const loadWorkspaceSnapshot = vi.fn(async () => ({
      success: true,
      data: {
        notes: [replicaNote],
        trashedNotes: [],
        folders: [],
        dataSource: replicaDataSource,
      },
    }));

    const repository = createNoteRepository({
      workspaceReadStrategy: {
        key: 'workspace-snapshot',
        loadWorkspaceSnapshot,
      },
    });

    const result = await repository.queryWorkspaceSnapshot({ keyword: 'replica' });

    expect(loadWorkspaceSnapshot).toHaveBeenCalledTimes(1);
    expect(loadWorkspaceSnapshot).toHaveBeenCalledWith({ keyword: 'replica' });
    expect(result.success).toBe(true);
    expect(result.data?.notes).toEqual([replicaNote]);
  });

  it('selects a registered future read strategy when a read strategy key is configured', async () => {
    const defaultDataSource: NoteWorkspaceDataSource = {
      driver: 'app-sdk',
      authority: 'remote',
      readStrategy: 'workspace-snapshot',
      writeStrategy: 'direct-write',
      capabilities: {
        localReplica: false,
        readThroughCache: false,
        offlineRead: false,
        offlineWrite: false,
        backgroundSync: false,
        incrementalSync: false,
        conflictResolution: false,
      },
    };
    const replicaDataSource: NoteWorkspaceDataSource = {
      driver: 'app-sdk',
      authority: 'remote',
      readStrategy: 'replica-snapshot',
      writeStrategy: 'direct-write',
      capabilities: {
        localReplica: true,
        readThroughCache: false,
        offlineRead: true,
        offlineWrite: false,
        backgroundSync: false,
        incrementalSync: false,
        conflictResolution: false,
      },
    };
    const replicaNote: NoteSummary = {
      id: 'note-88',
      uuid: 'note-88',
      title: 'Replica note',
      type: 'doc',
      parentId: null,
      tags: [],
      isFavorite: false,
      snippet: 'Replica note',
      publishStatus: 'draft',
      createdAt: '2026-04-07T00:00:00Z',
      updatedAt: '2026-04-07T00:00:00Z',
    };
    const defaultLoadWorkspaceSnapshot = vi.fn(async () => ({
      success: true,
      data: {
        notes: [],
        trashedNotes: [],
        folders: [],
        dataSource: defaultDataSource,
      },
    }));
    const replicaLoadWorkspaceSnapshot = vi.fn(async () => ({
      success: true,
      data: {
        notes: [replicaNote],
        trashedNotes: [],
        folders: [],
        dataSource: replicaDataSource,
      },
    }));

    const repository = createNoteRepository({
      workspaceReadStrategy: {
        key: 'workspace-snapshot',
        loadWorkspaceSnapshot: defaultLoadWorkspaceSnapshot,
      },
      workspaceReadStrategies: [
        {
          key: 'replica-snapshot',
          loadWorkspaceSnapshot: replicaLoadWorkspaceSnapshot,
        },
      ],
      workspaceReadStrategyKey: 'replica-snapshot',
    });

    const result = await repository.queryWorkspaceSnapshot({ keyword: 'replica' });

    expect(defaultLoadWorkspaceSnapshot).not.toHaveBeenCalled();
    expect(replicaLoadWorkspaceSnapshot).toHaveBeenCalledTimes(1);
    expect(replicaLoadWorkspaceSnapshot).toHaveBeenCalledWith({ keyword: 'replica' });
    expect(result.success).toBe(true);
    expect(result.data?.dataSource.readStrategy).toBe('replica-snapshot');
    expect(result.data?.notes.map((note) => note.id)).toEqual(['note-88']);
  });
});
