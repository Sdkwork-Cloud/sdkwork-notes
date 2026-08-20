import type { AiJob } from './ai-job';

export interface AiJobsClaimResponse {
  code: 0;
  data: unknown & { item: AiJob; };
  /** Server-owned request correlation id. */
  traceId: string;
}
