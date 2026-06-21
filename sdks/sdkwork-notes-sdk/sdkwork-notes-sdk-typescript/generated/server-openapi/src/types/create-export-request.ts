export interface CreateExportRequest {
  workspaceId: string;
  targetType: 'page' | 'collection' | 'workspace';
  targetId?: string;
  exportFormat: 'markdown' | 'html' | 'pdf' | 'json';
}
