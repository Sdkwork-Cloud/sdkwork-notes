import type {
  NotesSyncRemoteApplyRequest,
  NotesSyncTaskExecutionResult,
} from '@sdkwork/notes-pc-sync';
import { getAppSdkClientWithSession } from '../sdk/useAppSdkClient';
import { unwrapAppSdkResponse } from '../sdk/appSdkResult';
import type { NoteRemoteApplyResultVO } from '../sdk/appSdkPort';
import {
  mapNoteRemoteApplyResultToNotesSyncTaskExecutionResult,
  mapNotesSyncRemoteApplyRequestToNoteRemoteApplyRequest,
} from './appNoteSyncRemoteApplyAdapter';

export interface IAppNoteSyncService {
  remoteApply(request: NotesSyncRemoteApplyRequest): Promise<NotesSyncTaskExecutionResult>;
}

export const appNoteSyncService: IAppNoteSyncService = {
  async remoteApply(request) {
    if (request.entityType !== 'note') {
      throw new Error('request.entityType must remain note.');
    }

    const noteRemoteApplyRequest = mapNotesSyncRemoteApplyRequestToNoteRemoteApplyRequest(request);
    const client = getAppSdkClientWithSession();
    const response = unwrapAppSdkResponse<NoteRemoteApplyResultVO>(
      await client.note.remoteApply(request.entityId, noteRemoteApplyRequest),
      'Failed to apply remote sync mutation.',
    );

    return mapNoteRemoteApplyResultToNotesSyncTaskExecutionResult(response);
  },
};
