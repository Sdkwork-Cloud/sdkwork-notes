import type { DriveVersionSummary } from './drive-version-summary';
import type { PageInfo } from './page-info';

export interface DriveVersionPage {
  items: DriveVersionSummary[];
  pageInfo: PageInfo;
}
