import type { WorkspaceAdmin } from './workspace-admin';

export interface WorkspacesAdminUpdateResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
