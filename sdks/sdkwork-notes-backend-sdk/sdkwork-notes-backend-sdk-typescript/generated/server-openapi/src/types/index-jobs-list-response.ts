import type { IndexJob } from './index-job';
import type { PageInfo } from './page-info';

export interface IndexJobsListResponse {
  code: 0;
  data: unknown & { items: IndexJob[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
