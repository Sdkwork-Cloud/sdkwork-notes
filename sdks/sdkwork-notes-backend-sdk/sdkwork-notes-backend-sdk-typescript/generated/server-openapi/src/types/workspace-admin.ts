export interface WorkspaceAdmin {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  driveSpaceId: string;
  aiIndexPolicyCode?: string;
  pageCount?: string;
  projectionLagCount?: string;
  lifecycleStatus: string;
}
