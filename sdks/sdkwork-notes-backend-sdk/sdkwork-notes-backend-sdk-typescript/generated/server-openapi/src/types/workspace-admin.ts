export interface WorkspaceAdmin {
  id: string;
  name: string;
  driveSpaceId: string;
  aiIndexPolicyCode?: string;
  pageCount?: string;
  projectionLagCount?: string;
  lifecycleStatus: string;
}
