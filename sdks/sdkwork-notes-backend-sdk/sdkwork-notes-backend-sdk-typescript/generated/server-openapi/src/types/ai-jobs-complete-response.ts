import type { AiJob } from './ai-job';

export interface AiJobsCompleteResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
