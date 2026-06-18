export interface CreatePageRequest {
  tenantId: string;
  organizationId: string;
  operatorId: string;
  id: string;
  title: string;
  pageKind?: 'doc' | 'article' | 'code' | 'log' | 'database' | 'canvas' | 'folder';
  parentPageId?: string;
  folderDriveNodeId?: string;
  initialContent?: Record<string, unknown>;
  contentType?: string;
  contentSchemaVersion?: string;
  changeSummary?: string;
}
