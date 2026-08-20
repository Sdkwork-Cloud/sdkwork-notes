import type { AiJob } from './ai-job';
import type { PageInfo } from './page-info';

export interface AiJobsAdminListResponse {
  code: 0;
  data: unknown & { items: AiJob[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
