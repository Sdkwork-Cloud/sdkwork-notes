import type { IndexJob } from './index-job';

export interface IndexJobsCreateResponse202 {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
