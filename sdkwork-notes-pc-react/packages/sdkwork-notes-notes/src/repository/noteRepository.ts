import type {
  NoteContentUpdateRequest,
  NoteCreateRequest,
  NoteFolderVO,
  NoteUpdateRequest,
  NoteVO,
  PageNoteVO,
  QueryParams,
} from '@sdkwork/app-sdk';
import {
  Result,
  createServiceAdapterController,
} from '@sdkwork/notes-commons';
import {
  getAppSdkClientWithSession,
  unwrapAppSdkResponse,
} from '@sdkwork/notes-core';
import type {
  IBaseService,
  Note,
  NoteFolder,
  NoteSummary,
  Page,
  PageRequest,
  ServiceResult,
} from '@sdkwork/notes-types';

const DEFAULT_PAGE_SIZE = 50;
const MAX_LIST_PAGE_SIZE = 100;
const MAX_SCAN_PAGES = 50;
const FALLBACK_NOTE_TITLE = 'Untitled';
const FALLBACK_FOLDER_NAME = 'Untitled Folder';
const NOTE_TYPE_TAG_PREFIX = '__note_type__:';
const SUPPORTED_NOTE_TYPES = new Set<Note['type']>(['doc', 'article', 'novel', 'log', 'news', 'code']);

interface NoteWorkspaceSnapshot {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
}

export interface NoteRepository extends IBaseService<NoteSummary> {
  queryWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>>;
  findTrashed(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>>;
  getFolders(): Promise<ServiceResult<NoteFolder[]>>;
  findById(id: string): Promise<ServiceResult<Note | null>>;
  save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>>;
  createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>>;
  renameFolder(id: string, newName: string): Promise<ServiceResult<string>>;
  moveToTrash(id: string): Promise<ServiceResult<NoteSummary>>;
  restoreFromTrash(id: string): Promise<ServiceResult<NoteSummary>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  clearTrash(): Promise<ServiceResult<number>>;
  deleteFolder(id: string): Promise<ServiceResult<void>>;
  moveFolder(id: string, newParentId: string | null): Promise<ServiceResult<void>>;
  moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>>;
  delete(entity: NoteSummary): Promise<ServiceResult<void>>;
}

function normalizeString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}

function unwrapRequiredData<T>(payload: unknown, fallback: string) {
  const data = unwrapAppSdkResponse<T>(payload as T, fallback);
  if (data === undefined || data === null) {
    throw new Error(fallback);
  }
  return data;
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  tags.forEach((tag) => {
    const text = normalizeString(tag);
    if (!text || seen.has(text)) {
      return;
    }
    seen.add(text);
    normalized.push(text);
  });
  return normalized;
}

function normalizeNoteType(value: unknown, fallback: Note['type'] = 'doc'): Note['type'] {
  const normalized = normalizeString(value) as Note['type'];
  if (SUPPORTED_NOTE_TYPES.has(normalized)) {
    return normalized;
  }
  return fallback;
}

function stripSystemTags(tags: string[]) {
  return tags.filter((tag) => !tag.startsWith(NOTE_TYPE_TAG_PREFIX));
}

function extractNoteType(tags: string[]): Note['type'] {
  for (const tag of tags) {
    if (!tag.startsWith(NOTE_TYPE_TAG_PREFIX)) {
      continue;
    }
    const candidate = tag.slice(NOTE_TYPE_TAG_PREFIX.length).trim();
    if (SUPPORTED_NOTE_TYPES.has(candidate as Note['type'])) {
      return candidate as Note['type'];
    }
  }
  return 'doc';
}

function withSystemTypeTag(tags: string[], type: Note['type']) {
  const userTags = stripSystemTags(tags);
  return [...userTags, `${NOTE_TYPE_TAG_PREFIX}${normalizeNoteType(type)}`];
}

function createSnippet(value: string) {
  if (!value) {
    return '';
  }
  const plain = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) {
    return '';
  }
  return plain.length <= 300 ? plain : plain.slice(0, 300);
}

function normalizeStatus(value: unknown) {
  return normalizeString(value).toUpperCase();
}

function isDeletedStatus(status: unknown) {
  return normalizeStatus(status) === 'DELETED';
}

function isArchivedStatus(status: unknown) {
  return normalizeStatus(status) === 'ARCHIVED';
}

function toTimestamp(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const text = normalizeString(value);
  if (!text) {
    return 0;
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapNoteSummary(note: NoteVO): NoteSummary {
  const id = normalizeString(note.id) || normalizeString(note.uuid);
  const uuid = normalizeString(note.uuid) || id;
  const createdAt = normalizeString(note.createdAt) || new Date().toISOString();
  const updatedAt = normalizeString(note.updatedAt) || createdAt;
  const status = normalizeStatus(note.status);
  const content = normalizeString(note.content);
  const rawTags = normalizeTags(note.tags);
  const resolvedType = extractNoteType(rawTags);
  const userTags = stripSystemTags(rawTags);

  return {
    id: id || uuid || `note-${Date.now()}`,
    uuid: uuid || id || `note-${Date.now()}`,
    title: normalizeString(note.title) || FALLBACK_NOTE_TITLE,
    type: resolvedType,
    parentId: normalizeString(note.folderId) || null,
    tags: userTags,
    isFavorite: Boolean(note.favorited),
    snippet: normalizeString(note.summary) || createSnippet(content),
    metadata: userTags.length > 0 ? { tags: userTags } : undefined,
    publishStatus: isArchivedStatus(status) ? 'archived' : 'draft',
    createdAt,
    updatedAt,
    deletedAt: isDeletedStatus(status) ? updatedAt : undefined,
  };
}

function mapNote(note: NoteVO, fullContent?: string): Note {
  const summary = mapNoteSummary(note);
  const content = fullContent !== undefined ? fullContent : normalizeString(note.content);
  return {
    ...summary,
    content,
  };
}

function toNoteSummaryFromNote(note: Note): NoteSummary {
  const { content: _content, ...summary } = note;
  return summary;
}

function mapFolder(folder: NoteFolderVO, parentId?: string | null): NoteFolder {
  const id = normalizeString(folder.id) || normalizeString(folder.uuid);
  const uuid = normalizeString(folder.uuid) || id;
  const createdAt = normalizeString(folder.createdAt) || new Date().toISOString();
  const updatedAt = normalizeString(folder.updatedAt) || createdAt;

  return {
    id: id || uuid || `folder-${Date.now()}`,
    uuid: uuid || id || `folder-${Date.now()}`,
    name: normalizeString(folder.name) || FALLBACK_FOLDER_NAME,
    parentId: parentId !== undefined ? parentId : (normalizeString(folder.parentId) || null),
    createdAt,
    updatedAt,
  };
}

function flattenFolders(folders: NoteFolderVO[] | undefined): NoteFolder[] {
  if (!Array.isArray(folders) || folders.length === 0) {
    return [];
  }

  const collected: NoteFolder[] = [];
  const seen = new Set<string>();

  const visit = (items: NoteFolderVO[], parentId?: string | null) => {
    items.forEach((item) => {
      const mapped = mapFolder(item, parentId);
      if (!seen.has(mapped.id)) {
        seen.add(mapped.id);
        collected.push(mapped);
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        visit(item.children, mapped.id);
      }
    });
  };

  visit(folders);
  return collected;
}

function normalizePageRequest(pageRequest?: PageRequest): Required<Pick<PageRequest, 'page' | 'size'>> {
  return {
    page: Math.max(0, pageRequest?.page ?? 0),
    size: Math.max(1, pageRequest?.size ?? DEFAULT_PAGE_SIZE),
  };
}

function buildListParams(
  pageRequest?: PageRequest,
  overrides: {
    includeDeleted?: boolean;
    includeArchived?: boolean;
    favoriteOnly?: boolean;
  } = {},
): QueryParams {
  const normalized = normalizePageRequest(pageRequest);
  const params: QueryParams = {
    pageNum: normalized.page + 1,
    pageSize: Math.min(MAX_LIST_PAGE_SIZE, normalized.size),
    sortField: 'updatedAt',
    sortOrder: 'desc',
    includeDeleted: Boolean(overrides.includeDeleted),
    includeArchived: Boolean(overrides.includeArchived),
    favoriteOnly: Boolean(overrides.favoriteOnly),
  };
  const keyword = normalizeString(pageRequest?.keyword);
  if (keyword) {
    params.keyword = keyword;
  }
  return params;
}

function toPage<T>(items: T[], pageRequest?: PageRequest): Page<T> {
  const normalized = normalizePageRequest(pageRequest);
  const totalElements = items.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / normalized.size);
  const from = normalized.page * normalized.size;
  const content = items.slice(from, from + normalized.size);

  return {
    content,
    pageable: {
      pageNumber: normalized.page,
      pageSize: normalized.size,
      offset: from,
      paged: true,
      unpaged: false,
      sort: { sorted: true, unsorted: false, empty: false },
    },
    last: totalPages === 0 ? true : normalized.page >= totalPages - 1,
    totalPages,
    totalElements,
    size: normalized.size,
    number: normalized.page,
    sort: { sorted: true, unsorted: false, empty: false },
    first: normalized.page === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

function mergePage(page: PageNoteVO, content: NoteSummary[], pageRequest?: PageRequest): Page<NoteSummary> {
  const normalized = normalizePageRequest(pageRequest);
  const size = page.size ?? normalized.size;
  const number = page.number ?? normalized.page;
  const totalElements = page.totalElements ?? content.length;
  const totalPages = page.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0);

  return {
    content,
    pageable: {
      pageNumber: number,
      pageSize: size,
      offset: number * size,
      paged: true,
      unpaged: false,
      sort: { sorted: true, unsorted: false, empty: false },
    },
    last: page.last ?? (totalPages === 0 ? true : number >= totalPages - 1),
    totalPages,
    totalElements,
    size,
    number,
    sort: { sorted: true, unsorted: false, empty: false },
    first: page.first ?? number === 0,
    numberOfElements: page.numberOfElements ?? content.length,
    empty: page.empty ?? content.length === 0,
  };
}

class AppSdkNoteRepository implements NoteRepository {
  private getClient() {
    return getAppSdkClientWithSession();
  }

  private async listNotesPage(params: QueryParams) {
    const response = await this.getClient().note.listNotes(params);
    return unwrapRequiredData<PageNoteVO>(response, 'Failed to list notes');
  }

  private async listDeletedNoteVOs(keyword?: string) {
    const found: NoteVO[] = [];
    const seenIds = new Set<string>();
    for (let pageNum = 1; pageNum <= MAX_SCAN_PAGES; pageNum += 1) {
      const page = await this.listNotesPage({
        pageNum,
        pageSize: MAX_LIST_PAGE_SIZE,
        sortField: 'updatedAt',
        sortOrder: 'desc',
        includeDeleted: true,
        includeArchived: false,
        favoriteOnly: false,
        ...(keyword ? { keyword } : {}),
      });
      const content: NoteVO[] = Array.isArray(page.content) ? page.content : [];
      content.forEach((item: NoteVO) => {
        if (!isDeletedStatus(item.status)) {
          return;
        }
        const id = normalizeString(item.id) || normalizeString(item.uuid);
        if (!id || seenIds.has(id)) {
          return;
        }
        seenIds.add(id);
        found.push(item);
      });
      if (page.last || content.length === 0) {
        break;
      }
    }
    found.sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt));
    return found;
  }

  private async listActiveNoteVOs() {
    const found: NoteVO[] = [];
    const seenIds = new Set<string>();

    for (let pageNum = 1; pageNum <= MAX_SCAN_PAGES; pageNum += 1) {
      const page = await this.listNotesPage({
        pageNum,
        pageSize: MAX_LIST_PAGE_SIZE,
        sortField: 'updatedAt',
        sortOrder: 'desc',
        includeDeleted: false,
        includeArchived: false,
        favoriteOnly: false,
      });
      const content: NoteVO[] = Array.isArray(page.content) ? page.content : [];
      content.forEach((item: NoteVO) => {
        if (isDeletedStatus(item.status)) {
          return;
        }
        const id = normalizeString(item.id) || normalizeString(item.uuid);
        if (!id || seenIds.has(id)) {
          return;
        }
        seenIds.add(id);
        found.push(item);
      });
      if (page.last || content.length === 0) {
        break;
      }
    }

    found.sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt));
    return found;
  }

  private async findDeletedById(id: string) {
    const normalizedId = normalizeString(id);
    if (!normalizedId) {
      return null;
    }
    const deleted = await this.listDeletedNoteVOs();
    return deleted.find((item) => {
      const itemId = normalizeString(item.id) || normalizeString(item.uuid);
      return itemId === normalizedId;
    }) || null;
  }

  private async loadSummaryById(id: string, allowDeleted = false): Promise<NoteSummary> {
    const detailResult = await this.findById(id);
    if (detailResult.success && detailResult.data) {
      return toNoteSummaryFromNote(detailResult.data);
    }
    if (allowDeleted) {
      const deleted = await this.findDeletedById(id);
      if (deleted) {
        return mapNoteSummary(deleted);
      }
    }
    throw new Error('Note not found');
  }

  private async toggleFavorite(id: string, enabled: boolean) {
    if (enabled) {
      await this.getClient().note.favorite(id);
      return;
    }
    await this.getClient().note.unfavorite(id);
  }

  async queryWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>> {
    try {
      const [activeNotes, deletedNotes, foldersResult] = await Promise.all([
        this.listActiveNoteVOs(),
        this.listDeletedNoteVOs(normalizeString(pageRequest?.keyword) || undefined),
        this.getFolders(),
      ]);

      if (!foldersResult.success) {
        return Result.error(foldersResult.message || 'Failed to query folders');
      }

      return Result.success({
        notes: activeNotes.map((item) => mapNoteSummary(item)),
        trashedNotes: deletedNotes.map((item) => mapNoteSummary(item)),
        folders: foldersResult.data || [],
      });
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to query workspace snapshot'));
    }
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    try {
      const page = await this.listNotesPage(buildListParams(pageRequest, { includeDeleted: false }));
      const content: NoteVO[] = Array.isArray(page.content) ? page.content : [];
      const mapped = content
        .filter((item: NoteVO) => !isDeletedStatus(item.status))
        .map((item: NoteVO) => mapNoteSummary(item));
      return Result.success(mergePage(page, mapped, pageRequest));
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to query notes'));
    }
  }

  async findTrashed(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    try {
      const deleted = await this.listDeletedNoteVOs(normalizeString(pageRequest?.keyword) || undefined);
      return Result.success(toPage(deleted.map((item) => mapNoteSummary(item)), pageRequest));
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to query trashed notes'));
    }
  }

  async getFolders(): Promise<ServiceResult<NoteFolder[]>> {
    try {
      const response = await this.getClient().note.listFolders();
      const folders = unwrapRequiredData<NoteFolderVO[]>(response, 'Failed to query folders');
      return Result.success(flattenFolders(folders));
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to query folders'));
    }
  }

  async findById(id: string): Promise<ServiceResult<Note | null>> {
    const noteId = normalizeString(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }

    try {
      const detailData = unwrapAppSdkResponse<NoteVO | null>(
        await this.getClient().note.getNoteDetail(noteId),
        'Failed to load note detail',
      );

      if (!detailData) {
        return Result.success(null);
      }

      let text = normalizeString(detailData.content);
      try {
        const contentResponse = await this.getClient().note.getNoteContent(noteId);
        const contentData = unwrapAppSdkResponse<{ text?: string } | null>(
          contentResponse,
          'Failed to load note content',
        );
        const remoteText = normalizeString(contentData?.text);
        if (remoteText) {
          text = remoteText;
        }
      } catch {
        // keep summary content
      }

      return Result.success(mapNote(detailData, text));
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to load note'));
    }
  }

  async save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>> {
    try {
      const noteId = normalizeString(entity.id);
      if (!noteId) {
        const body: NoteCreateRequest = {
          title: normalizeString(entity.title) || FALLBACK_NOTE_TITLE,
          content: entity.content ?? '',
          folderId: normalizeString(entity.parentId) || undefined,
          tags: withSystemTypeTag(normalizeTags(entity.tags), normalizeNoteType(entity.type, 'doc')),
        };
        const createResponse = await this.getClient().note.createNote(body);
        const operation = unwrapRequiredData<{ noteId?: number | string }>(createResponse, 'Failed to create note');
        const createdId = normalizeString(operation.noteId);
        if (!createdId) {
          return Result.error('Create note succeeded but noteId is missing');
        }
        if (entity.isFavorite) {
          await this.toggleFavorite(createdId, true);
        }
        const summary = await this.loadSummaryById(createdId, false);
        return Result.success(summary);
      }

      const updatePayload: NoteUpdateRequest = {};
      let hasMetadataUpdate = false;
      if (entity.title !== undefined) {
        updatePayload.title = normalizeString(entity.title) || FALLBACK_NOTE_TITLE;
        hasMetadataUpdate = true;
      }
      if (entity.tags !== undefined || entity.type !== undefined) {
        updatePayload.tags = withSystemTypeTag(
          normalizeTags(entity.tags),
          normalizeNoteType(entity.type, 'doc'),
        );
        hasMetadataUpdate = true;
      }
      if (hasMetadataUpdate) {
        await this.getClient().note.updateNote(noteId, updatePayload);
      }

      if (entity.content !== undefined) {
        const contentPayload: NoteContentUpdateRequest = {
          text: entity.content ?? '',
          bumpVersion: true,
        };
        await this.getClient().note.updateNoteContent(noteId, contentPayload);
      }

      if (entity.parentId !== undefined) {
        await this.getClient().note.move(noteId, {
          folderId: normalizeString(entity.parentId) || undefined,
        });
      }

      if (entity.isFavorite !== undefined) {
        await this.toggleFavorite(noteId, Boolean(entity.isFavorite));
      }

      if (entity.deletedAt !== undefined) {
        if (entity.deletedAt) {
          await this.getClient().note.deleteNote(noteId);
        } else {
          await this.getClient().note.restore(noteId);
        }
      }

      const summary = await this.loadSummaryById(noteId, Boolean(entity.deletedAt));
      return Result.success(summary);
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to save note'));
    }
  }

  async createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>> {
    try {
      const response = await this.getClient().note.createFolder({
        name: normalizeString(name) || FALLBACK_FOLDER_NAME,
        parentId: normalizeString(parentId) || undefined,
      });
      const folder = unwrapRequiredData<NoteFolderVO>(response, 'Failed to create folder');
      return Result.success(mapFolder(folder));
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to create folder'));
    }
  }

  async renameFolder(id: string, newName: string): Promise<ServiceResult<string>> {
    const folderId = normalizeString(id);
    if (!folderId) {
      return Result.error('Folder id is required');
    }
    try {
      const response = await this.getClient().note.updateFolder(folderId, {
        name: normalizeString(newName) || FALLBACK_FOLDER_NAME,
      });
      const folder = unwrapRequiredData<NoteFolderVO>(response, 'Failed to rename folder');
      const resolvedId = normalizeString(folder.id) || folderId;
      return Result.success(resolvedId);
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to rename folder'));
    }
  }

  async moveToTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    const noteId = normalizeString(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }
    try {
      await this.getClient().note.deleteNote(noteId);
      const summary = await this.loadSummaryById(noteId, true);
      return Result.success(summary);
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to move note to trash'));
    }
  }

  async restoreFromTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    const noteId = normalizeString(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }
    try {
      await this.getClient().note.restore(noteId);
      const summary = await this.loadSummaryById(noteId, false);
      return Result.success(summary);
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to restore note'));
    }
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    const noteId = normalizeString(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }
    try {
      await this.getClient().note.permanentlyDelete(noteId);
      return Result.success(undefined);
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to permanently delete note'));
    }
  }

  async clearTrash(): Promise<ServiceResult<number>> {
    try {
      const deleted = await this.listDeletedNoteVOs();
      await this.getClient().note.clearTrash();
      return Result.success(deleted.length);
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to clear trash'));
    }
  }

  async deleteFolder(id: string): Promise<ServiceResult<void>> {
    const folderId = normalizeString(id);
    if (!folderId) {
      return Result.error('Folder id is required');
    }
    try {
      await this.getClient().note.deleteFolder(folderId);
      return Result.success(undefined);
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to delete folder'));
    }
  }

  async moveFolder(_id: string, _newParentId: string | null): Promise<ServiceResult<void>> {
    return Result.error('Folder move is not available in the current SDK round.');
  }

  async moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>> {
    const noteId = normalizeString(note.id);
    if (!noteId) {
      return Result.error('Note id is required');
    }
    try {
      await this.getClient().note.move(noteId, {
        folderId: normalizeString(newParentId) || undefined,
      });
      return Result.success(undefined);
    } catch (error) {
      return Result.error(toErrorMessage(error, 'Failed to move note'));
    }
  }

  async delete(entity: NoteSummary): Promise<ServiceResult<void>> {
    return this.deleteById(entity.id);
  }

  async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
    for (const id of ids) {
      const result = await this.deleteById(id);
      if (!result.success) {
        return Result.error(result.message || 'Failed to delete notes');
      }
    }
    return Result.success(undefined);
  }

  async findAllById(ids: string[]): Promise<ServiceResult<NoteSummary[]>> {
    const found: NoteSummary[] = [];
    for (const id of ids) {
      const result = await this.findById(id);
      if (!result.success || !result.data) {
        continue;
      }
      found.push(toNoteSummaryFromNote(result.data));
    }
    return Result.success(found);
  }

  async saveAll(entities: Partial<NoteSummary>[]): Promise<ServiceResult<NoteSummary[]>> {
    const saved: NoteSummary[] = [];
    for (const entity of entities) {
      const result = await this.save(entity as Partial<Note>);
      if (!result.success || !result.data) {
        return Result.error(result.message || 'Failed to save notes');
      }
      saved.push(result.data);
    }
    return Result.success(saved);
  }

  async count(): Promise<number> {
    const result = await this.findAll({ page: 0, size: 1 });
    if (!result.success || !result.data) {
      return 0;
    }
    return result.data.totalElements;
  }
}

const localNoteRepository: NoteRepository = new AppSdkNoteRepository();
const controller = createServiceAdapterController<NoteRepository>(localNoteRepository);

export const noteRepository: NoteRepository = controller.service;
export const setNoteRepositoryAdapter = (adapter: NoteRepository) => {
  controller.setAdapter(adapter);
};
export const getNoteRepositoryAdapter = () => controller.getAdapter();
export const resetNoteRepositoryAdapter = () => controller.resetAdapter();

export type { NoteWorkspaceSnapshot };
