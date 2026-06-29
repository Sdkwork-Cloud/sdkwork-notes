import type { AiJob } from './ai-job';
import type { PageInfo } from './page-info';

export interface AiJobsAdminListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
