import type { IndexJob } from './index-job';

export interface WorkspacesProjectionRebuildResponse202 {
  code: 0;
  data: unknown & { item: IndexJob; };
  /** Server-owned request correlation id. */
  traceId: string;
}
