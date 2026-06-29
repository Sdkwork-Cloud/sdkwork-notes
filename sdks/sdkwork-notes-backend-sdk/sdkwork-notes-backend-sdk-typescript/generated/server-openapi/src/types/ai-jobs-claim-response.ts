import type { AiJob } from './ai-job';

export interface AiJobsClaimResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
