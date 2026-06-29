import type { ExportJob } from './export-job';

export interface ExportsCreateResponse202 {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
