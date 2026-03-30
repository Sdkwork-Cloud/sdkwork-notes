export type NoteType = 'doc' | 'article' | 'novel' | 'log' | 'news' | 'code';
export type PublishStatus = 'draft' | 'published' | 'archived';

export interface NoteMetadata {
  coverImage?: string;
  wordCount?: number;
  tags?: string[];
}

export interface NoteSummary {
  id: string;
  uuid: string;
  title: string;
  type: NoteType;
  parentId: string | null;
  tags: string[];
  isFavorite: boolean;
  snippet: string;
  metadata?: NoteMetadata;
  publishStatus?: PublishStatus;
  createdAt: string | number;
  updatedAt: string | number;
  deletedAt?: string | number;
}

export interface Note extends NoteSummary {
  content: string;
}

export interface NoteFolder {
  id: string;
  uuid: string;
  name: string;
  parentId: string | null;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface TreeFolder extends NoteFolder {
  kind: 'folder';
  isExpanded?: boolean;
  children: TreeItem[];
}

export interface TreeNote extends NoteSummary {
  kind: 'note';
}

export type TreeItem = TreeFolder | TreeNote;
