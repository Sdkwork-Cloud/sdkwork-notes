import type { PageInfo } from './page-info';
import type { Workspace } from './workspace';

export interface WorkspacesListResponse {
  code: 0;
  data: unknown & { items: Workspace[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
