export interface NoteRemoteApplyMutationPatch {
  title?: string;
  content?: string;
  parentId?: string | null;
  isFavorite?: boolean;
  publishStatus?: string;
}
