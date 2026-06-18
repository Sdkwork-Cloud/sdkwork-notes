export interface PageSummary {
  id: string;
  workspaceId: string;
  title: string;
  snippet?: string;
  pageKind?: 'doc' | 'article' | 'code' | 'log' | 'database' | 'canvas' | 'folder';
  driveNodeId: string;
  currentDriveVersionNo: string;
  favorite?: boolean;
  updatedAt: string;
}
