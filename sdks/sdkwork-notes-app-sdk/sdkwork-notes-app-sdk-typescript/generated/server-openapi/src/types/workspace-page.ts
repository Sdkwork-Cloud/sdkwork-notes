import type { PageInfo } from './page-info';
import type { Workspace } from './workspace';

export interface WorkspacePage {
  items: Workspace[];
  pageInfo: PageInfo;
}
