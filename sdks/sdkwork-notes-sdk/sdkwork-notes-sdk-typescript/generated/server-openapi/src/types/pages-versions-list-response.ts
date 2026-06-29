import type { DriveVersionSummary } from './drive-version-summary';
import type { PageInfo } from './page-info';

export interface PagesVersionsListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
