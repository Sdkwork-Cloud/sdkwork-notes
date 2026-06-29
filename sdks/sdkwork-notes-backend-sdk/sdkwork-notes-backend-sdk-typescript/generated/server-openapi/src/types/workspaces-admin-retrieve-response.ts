import type { WorkspaceAdmin } from './workspace-admin';

export interface WorkspacesAdminRetrieveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
