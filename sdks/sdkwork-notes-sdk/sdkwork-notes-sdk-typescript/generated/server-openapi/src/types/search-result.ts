import type { PageSummary } from './page-summary';

export interface SearchResult {
  page: PageSummary;
  highlights?: string[];
  sourceDriveVersionId?: string;
  sourceDriveVersionNo: string;
}
