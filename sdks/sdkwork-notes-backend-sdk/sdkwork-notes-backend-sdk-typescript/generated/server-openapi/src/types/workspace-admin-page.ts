import type { PageInfo } from './page-info';
import type { WorkspaceAdmin } from './workspace-admin';

export interface WorkspaceAdminPage {
  items: WorkspaceAdmin[];
  pageInfo: PageInfo;
}
