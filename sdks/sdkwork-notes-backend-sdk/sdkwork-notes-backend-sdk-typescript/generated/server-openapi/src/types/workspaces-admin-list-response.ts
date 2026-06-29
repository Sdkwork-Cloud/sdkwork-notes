import type { PageInfo } from './page-info';
import type { WorkspaceAdmin } from './workspace-admin';

export interface WorkspacesAdminListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
