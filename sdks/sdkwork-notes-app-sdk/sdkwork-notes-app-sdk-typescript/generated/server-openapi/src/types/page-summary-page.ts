import type { PageInfo } from './page-info';
import type { PageSummary } from './page-summary';

export interface PageSummaryPage {
  items: PageSummary[];
  pageInfo: PageInfo;
}
