import type { AiSuggestion } from './ai-suggestion';
import type { PageInfo } from './page-info';

export interface PagesAiSuggestionsListResponse {
  code: 0;
  data: unknown & { items: AiSuggestion[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
