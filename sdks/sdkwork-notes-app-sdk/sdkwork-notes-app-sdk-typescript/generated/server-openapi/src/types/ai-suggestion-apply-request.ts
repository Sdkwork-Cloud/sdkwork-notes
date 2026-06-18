export interface AiSuggestionApplyRequest {
  tenantId: string;
  organizationId: string;
  operatorId: string;
  expectedDriveVersionId?: string;
  createCheckpoint?: boolean;
}
