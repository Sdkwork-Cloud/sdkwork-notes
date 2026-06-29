import type { PageInfo } from './page-info';
import type { PageSummary } from './page-summary';

export interface PagesListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
