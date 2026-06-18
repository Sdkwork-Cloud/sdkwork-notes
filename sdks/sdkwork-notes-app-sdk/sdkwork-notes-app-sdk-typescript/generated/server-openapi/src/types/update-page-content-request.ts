export interface UpdatePageContentRequest {
  tenantId: string;
  organizationId: string;
  operatorId: string;
  content: Record<string, unknown>;
  contentType?: string;
  contentSchemaVersion?: string;
  changeSummary?: string;
  expectedDriveVersionId?: string;
  createCheckpoint?: boolean;
}
