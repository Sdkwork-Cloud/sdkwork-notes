import type { IndexJob } from './index-job';
import type { PageInfo } from './page-info';

export interface IndexJobPage {
  items: IndexJob[];
  pageInfo: PageInfo;
}
