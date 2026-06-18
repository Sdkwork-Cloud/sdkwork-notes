export interface NoteRemoteApplyRequest {
  tenantId: string;
  organizationId: string;
  operatorId: string;
  idempotencyKey: string;
  taskId: string;
  entityType: string;
  entityId: string;
  operation: string;
  localRevision?: number;
  baseRemoteCursor?: string | null;
  mutation: Record<string, unknown>;
}
