export interface DriveOrphanDiagnostic {
  pageId: string;
  workspaceId: string;
  driveNodeId: string;
  diagnosticCode: string;
  detail?: string;
}
