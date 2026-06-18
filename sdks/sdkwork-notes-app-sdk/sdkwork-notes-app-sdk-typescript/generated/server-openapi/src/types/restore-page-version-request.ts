export interface RestorePageVersionRequest {
  tenantId: string;
  organizationId: string;
  operatorId: string;
  expectedCurrentDriveVersionId?: string;
}
