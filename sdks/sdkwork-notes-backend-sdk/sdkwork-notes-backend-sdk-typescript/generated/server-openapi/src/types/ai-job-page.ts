import type { AiJob } from './ai-job';
import type { PageInfo } from './page-info';

export interface AiJobPage {
  items: AiJob[];
  pageInfo: PageInfo;
}
