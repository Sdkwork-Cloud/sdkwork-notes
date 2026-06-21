export interface ExportJob {
  id: string;
  workspaceId: string;
  targetType: string;
  targetId?: string;
  exportFormat: string;
  outputDriveNodeId?: string;
  outputDriveUri?: string;
  status: string;
}
