import type { ExportJob } from './export-job';

export interface ExportsRetrieveResponse {
  code: 0;
  data: unknown & { item: ExportJob; };
  /** Server-owned request correlation id. */
  traceId: string;
}
