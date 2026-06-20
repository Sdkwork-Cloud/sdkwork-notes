import { createClient as createNotesGeneratedClient } from '@sdkwork-internal/notes-app-sdk-generated';
import type { Page, PageContent, PageSummary } from '@sdkwork-internal/notes-app-sdk-generated';
import type {
  AppSdkClientResponse,
  FilesystemMoveRequest,
  NoteContentUpdateRequest,
  NoteContentVO,
  NoteCreateRequest,
  NoteCreateResultVO,
  NoteFolderVO,
  NoteMoveRequest,
  NoteOperationResultVO,
  NoteRemoteApplyRequest,
  NoteRemoteApplyResultVO,
  NoteUpdateRequest,
  NoteVO,
  NotesAppFilesystemClient,
  NotesAppNoteClient,
  NotesAppUserClient,
  NotesRemoteAppClient,
  PageNoteVO,
  QueryParams,
  UserProfileVO,
  UserSettingsVO,
} from './appSdkPort';
import type { AppSdkClientConfig } from './useAppSdkClient';
import { resolveSessionIdentityClaims } from './sessionIdentityClaims';

interface NotesActorContext {
  tenantId: string;
  organizationId: string;
  operatorId: string;
}

function readEnvString(...keys: string[]): string | undefined {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | boolean | undefined>;
  };

  for (const key of keys) {
    const value = meta.env?.[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function readTopologyApplicationHttpUrl(): string | undefined {
  return readEnvString('VITE_SDKWORK_NOTES_APPLICATION_PUBLIC_HTTP_URL');
}

function resolveNotesActorContext(config: AppSdkClientConfig): NotesActorContext {
  const identityClaims = resolveSessionIdentityClaims({
    accessToken: config.accessToken,
    authToken: config.authToken,
  });
  const tenantId = (config.tenantId || identityClaims.tenantId || '').trim();
  const organizationId = (config.organizationId || identityClaims.organizationId || '').trim();
  const operatorId = (identityClaims.userId || '').trim();

  if (!tenantId || !organizationId || !operatorId) {
    throw new Error(
      'Notes app SDK requires tenantId, organizationId, and userId from dual-token JWT claims. Log in through the SaaS IAM session flow instead of configuring fixed identity env variables.',
    );
  }

  return { tenantId, organizationId, operatorId };
}

function mapPageSummaryToNoteVO(page: PageSummary | Page): NoteVO {
  const parentPageId = 'parentPageId' in page ? page.parentPageId : undefined;
  const archiveStatus = 'archiveStatus' in page ? page.archiveStatus : undefined;
  const lifecycleStatus = 'lifecycleStatus' in page ? page.lifecycleStatus : undefined;
  const createdAt = 'createdAt' in page ? page.createdAt : page.updatedAt;

  return {
    id: page.id,
    uuid: page.id,
    title: page.title,
    folderId: parentPageId ?? null,
    parentId: parentPageId ?? null,
    favorited: page.favorite ?? false,
    summary: page.snippet ?? null,
    status: archiveStatus ?? lifecycleStatus ?? null,
    updatedAt: page.updatedAt,
    createdAt,
  };
}

function extractNoteText(content: PageContent | null | undefined): string | null {
  const payload = content?.content;
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.text === 'string') {
    return record.text;
  }
  if (typeof record.content === 'string') {
    return record.content;
  }

  return null;
}

function buildPageContentPayload(text: string): Record<string, unknown> {
  return { text };
}

function mapRemoteApplyMutation(
  mutation: NoteRemoteApplyRequest['mutation'],
): Record<string, unknown> {
  if ('patch' in mutation) {
    return { patch: mutation.patch };
  }
  if ('targetParentId' in mutation) {
    return { targetParentId: mutation.targetParentId };
  }
  return { intent: mutation.intent };
}

function isFolderPage(page: PageSummary | Page): boolean {
  return 'pageKind' in page && page.pageKind === 'folder';
}

function mapPageToFolderVO(page: PageSummary | Page): NoteFolderVO {
  const parentPageId = 'parentPageId' in page ? page.parentPageId : undefined;
  return {
    id: page.id,
    uuid: page.id,
    name: page.title,
    parentId: parentPageId ?? null,
    createdAt: 'createdAt' in page ? page.createdAt : page.updatedAt,
    updatedAt: page.updatedAt,
  };
}

function buildFolderTree(folders: NoteFolderVO[]): NoteFolderVO[] {
  const nodes = new Map<string, NoteFolderVO>();
  folders.forEach((folder) => {
    const id = String(folder.id ?? folder.uuid ?? '');
    if (!id) {
      return;
    }
    nodes.set(id, { ...folder, id, children: [] });
  });

  const roots: NoteFolderVO[] = [];
  nodes.forEach((folder) => {
    const parentId = folder.parentId ? String(folder.parentId) : '';
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (parent) {
      parent.children = [...(parent.children ?? []), folder];
      return;
    }
    roots.push(folder);
  });

  return roots;
}

function mapRemoteApplyResultFromGenerated(
  result: {
    outcome: string;
    taskId: string;
    remoteCursor?: string | null;
    appliedAt?: string;
    conflict?: {
      code: string;
      message: string;
      occurredAt: string;
    };
  },
): NoteRemoteApplyResultVO {
  return {
    outcome: result.outcome === 'conflict' ? 'conflict' : 'applied',
    taskId: result.taskId,
    remoteCursor: result.remoteCursor ?? null,
    appliedAt: result.appliedAt,
    conflict: result.conflict
      ? {
          code: result.conflict.code,
          message: result.conflict.message,
          occurredAt: result.conflict.occurredAt,
        }
      : undefined,
  };
}

export function createNotesProductAppSdkClient(config: AppSdkClientConfig): NotesRemoteAppClient {
  const baseUrl = config.baseUrl || readTopologyApplicationHttpUrl();
  if (!baseUrl) {
    throw new Error(
      'Notes app SDK requires VITE_SDKWORK_NOTES_APPLICATION_PUBLIC_HTTP_URL from the active topology profile.',
    );
  }

  const generated = createNotesGeneratedClient({
    baseUrl,
    timeout: config.timeout,
    authToken: config.authToken,
    accessToken: config.accessToken,
    tokenManager: config.tokenManager as never,
    authMode: config.authMode,
    headers: config.headers,
  });

  let cachedWorkspaceId: string | null = readEnvString('VITE_NOTES_DEFAULT_WORKSPACE_ID') ?? null;

  async function resolveDefaultWorkspaceId(context: NotesActorContext): Promise<string> {
    if (cachedWorkspaceId) {
      return cachedWorkspaceId;
    }

    const workspaces = await generated.notes.workspaces.list({
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      operatorId: context.operatorId,
      page: 1,
      pageSize: 1,
    });
    const firstWorkspace = workspaces.items?.[0];
    if (!firstWorkspace?.id) {
      throw new Error('No Notes workspace is available for the current actor context.');
    }

    cachedWorkspaceId = firstWorkspace.id;
    return firstWorkspace.id;
  }

  async function retrievePage(pageId: string, context: NotesActorContext): Promise<Page> {
    return generated.notes.pages.retrieve(pageId, {
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      operatorId: context.operatorId,
    });
  }

  async function listWorkspacePages(context: NotesActorContext, pageSize = 200) {
    const workspaceId = await resolveDefaultWorkspaceId(context);
    return generated.notes.pages.list(workspaceId, {
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      operatorId: context.operatorId,
      page: 1,
      pageSize,
    });
  }

  const noteClient: NotesAppNoteClient = {
    async listNotes(params: QueryParams): Promise<AppSdkClientResponse<PageNoteVO>> {
      const context = resolveNotesActorContext(config);
      const workspaceId = await resolveDefaultWorkspaceId(context);
      const page = await generated.notes.pages.list(workspaceId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        page: params.pageNum ?? 1,
        pageSize: params.pageSize ?? 50,
        q: params.keyword,
      });

      const content = (page.items ?? [])
        .filter((item) => !isFolderPage(item))
        .map(mapPageSummaryToNoteVO);
      return {
        content,
        totalElements: content.length,
        totalPages: 1,
        size: content.length,
        number: 0,
        numberOfElements: content.length,
        first: true,
        last: true,
        empty: content.length === 0,
      };
    },

    async getNoteDetail(noteId: string): Promise<AppSdkClientResponse<NoteVO | null>> {
      const context = resolveNotesActorContext(config);
      const page = await retrievePage(noteId, context);
      return mapPageSummaryToNoteVO(page);
    },

    async getNoteContent(noteId: string): Promise<AppSdkClientResponse<NoteContentVO | null>> {
      const context = resolveNotesActorContext(config);
      const content = await generated.notes.pages.content.retrieve(noteId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
      });
      return { text: extractNoteText(content) };
    },

    async createNote(body: NoteCreateRequest): Promise<AppSdkClientResponse<NoteCreateResultVO>> {
      const context = resolveNotesActorContext(config);
      const workspaceId = await resolveDefaultWorkspaceId(context);
      const noteId = crypto.randomUUID();
      const page = await generated.notes.pages.create(workspaceId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        id: noteId,
        title: body.title,
        parentPageId: body.folderId,
        initialContent: buildPageContentPayload(body.content),
      });
      return { noteId: page.id };
    },

    async updateNote(noteId: string, body: NoteUpdateRequest): Promise<AppSdkClientResponse<NoteVO | null>> {
      const context = resolveNotesActorContext(config);
      const page = await generated.notes.pages.update(noteId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        title: body.title,
      });
      return mapPageSummaryToNoteVO(page);
    },

    async updateNoteContent(
      noteId: string,
      body: NoteContentUpdateRequest,
    ): Promise<AppSdkClientResponse<NoteContentVO | null>> {
      const context = resolveNotesActorContext(config);
      const currentPage = await retrievePage(noteId, context);
      const content = await generated.notes.pages.content.update(noteId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        content: buildPageContentPayload(body.text),
        expectedDriveVersionId: currentPage.currentDriveVersionId,
      });
      return { text: extractNoteText(content) };
    },

    async move(noteId: string, body: NoteMoveRequest): Promise<AppSdkClientResponse<null>> {
      const context = resolveNotesActorContext(config);
      await generated.notes.pages.update(noteId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        parentPageId: body.folderId ?? null,
      });
      return null;
    },

    async archive(noteId: string): Promise<AppSdkClientResponse<NoteOperationResultVO | null>> {
      const context = resolveNotesActorContext(config);
      await generated.notes.pages.update(noteId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        archiveStatus: 'archived',
      });
      return { noteId, operationType: 'archive' };
    },

    async restore(noteId: string): Promise<AppSdkClientResponse<NoteOperationResultVO | null>> {
      const context = resolveNotesActorContext(config);
      await generated.notes.pages.update(noteId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        archiveStatus: 'active',
      });
      return { noteId, operationType: 'restore' };
    },

    async deleteNote(noteId: string): Promise<AppSdkClientResponse<null>> {
      await noteClient.archive(noteId);
      return null;
    },

    async permanentlyDelete(noteId: string): Promise<AppSdkClientResponse<null>> {
      return null;
    },

    async clearTrash(): Promise<AppSdkClientResponse<null>> {
      return null;
    },

    async favorite(noteId: string): Promise<AppSdkClientResponse<null>> {
      const context = resolveNotesActorContext(config);
      await generated.notes.pages.update(noteId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        favorite: true,
      });
      return null;
    },

    async unfavorite(noteId: string): Promise<AppSdkClientResponse<null>> {
      const context = resolveNotesActorContext(config);
      await generated.notes.pages.update(noteId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        favorite: false,
      });
      return null;
    },

    async listFolders(): Promise<AppSdkClientResponse<NoteFolderVO[]>> {
      const context = resolveNotesActorContext(config);
      const page = await listWorkspacePages(context);
      const folders = (page.items ?? [])
        .filter((item) => isFolderPage(item))
        .map((item) => mapPageToFolderVO(item));
      return buildFolderTree(folders);
    },

    async createFolder(body: { name: string; parentId?: string }): Promise<AppSdkClientResponse<NoteFolderVO>> {
      const context = resolveNotesActorContext(config);
      const workspaceId = await resolveDefaultWorkspaceId(context);
      const folderId = crypto.randomUUID();
      const page = await generated.notes.pages.create(workspaceId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        id: folderId,
        title: body.name,
        parentPageId: body.parentId,
        pageKind: 'folder',
        initialContent: { blocks: [] },
      });
      return mapPageToFolderVO(page);
    },

    async updateFolder(folderId: string, body: { name: string }): Promise<AppSdkClientResponse<NoteFolderVO>> {
      const context = resolveNotesActorContext(config);
      const page = await generated.notes.pages.update(folderId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        title: body.name,
      });
      return mapPageToFolderVO(page);
    },

    async deleteFolder(folderId: string): Promise<AppSdkClientResponse<null>> {
      const context = resolveNotesActorContext(config);
      await generated.notes.pages.remoteApply(folderId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        idempotencyKey: crypto.randomUUID(),
        taskId: crypto.randomUUID(),
        entityType: 'note',
        entityId: folderId,
        operation: 'permanent-delete',
        mutation: { intent: 'permanent-delete' },
      });
      return null;
    },

    async remoteApply(
      noteId: string,
      body: NoteRemoteApplyRequest,
    ): Promise<AppSdkClientResponse<NoteRemoteApplyResultVO>> {
      if (noteId !== body.entityId) {
        throw new Error('path noteId must match request.entityId.');
      }
      if (body.entityType !== 'note') {
        throw new Error('request.entityType must remain note.');
      }

      const context = resolveNotesActorContext(config);
      const result = await generated.notes.pages.remoteApply(noteId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        idempotencyKey: body.idempotencyKey,
        taskId: body.taskId,
        entityType: body.entityType,
        entityId: body.entityId,
        operation: body.operation,
        localRevision: body.localRevision ?? undefined,
        baseRemoteCursor: body.baseRemoteCursor ?? undefined,
        mutation: mapRemoteApplyMutation(body.mutation),
      });

      return mapRemoteApplyResultFromGenerated(result);
    },
  };

  const userClient: NotesAppUserClient = {
    async getUserProfile(): Promise<AppSdkClientResponse<UserProfileVO>> {
      return {
        nickname: 'Notes User',
        email: '',
      };
    },
    async updateUserProfile(body: { nickname: string }): Promise<AppSdkClientResponse<UserProfileVO>> {
      return {
        nickname: body.nickname,
        email: '',
      };
    },
    async getUserSettings(): Promise<AppSdkClientResponse<UserSettingsVO>> {
      return {
        theme: 'system',
        language: 'zh-CN',
      };
    },
    async updateUserSettings(body: {
      theme: string;
      language: string;
    }): Promise<AppSdkClientResponse<UserSettingsVO>> {
      return body;
    },
  };

  const filesystemClient: NotesAppFilesystemClient = {
    async moveNode(nodeId: string, body: FilesystemMoveRequest): Promise<AppSdkClientResponse<NoteFolderVO | null>> {
      const context = resolveNotesActorContext(config);
      const page = await generated.notes.pages.update(nodeId, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        operatorId: context.operatorId,
        parentPageId: body.targetParentId ?? null,
      });
      return mapPageToFolderVO(page);
    },
  };

  return {
    user: userClient,
    note: noteClient,
    filesystem: filesystemClient,
    setAccessToken(accessToken: string) {
      generated.setAccessToken(accessToken);
    },
    setAuthToken(authToken: string) {
      generated.setAuthToken(authToken);
    },
    setTokenManager(tokenManager: unknown) {
      generated.setTokenManager(tokenManager as never);
    },
  };
}
