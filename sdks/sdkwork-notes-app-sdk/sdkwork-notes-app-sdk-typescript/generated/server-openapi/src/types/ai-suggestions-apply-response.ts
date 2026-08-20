import type { PageContent } from './page-content';

export interface AiSuggestionsApplyResponse {
  code: 0;
  data: unknown & { item: PageContent; };
  /** Server-owned request correlation id. */
  traceId: string;
}
