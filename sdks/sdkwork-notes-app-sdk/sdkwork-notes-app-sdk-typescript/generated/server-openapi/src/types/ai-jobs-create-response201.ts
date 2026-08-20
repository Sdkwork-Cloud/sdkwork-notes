import type { AiJob } from './ai-job';

export interface AiJobsCreateResponse201 {
  code: 0;
  data: unknown & { item: AiJob; };
  /** Server-owned request correlation id. */
  traceId: string;
}
