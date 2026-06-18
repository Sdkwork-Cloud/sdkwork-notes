import type {
  NoteRemoteApplyRequest,
  NoteRemoteApplyResultVO,
} from '../sdk/appSdkPort';
import type {
  NotesSyncConflictCode,
  NotesSyncRemoteApplyRequest,
  NotesSyncTaskExecutionResult,
} from '@sdkwork/notes-pc-sync';

const CONFLICT_CODE_PASSTHROUGH = new Set<NotesSyncConflictCode>([
  'stale-base-version',
  'deleted-remotely',
  'folder-structure-changed',
]);

function normalizeConflictCode(code: string | undefined): NotesSyncConflictCode {
  const normalized = (code || '').trim() as NotesSyncConflictCode;
  if (CONFLICT_CODE_PASSTHROUGH.has(normalized)) {
    return normalized;
  }
  return 'unknown';
}

export function mapNotesSyncRemoteApplyRequestToNoteRemoteApplyRequest(
  request: NotesSyncRemoteApplyRequest,
): NoteRemoteApplyRequest {
  if (request.entityType !== 'note') {
    throw new Error('request.entityType must remain note.');
  }

  return {
    idempotencyKey: request.idempotencyKey,
    taskId: request.taskId,
    entityType: request.entityType,
    entityId: request.entityId,
    operation: request.operation,
    localRevision: request.localRevision,
    baseRemoteCursor: request.baseRemoteCursor,
    mutation: request.mutation,
  };
}

export function mapNoteRemoteApplyResultToNotesSyncTaskExecutionResult(
  result: NoteRemoteApplyResultVO,
): NotesSyncTaskExecutionResult {
  if (result.outcome === 'applied') {
    return {
      type: 'completed',
      at: result.appliedAt || new Date().toISOString(),
      remoteCursor: result.remoteCursor ?? null,
    };
  }

  const conflict = result.conflict;
  return {
    type: 'conflict',
    at: conflict?.occurredAt || new Date().toISOString(),
    conflict: {
      code: normalizeConflictCode(conflict?.code),
      message: conflict?.message || 'Remote apply conflict.',
    },
  };
}
