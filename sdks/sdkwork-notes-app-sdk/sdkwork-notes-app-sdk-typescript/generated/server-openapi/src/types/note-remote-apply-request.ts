export interface NoteRemoteApplyRequest {
  idempotencyKey: string;
  taskId: string;
  entityType: string;
  entityId: string;
  operation: string;
  localRevision?: number;
  baseRemoteCursor?: string | null;
  mutation: Record<string, unknown>;
}
