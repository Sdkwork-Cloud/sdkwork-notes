import {
  configureAppSdkClientFactory,
  createNotesProductAppSdkClient,
  getNotesGlobalTokenManager,
  type AppSdkClientConfig,
} from '@sdkwork/notes-core';

/**
 * Wires generated Notes app SDK transport, IAM token manager, and the composed product client port.
 */
export function bootstrapSdkClients(): void {
  configureAppSdkClientFactory((config) => createNotesProductAppSdkClient({
    ...(config as AppSdkClientConfig),
    tokenManager: getNotesGlobalTokenManager(),
  }));
}
