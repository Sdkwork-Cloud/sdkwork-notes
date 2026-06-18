export interface Page {
  id: string;
  workspaceId: string;
  title: string;
  snippet?: string;
  pageKind?: 'doc' | 'article' | 'code' | 'log' | 'database' | 'canvas' | 'folder';
  driveNodeId: string;
  currentDriveVersionNo: string;
  favorite?: boolean;
  updatedAt: string;
  parentPageId?: string;
  folderDriveNodeId?: string;
  driveSpaceId: string;
  driveUri: string;
  currentDriveVersionId: string;
  contentType: string;
  contentSchemaVersion: string;
  contentHash?: string;
  archiveStatus?: string;
  publishStatus?: string;
  lifecycleStatus: string;
  createdAt: string;
}
