export interface Workspace {
  id: string;
  name: string;
  description?: string;
  driveSpaceId: string;
  defaultPageContentType?: string;
  defaultPageSchemaVersion?: string;
  aiIndexPolicyCode?: string;
  lifecycleStatus: string;
  createdAt: string;
  updatedAt: string;
}
