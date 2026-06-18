export interface CreateWorkspaceRequest {
  tenantId: string;
  organizationId: string;
  operatorId: string;
  id: string;
  ownerSubjectType?: 'user' | 'group' | 'organization' | 'app';
  ownerSubjectId?: string;
  name: string;
  description?: string;
  driveSpaceId: string;
  defaultPageContentType?: string;
  defaultPageSchemaVersion?: string;
  aiIndexPolicyCode?: string;
}
