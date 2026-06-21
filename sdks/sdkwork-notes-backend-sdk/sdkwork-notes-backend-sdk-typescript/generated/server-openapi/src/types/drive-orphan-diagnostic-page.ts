import type { DriveOrphanDiagnostic } from './drive-orphan-diagnostic';
import type { PageInfo } from './page-info';

export interface DriveOrphanDiagnosticPage {
  items: DriveOrphanDiagnostic[];
  pageInfo: PageInfo;
}
