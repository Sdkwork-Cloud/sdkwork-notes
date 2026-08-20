import type { PageInfo } from './page-info';
import type { WorkspaceAdmin } from './workspace-admin';

export interface WorkspacesAdminListResponse {
  code: 0;
  data: unknown & { items: WorkspaceAdmin[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
