import type { WorkspaceAdmin } from './workspace-admin';

export interface WorkspacesAdminUpdateResponse {
  code: 0;
  data: unknown & { item: WorkspaceAdmin; };
  /** Server-owned request correlation id. */
  traceId: string;
}
