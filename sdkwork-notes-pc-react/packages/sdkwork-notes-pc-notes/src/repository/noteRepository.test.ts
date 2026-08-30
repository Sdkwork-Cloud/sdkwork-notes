import type { NoteSummary } from '@sdkwork/notes-pc-types-commons';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAppSdkSessionTokens,
  configureAppSdkClientFactory,
  initAppSdkClient,
  resetAppSdkClient,
} from '@sdkwork/notes-pc-core';
import { createNoteRepository, noteRepository } from './noteRepository';
import type { NoteWorkspaceDataSource } from '../types/notesWorkspace';

const sdkCalls: Array<{ method: string; body?: unknown; params?: unknown }> = [];
let noteDeleted = false;
let note42Status = 'ACTIVE';
let note42ContentText = 'console.log(1);';
let notesPages: Array<Array<Record<string, unknown>>> = [];
let deletedPages: Array<Array<Record<string, unknown>>> = [];

beforeEach(() => {
  sdkCalls.length = 0;
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
  configureAppSdkClientFactory(null);
  clearAppSdkSessionTokens();
  configureAppSdkClientFactory(() => ({
    setAccessToken: vi.fn(),
    setAuthToken: vi.fn(),
    user: {} as never,
    note: {
      async listNotes(params) {
        sdkCalls.push({ method: 'note.listNotes', params });
        const includeDeleted = Boolean(params.includeDeleted);
        const pageNum = Number(params.pageNum || 1);
        const currentPage = includeDeleted ? deletedPages : notesPages;
        const pageContent = includeDeleted
          ? (currentPage[pageNum - 1] ?? [])
          : noteDeleted
            ? []
            : (currentPage[pageNum - 1] ?? []);
        return {
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
        };
      },
      async listFolders() {
        sdkCalls.push({ method: 'note.listFolders' });
        return {
          code: '2000',
          msg: 'success',
          data: [],
        };
      },
      async createNote(body) {
        sdkCalls.push({ method: 'note.createNote', body });
        return {
          code: '2000',
          msg: 'success',
          data: {
            noteId: '42',
          },
        };
      },
      async getNoteContent(noteId) {
        sdkCalls.push({ method: 'note.getNoteContent', body: noteId });
        return {
          code: '2000',
          msg: 'success',
          data: {
            text: note42ContentText,
          },
        };
      },
      async getNoteDetail(noteId) {
        sdkCalls.push({ method: 'note.getNoteDetail', body: noteId });
        if (noteDeleted) {
          return {
            code: '2000',
            msg: 'success',
            data: null,
          };
        }
        return {
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
        };
      },
      async archive(noteId) {
        sdkCalls.push({ method: 'note.archive', body: noteId });
        note42Status = 'ARCHIVED';
        return {
          code: '2000',
          msg: 'success',
          data: {
            noteId: '42',
            operationType: 'ARCHIVE',
          },
        };
      },
      async restore(noteId) {
        sdkCalls.push({ method: 'note.restore', body: noteId });
        note42Status = 'ACTIVE';
        noteDeleted = false;
        return {
          code: '2000',
          msg: 'success',
          data: {
            noteId: '42',
            operationType: 'RESTORE',
          },
        };
      },
      async deleteNote(noteId) {
        sdkCalls.push({ method: 'note.deleteNote', body: noteId });
        noteDeleted = true;
        return {
          code: '2000',
          msg: 'success',
          data: null,
        };
      },
      async favorite(noteId) {
        sdkCalls.push({ method: 'note.favorite', body: noteId });
        return { code: '2000', msg: 'success', data: null };
      },
      async unfavorite(noteId) {
        sdkCalls.push({ method: 'note.unfavorite', body: noteId });
        return { code: '2000', msg: 'success', data: null };
      },
      async updateNote(noteId, body) {
        sdkCalls.push({ method: 'note.updateNote', body: { noteId, ...body } });
        return { code: '2000', msg: 'success', data: null };
      },
      async updateNoteContent(noteId, body) {
        sdkCalls.push({ method: 'note.updateNoteContent', body: { noteId, ...body } });
        return { code: '2000', msg: 'success', data: null };
      },
      async move(noteId, body) {
        sdkCalls.push({ method: 'note.move', body: { noteId, ...body } });
        return { code: '2000', msg: 'success', data: null };
      },
      async createFolder(body) {
        sdkCalls.push({ method: 'note.createFolder', body });
        return {
          code: '2000',
          msg: 'success',
          data: {
            id: 'folder-7',
            uuid: 'folder-uuid-7',
            name: body.name,
            parentId: body.parentId,
            createdAt: '2026-03-30T00:00:00Z',
            updatedAt: '2026-03-30T12:00:00Z',
          },
        };
      },
      async updateFolder(folderId, body) {
        sdkCalls.push({ method: 'note.updateFolder', body: { folderId, ...body } });
        return {
          code: '2000',
          msg: 'success',
          data: {
            id: folderId,
            uuid: folderId,
            name: body.name,
            parentId: null,
            createdAt: '2026-03-30T00:00:00Z',
            updatedAt: '2026-03-30T12:00:00Z',
          },
        };
      },
      async permanentlyDelete(noteId) {
        sdkCalls.push({ method: 'note.permanentlyDelete', body: noteId });
        return { code: '2000', msg: 'success', data: null };
      },
      async clearTrash() {
        sdkCalls.push({ method: 'note.clearTrash' });
        return { code: '2000', msg: 'success', data: null };
      },
      async deleteFolder(folderId) {
        sdkCalls.push({ method: 'note.deleteFolder', body: folderId });
        return { code: '2000', msg: 'success', data: null };
      },
      async remoteApply(noteId, body) {
        sdkCalls.push({ method: 'note.remoteApply', body: { noteId, ...body } });
        return {
          code: '2000',
          msg: 'success',
          data: {
            outcome: 'applied',
            taskId: body.taskId,
            remoteCursor: 'remote-cursor-1',
            appliedAt: '2026-03-30T12:00:00Z',
          },
        };
      },
    },
    filesystem: {
      async moveNode(nodeId, body) {
        sdkCalls.push({ method: 'filesystem.moveNode', body: { nodeId, ...body } });
        return {
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
        };
      },
    },
  }));
  initAppSdkClient({ baseUrl: 'https://notes.example.com', accessToken: 'configured-access-token' });
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

  it('creates a note through the injected product app client and persists the system note type tag', async () => {
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

    const createRequest = sdkCalls.find(({ method }) => method === 'note.createNote');

    expect(createRequest).toBeDefined();
    expect(createRequest?.body).toMatchObject({
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

    expect(sdkCalls.some(({ method, body }) =>
      method === 'note.archive' && body === '42',
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

    expect(sdkCalls.some(({ method, body }) =>
      method === 'note.restore' && body === '42',
    )).toBe(true);
  });

  it('moves a folder through the injected product app client filesystem port', async () => {
    const result = await noteRepository.moveFolder('folder-7', 'folder-2');

    expect(result.success).toBe(true);
    expect(sdkCalls.some(({ method }) => method === 'filesystem.moveNode')).toBe(true);

    const moveRequest = sdkCalls.find(({ method }) => method === 'filesystem.moveNode');

    expect(moveRequest?.body).toEqual({
      nodeId: 'folder-7',
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
    expect(sdkCalls.some(({ method, params }) =>
      method === 'note.listNotes'
      && typeof params === 'object'
      && params !== null
      && (params as { includeArchived?: boolean }).includeArchived === true,
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
