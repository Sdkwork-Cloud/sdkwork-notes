import type { ExportJob } from './export-job';

export interface ExportsCreateResponse201 {
  code: 0;
  data: unknown & { item: ExportJob; };
  /** Server-owned request correlation id. */
  traceId: string;
}
