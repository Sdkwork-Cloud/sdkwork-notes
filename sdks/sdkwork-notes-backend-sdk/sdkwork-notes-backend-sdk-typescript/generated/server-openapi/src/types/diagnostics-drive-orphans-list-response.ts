import type { DriveOrphanDiagnostic } from './drive-orphan-diagnostic';
import type { PageInfo } from './page-info';

export interface DiagnosticsDriveOrphansListResponse {
  code: 0;
  data: unknown & { items: DriveOrphanDiagnostic[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
