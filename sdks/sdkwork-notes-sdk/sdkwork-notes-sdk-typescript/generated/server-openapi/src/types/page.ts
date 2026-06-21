export interface Page {
  id: string;
  workspaceId: string;
  title: string;
  snippet?: string;
  driveNodeId: string;
  currentDriveVersionNo: string;
  driveSpaceId: string;
  driveUri: string;
  currentDriveVersionId: string;
  contentType: string;
  contentSchemaVersion: string;
  lifecycleStatus: string;
}
