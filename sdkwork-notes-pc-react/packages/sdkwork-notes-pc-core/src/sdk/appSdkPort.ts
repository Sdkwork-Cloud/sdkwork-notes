import type { AppSdkEnvelope } from './appSdkResult';

export type AppSdkAuthMode = 'dual-token' | 'apikey';

export type AppSdkClientResponse<T> = T | AppSdkEnvelope<T> | null | undefined;

export interface SdkworkAppConfig {
  baseUrl?: string;
  timeout?: number;
  apiKey?: string;
  authToken?: string;
  accessToken?: string;
  refreshToken?: string;
  tenantId?: string;
  organizationId?: string;
  platform?: string;
  tokenManager?: unknown;
  authMode?: AppSdkAuthMode;
  headers?: Record<string, string>;
}

export interface UserProfileVO {
  email?: string | null;
  nickname?: string | null;
  phone?: string | null;
  avatar?: string | null;
}

export interface UserSettingsVO {
  theme?: string | null;
  language?: string | null;
}

export interface NoteCreateRequest {
  title: string;
  content: string;
  folderId?: string;
  tags?: string[];
}

export interface NoteUpdateRequest {
  title?: string;
  tags?: string[];
}

export interface NoteContentUpdateRequest {
  text: string;
  bumpVersion?: boolean;
}

export interface NoteMoveRequest {
  folderId?: string;
}

export interface FilesystemMoveRequest {
  targetParentId?: string;
}

export interface QueryParams {
  pageNum?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
  includeDeleted?: boolean;
  includeArchived?: boolean;
  favoriteOnly?: boolean;
  keyword?: string;
}

export interface NoteVO {
  id?: string | number | null;
  uuid?: string | number | null;
  title?: string | null;
  folderId?: string | number | null;
  parentId?: string | number | null;
  favorited?: boolean | null;
  tags?: unknown;
  summary?: string | null;
  content?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface NoteFolderVO {
  id?: string | number | null;
  uuid?: string | number | null;
  name?: string | null;
  parentId?: string | number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  children?: NoteFolderVO[];
}

export interface PageNoteVO {
  content?: NoteVO[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface NoteCreateResultVO {
  noteId?: string | number | null;
}

export interface NoteOperationResultVO {
  noteId?: string | number | null;
  operationType?: string | null;
}

export interface NoteContentVO {
  text?: string | null;
}

export interface NoteRemoteApplyMutationPatch {
  title?: string;
  content?: string;
  type?: string;
  parentId?: string | null;
  tags?: string[];
  isFavorite?: boolean;
  publishStatus?: string;
}

export type NoteRemoteApplyMutation =
  | { patch: NoteRemoteApplyMutationPatch }
  | { targetParentId: string | null }
  | { intent: 'move-to-trash' | 'restore-from-trash' | 'permanent-delete' };

export interface NoteRemoteApplyRequest {
  idempotencyKey: string;
  taskId: string;
  entityType: 'note' | 'folder';
  entityId: string;
  operation: 'upsert' | 'delete' | 'restore' | 'move' | 'permanent-delete';
  localRevision?: number | null;
  baseRemoteCursor?: string | null;
  mutation: NoteRemoteApplyMutation;
}

export interface NoteRemoteApplyConflictVO {
  code: string;
  message: string;
  occurredAt: string;
}

export interface NoteRemoteApplyResultVO {
  outcome: 'applied' | 'conflict';
  taskId: string;
  remoteCursor?: string | null;
  appliedAt?: string;
  conflict?: NoteRemoteApplyConflictVO;
}

export interface NotesAppUserClient {
  getUserProfile(): Promise<AppSdkClientResponse<UserProfileVO>>;
  updateUserProfile(body: { nickname: string }): Promise<AppSdkClientResponse<UserProfileVO>>;
  getUserSettings(): Promise<AppSdkClientResponse<UserSettingsVO>>;
  updateUserSettings(body: { theme: string; language: string }): Promise<AppSdkClientResponse<UserSettingsVO>>;
}

export interface NotesAppNoteClient {
  archive(noteId: string): Promise<AppSdkClientResponse<NoteOperationResultVO | null>>;
  clearTrash(): Promise<AppSdkClientResponse<null>>;
  createFolder(body: { name: string; parentId?: string }): Promise<AppSdkClientResponse<NoteFolderVO>>;
  createNote(body: NoteCreateRequest): Promise<AppSdkClientResponse<NoteCreateResultVO>>;
  deleteFolder(folderId: string): Promise<AppSdkClientResponse<null>>;
  deleteNote(noteId: string): Promise<AppSdkClientResponse<null>>;
  favorite(noteId: string): Promise<AppSdkClientResponse<null>>;
  getNoteContent(noteId: string): Promise<AppSdkClientResponse<NoteContentVO | null>>;
  getNoteDetail(noteId: string): Promise<AppSdkClientResponse<NoteVO | null>>;
  listFolders(): Promise<AppSdkClientResponse<NoteFolderVO[]>>;
  listNotes(params: QueryParams): Promise<AppSdkClientResponse<PageNoteVO>>;
  move(noteId: string, body: NoteMoveRequest): Promise<AppSdkClientResponse<null>>;
  permanentlyDelete(noteId: string): Promise<AppSdkClientResponse<null>>;
  restore(noteId: string): Promise<AppSdkClientResponse<NoteOperationResultVO | null>>;
  unfavorite(noteId: string): Promise<AppSdkClientResponse<null>>;
  updateFolder(folderId: string, body: { name: string }): Promise<AppSdkClientResponse<NoteFolderVO>>;
  updateNote(noteId: string, body: NoteUpdateRequest): Promise<AppSdkClientResponse<NoteVO | null>>;
  updateNoteContent(noteId: string, body: NoteContentUpdateRequest): Promise<AppSdkClientResponse<NoteContentVO | null>>;
  remoteApply(noteId: string, body: NoteRemoteApplyRequest): Promise<AppSdkClientResponse<NoteRemoteApplyResultVO>>;
}

export interface NotesAppFilesystemClient {
  moveNode(nodeId: string, body: FilesystemMoveRequest): Promise<AppSdkClientResponse<NoteFolderVO | null>>;
}

export interface NotesRemoteAppClient {
  auth?: object;
  user: NotesAppUserClient;
  note: NotesAppNoteClient;
  filesystem: NotesAppFilesystemClient;
  setAccessToken?(accessToken: string): void;
  setAuthToken?(authToken: string): void;
  setTokenManager?(tokenManager: unknown): void;
}

export type NotesRemoteAppClientFactory = (
  config: AppSdkClientFactoryConfig,
) => NotesRemoteAppClient;

export interface AppSdkClientFactoryConfig extends SdkworkAppConfig {
  env: string;
}
