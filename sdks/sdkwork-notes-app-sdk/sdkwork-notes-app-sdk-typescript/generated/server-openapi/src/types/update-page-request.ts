export interface UpdatePageRequest {
  tenantId: string;
  organizationId: string;
  operatorId: string;
  title?: string;
  favorite?: boolean;
  archiveStatus?: string;
  publishStatus?: string;
  parentPageId?: string | null;
  expectedVersion?: string;
}
