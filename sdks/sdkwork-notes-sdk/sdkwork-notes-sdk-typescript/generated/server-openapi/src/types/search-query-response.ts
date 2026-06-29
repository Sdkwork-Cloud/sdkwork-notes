import type { PageInfo } from './page-info';
import type { SearchResult } from './search-result';

export interface SearchQueryResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
